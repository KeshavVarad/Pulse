import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path"
import axios from "axios"
import multer from "multer"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"

import { Pinecone } from '@pinecone-database/pinecone';
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
    Annotation
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { index } from "./config/pineconeInit.js";

const StateAnnotation = Annotation.Root({
    messages: Annotation({
        reducer: (prev, curr) => prev.concat(curr),
    }),
    config: Annotation(),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


import { VerifyToken } from "./middleware/VerifyToken.js";

import userRoute from "./routes/userRoutes.js"
import practicalRoute from "./routes/practicalRoutes.js"
import commentRoute from "./routes/commentRoutes.js"
import adminRoute from "./routes/adminRoutes.js"
import schoolRoute from "./routes/schoolRoutes.js"
import inviteRoute from "./routes/inviteRoutes.js"
import notificationRoute from "./routes/notificationRoutes.js"

import { Storage } from '@google-cloud/storage'

const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.GCLOUD_KEY_FILE, // Path to the service account key file
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

// Define storage for the uploaded files
const multer_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Save files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Save with original name
    }
});

// Define a file filter to accept only mp4 files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Not an MP4 file!'), false); // Reject the file
    }
};

// Create multer instance with the defined storage and file filter
const upload = multer({ storage: multer_storage, fileFilter: fileFilter });

dotenv.config();

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;

async function computeEmbedding(text) {
    const response = await axios.post(
        "https://api.openai.com/v1/embeddings",
        {
            model: "text-embedding-ada-002",
            input: text,
        },
        {
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data.data[0].embedding;
}


const app = express();

app.use(cors());
app.use(express.json());


app.use(express.urlencoded({ extended: false }));
// app.use(VerifyToken);


if (process.env.MODE != "dev") {
    app.use(express.static(path.join(__dirname, 'build'), {
        maxAge: '1y', // Cache static assets for 1 year
        immutable: true // Files with unique hashes are immutable
    }));
}


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.HOST_NAME);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



app.get('/api/user_guides/:role', (req, res) => {
    const role = req.params.role;

    let tutorialsDir = path.join(__dirname, './build', 'user_guides', role);


    if (process.env.MODE == "dev") {
        tutorialsDir = path.join(__dirname, '../client/public', 'user_guides', role);
    }

    fs.readdir(tutorialsDir, (err, folders) => {
        if (err) {
            return res.status(500).send(`Error reading tutorials directory: ${err}`);
        }
        res.json(folders); // Send folder names
    });
});



app.use('/api', userRoute);
app.use('/api', practicalRoute);
app.use('/api', commentRoute);
app.use('/api', adminRoute);
app.use('/api', schoolRoute);
app.use('/api', inviteRoute);
app.use('/api', notificationRoute);


app.post('/api/getUploadUrl', async (req, res) => {
    try {
        const { fileName, contentType, schoolId, practicalId } = req.body;

        // Validate input
        if (!fileName || !contentType || !schoolId || !practicalId) {
            return res.status(400).json({ error: 'Missing required fields: fileName, contentType, schoolId, or practicalId.' });
        }

        // Construct file path: /school_id/practical_id/filename
        const filePath = `${schoolId}/${practicalId}/${fileName}`;

        const options = {
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType,
        };

        // Generate signed URL for the file
        const [url] = await storage
            .bucket(process.env.GCLOUD_STORAGE_BUCKET)
            .file(filePath)
            .getSignedUrl(options);

        // Return signed URL
        res.status(200).json({ url });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ error: 'Failed to generate signed URL' });
    }
});


const callModel = async (state) => {
    // console.log("State in callModel:", state);
    const { userId, role, filter, isChat } = state.config?.configurable || {};

    if (!userId || !role) {
        throw new Error("Missing userId or role in configuration");
    }

    const messages = state.messages;
    const currentUserQuery = messages[messages.length - 1].content;

    // 1. Compute the embedding for the current query.
    const queryEmbedding = await computeEmbedding(currentUserQuery);

    const practicalNamespace = index.namespace("practicals");
    const commentsNamespace = index.namespace("comments");

    let baseFilter = {};
    if (role === 'student') {
        baseFilter = { "user_participant": { "$eq": userId } };
    } else if (role === 'instructor') {
        baseFilter = { "user_instructor_id": { "$eq": userId } };
    }

    // 4. Query the "practicals" namespace by filtering on a metadata field.
    const practicalQueryResponse = await practicalNamespace.query({
        vector: queryEmbedding,
        topK: 100,
        includeMetadata: true,
        filter: { ...baseFilter }
    });

    // 5. Extract comment IDs (as before).
    let commentIds = [];
    if (practicalQueryResponse.matches) {
        for (const match of practicalQueryResponse.matches) {
            let practicalComments = match.metadata.comments;
            if (typeof practicalComments === 'string') {
                try {
                    practicalComments = JSON.parse(practicalComments);
                } catch (e) {
                    practicalComments = [];
                }
            }
            commentIds = commentIds.concat(practicalComments);
        }
    }
    commentIds = [...new Set(commentIds)];

    // 6. Query the "comments" namespace similarly using a metadata filter.
    let commentsQueryResponse = { matches: [] };
    if (commentIds.length > 0) {
        let commentFilter = {
            "comment_id": { "$in": commentIds },
        };
        if (filter) {
            commentFilter = {
                "comment_id": { "$in": commentIds },
                ...filter
            }
        }


        commentsQueryResponse = await commentsNamespace.query({
            vector: queryEmbedding,
            topK: 50,
            filter: commentFilter,
            includeMetadata: true
        });
    }

    // 7. Combine and build retrieved context.
    const combinedMatches = [
        ...(practicalQueryResponse.matches || []),
        ...(commentsQueryResponse.matches || []),
    ];
    // console.log(combinedMatches);

    const retrievedContext = combinedMatches
        .map(match => match.metadata.text || JSON.stringify(match.metadata))
        .join("\n");

    // 8. Build an augmented prompt with conversation history and retrieved context.
    const prompt = `
      You are a helpful teaching assistant for practical healthcare education.
      Answer the user's question using the context below.
      
      Retrieved Context:
      --------------------
      ${retrievedContext}
      --------------------
      
      Conversation History:
      ${messages.map(m => `${m.role}: ${m.content}`).join("\n")}
      
      Provide a detailed answer.
    `;

    // 9. Call the Chat model.
    const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPEN_AI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0,
    });
    const result = await llm.invoke([{ role: "system", content: prompt }]);
    return { messages: messages.concat({ role: "assistant", content: result.content }) };
};

