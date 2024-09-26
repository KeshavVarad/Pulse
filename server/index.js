import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path"
import axios from "axios"
import multer from "multer"
import fs from "fs"

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


const app = express();

app.use(cors());
app.use(express.json());


app.use(express.urlencoded({ extended: false }));
// app.use(VerifyToken);

if (process.env.MODE != "dev") {
    app.use(express.static(path.join(__dirname, "./build")));
}


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.HOST_NAME);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use('/api', userRoute);
app.use('/api', practicalRoute);
app.use('/api', commentRoute);
app.use('/api', adminRoute);
app.use('/api', schoolRoute);
app.use('/api', inviteRoute);
app.use('/api', notificationRoute);

app.post('/api/upload', upload.single('video'), async (req, res) => {
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path; // Full path on the server
    const fileName = path.basename(filePath); // File name of the uploaded video

    try {
        // Upload the video to Google Cloud Storage
        await bucket.upload(filePath, {
            destination: fileName,
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        // Get public URL for the uploaded file
        const publicUrl = `https://storage.googleapis.com/${process.env.GCLOUD_STORAGE_BUCKET}/${fileName}`;

        // Delete temporary file after upload
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting temporary file:', err);
            }
        });

        return res.status(200).json({ videoUrl: publicUrl });
    } catch (error) {
        console.error('Error uploading to Google Cloud:', error);
        return res.status(500).json({ error: 'Failed to upload video' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages,
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).send('Error calling OpenAI API');
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
        res.sendFile(path.join(__dirname, "./build/index.html"))
    })
}



app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

