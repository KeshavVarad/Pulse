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
import transcriptionRoute from "./routes/transcriptionRoutes.js"
import { improvedCallModel } from "./utils/improvedAssistant.js"

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

app.get('/api/templates', (req, res) => {
    const templatesDir = path.join(__dirname, 'practical_templates');

    fs.readdir(templatesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Could not list templates' });
        }

        // Filter to only include JSON files and remove the .json extension
        const templateNames = files
            .filter((file) => file.endsWith('.json'))
            .map((file) => path.parse(file).name);

        res.json(templateNames);
    });
});

app.get('/api/templates/:templateName', (req, res) => {
    const { templateName } = req.params;
    const templatePath = path.join(__dirname, 'practical_templates', `${templateName}.json`);

    fs.readFile(templatePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json(JSON.parse(data));
    });
});


app.use('/api', userRoute);
app.use('/api', practicalRoute);
app.use('/api', commentRoute);
app.use('/api', adminRoute);
app.use('/api', schoolRoute);
app.use('/api', inviteRoute);
app.use('/api', notificationRoute);
app.use('/api', transcriptionRoute);


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
    // Extract config from state
    const { userId, role, filter, isChat } = state.config?.configurable || {};

    if (!userId || !role) {
        throw new Error("Missing userId or role in configuration");
    }

    // The conversation messages
    const messages = state.messages;

    // The user's latest query
    const currentUserQuery = messages[messages.length - 1].content;

    // 1. Compute embedding for the current user query
    const queryEmbedding = await computeEmbedding(currentUserQuery);

    // 2. We have three Pinecone namespaces: "practicals", "comments", and "transcripts"
    const practicalNamespace = index.namespace("practicals");
    const commentsNamespace = index.namespace("comments");
    const transcriptsNamespace = index.namespace("transcripts");

    // 3. Base filter by role
    //    - If student, only retrieve practicals where user_participant == userId
    //    - If instructor, only retrieve practicals where user_instructor_id == userId
    let baseFilter = {};
    if (role === 'student') {
        baseFilter = { "user_participant": { "$eq": userId } };
    } else if (role === 'instructor') {
        baseFilter = { "user_instructor_id": { "$eq": userId } };
    }

    // 4. Combine user-provided "filter" (from chat UI) with baseFilter
    //    So that we can also filter by "practical_name" or "user_participant" if user typed # or @
    const combinedPracticalFilter = {
        ...baseFilter,
        ...(filter || {})   // merges in any user-supplied filters
    };

    // 5. Query the "practicals" namespace in Pinecone
    const practicalQueryResponse = await practicalNamespace.query({
        vector: queryEmbedding,
        topK: 100,
        includeMetadata: true,
        filter: combinedPracticalFilter
    });

    // 6. From each matching practical, gather all comment IDs
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
    commentIds = [...new Set(commentIds)]; // unique

    // 7. Build a filter for the "comments" namespace, only if we have comment IDs
    let commentsQueryResponse = { matches: [] };
    if (commentIds.length > 0) {
        // By default, we filter comments by the IDs
        let commentFilter = {
            "comment_id": { "$in": commentIds }
        };

        // If user also supplied a custom filter, merge that in
        // (Though typically you'd have different logic for comment-level filters.)
        if (filter) {
            commentFilter = {
                "comment_id": { "$in": commentIds },
                ...filter
            };
        }

        // Query the comments namespace
        commentsQueryResponse = await commentsNamespace.query({
            vector: queryEmbedding,
            topK: 50,
            includeMetadata: true,
            filter: commentFilter,
        });
    }

    // 8. Query the "transcripts" namespace for relevant video transcript segments
    const transcriptsQueryResponse = await transcriptsNamespace.query({
        vector: queryEmbedding,
        topK: 30,
        includeMetadata: true,
        filter: combinedPracticalFilter  // Same role-based filter as practicals
    });

    // 9. Combine matches from practicals, comments, and transcripts
    const combinedMatches = [
        ...(practicalQueryResponse.matches || []),
        ...(commentsQueryResponse.matches || []),
    ];

    // Format transcript matches with timestamps for citation
    const transcriptMatches = (transcriptsQueryResponse.matches || []).map(match => ({
        ...match,
        formattedText: `[Transcript from ${match.metadata.practical_name || 'video'} at ${formatTimestamp(match.metadata.start_time)}]: ${match.metadata.text}`
    }));

    // 10. Build retrieved context text
    const practicalContext = combinedMatches
        .map(match => match.metadata.text || JSON.stringify(match.metadata))
        .join("\n");

    const transcriptContext = transcriptMatches
        .map(match => match.formattedText)
        .join("\n");

    // 11. Construct an augmented prompt with conversation history + retrieved context
    const prompt = `
      You are a helpful teaching assistant that will help students and instructors on this app however you can with their activities.
      You are knowledgable about anything and everything. But make sure to let the user know if you don't have a sure answer.
      Answer the user's question using the context below:

      Retrieved Context (Practicals & Comments):
      --------------------
      ${practicalContext}
      --------------------

      Video Transcript Context (with timestamps):
      --------------------
      ${transcriptContext || "No transcript data available."}
      --------------------

      When referencing transcript content, include the timestamp so users can find the relevant part of the video.

      Conversation History:
      ${messages.map(m => `${m.role}: ${m.content}`).join("\n")}

      Provide a detailed answer.
    `;

    // 12. Call the LLM (e.g., ChatOpenAI from LangChain)
    const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPEN_AI_API_KEY,
        modelName: 'gpt-4o-mini',  // or 'gpt-3.5-turbo', etc.
        temperature: 0,
    });

    // Send a single user message with "system" role content
    const result = await llm.invoke([{ role: "system", content: prompt }]);

    // Return the updated conversation state
    return {
        messages: messages.concat({ role: "assistant", content: result.content })
    };
};

// Helper function to format timestamp as MM:SS
function formatTimestamp(seconds) {
    if (!seconds && seconds !== 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/*****************************************************
 * Build the graph with memory (using improved assistant)
 *****************************************************/
const graph = new StateGraph(StateAnnotation)
    .addNode("model", improvedCallModel)
    .addEdge(START, "model")
    .addEdge("model", END);

const memory = new MemorySaver();
const graphApp = graph.compile({ checkpointer: memory });

/*****************************************************
 * The Express endpoint that handles the chat
 *****************************************************/
app.post('/api/chat', async (req, res) => {
    const { messages, userId, role, threadId, filter } = req.body;
    const conversationId = threadId || uuidv4();

    // Merge config into input state
    const input = {
        messages,
        config: {
            configurable: {
                userId,
                role,
                filter,
                isChat: true
            }
        }
    };

    // Optional config for the graph (like a threadId)
    const config = {
        configurable: {
            thread_id: conversationId
        }
    };

    try {
        // Invoke our state machine/graph with the user input
        const output = await graphApp.invoke(input, config);

        // The last message is the AI's response
        const assistantMessage = output.messages[output.messages.length - 1];

        // Send back threadId and the updated chat messages
        res.json({
            threadId: conversationId,
            response: assistantMessage,
            chatHistory: output.messages
        });
    } catch (error) {
        console.error("Error in /api/chat:", error);
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