// Construct the state graph by adding our node and defining the flow.
const graph = new StateGraph(StateAnnotation)
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

// Compile the graph with a checkpointer for state persistence.
const memory = new MemorySaver();
const graphApp = graph.compile({ checkpointer: memory });


app.post('/api/chat', async (req, res) => {
    const { messages, userId, role, threadId, filter } = req.body;
    const conversationId = threadId || uuidv4();

    // Merge configuration into the input state.
    const input = {
        messages,
        config: {
            configurable: {
                userId,
                role,
                filter,
                isChat: true,
            }
        }
    };

    const config = {
        configurable: {
            thread_id: conversationId,
        },
    };

    try {
        const output = await graphApp.invoke(input, config);
        const assistantMessage = output.messages[output.messages.length - 1];
        res.json({
            threadId: conversationId,
            response: assistantMessage,
            chatHistory: output.messages
        });
    } catch (error) {
        console.error("Error in chat endpoint:", error);
        res.status(500).send("Error processing query");
    }
});


app.post('/api/insights', async (req, res) => {
    const { messages, userId, role, threadId } = req.body;
    const conversationId = threadId || uuidv4();

    // Merge configuration into the input state.
    // Here, we include userId, role, and filter (if any) in the configurable section.
    const input = {
        messages,
        config: {
            configurable: {
                userId,
                role,
                isChat: false,
            }
        }
    };

    // Pass the thread_id as part of the external config.
    const config = {
        configurable: {
            thread_id: conversationId,
        },
    };

    try {
        const output = await graphApp.invoke(input, config);
        const assistantMessage = output.messages[output.messages.length - 1];
        res.json({
            threadId: conversationId,
            response: assistantMessage,
            chatHistory: output.messages
        });
    } catch (error) {
        console.error("Error in insights endpoint:", error);
        res.status(500).send("Error processing insights query");
    }
});





const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Store the GitHub token in environment variables
const REPO_OWNER = process.env.GITHUB_REPO_OWNER; // Change to the owner of the repo
const REPO_NAME = process.env.GITHUB_REPO_NAME;   // Change to the name of the repo


app.post('/api/report-bug', async (req, res) => {
    const { description, cause, steps, category } = req.body;

    // Prepare the issue title and body for GitHub
    const issueTitle = `[${category}] Bug Report: ${description.slice(0, 50)}`;
    const issueBody = `
### Bug Description
${description}

### What caused the bug
${cause}

### Steps to reproduce
${steps}

### Bug Category
${category}
    `;

    try {
        // Send the bug report to GitHub Issues API
        const response = await axios.post(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
            {
                title: issueTitle,
                body: issueBody,
                labels: ['bug'],
            },
            {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        res.status(200).json({ message: 'Bug reported successfully', issueUrl: response.data.html_url });
    } catch (error) {
        console.error('Error creating GitHub issue:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Failed to report bug', error: error.message });
    }
});

app.post('/api/suggest-feature', async (req, res) => {
    const { title, description, comments } = req.body;

    // Prepare the issue title and body for GitHub
    const issueTitle = `Feature Suggestion: ${title}`;
    const issueBody = `
### Feature Description
${description}

### Additional Comments
${comments}
    `;

    try {
        // Send the feature suggestion to GitHub Issues API
        const response = await axios.post(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
            {
                title: issueTitle,
                body: issueBody,
                labels: ['enhancement'],
            },
            {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        res.status(200).json({ message: 'Feature suggestion submitted successfully', issueUrl: response.data.html_url });
    } catch (error) {
        console.error('Error creating GitHub issue:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Failed to submit feature suggestion', error: error.message });
    }
});


if (process.env.MODE != "dev") {
    app.get("*", (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.sendFile(path.join(__dirname, "./build/index.html"))
    })
}



app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

