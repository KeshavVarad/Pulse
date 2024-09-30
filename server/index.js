import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path"
import axios from "axios"
import multer from "multer"
import fs from "fs"
import Bull from "bull"
import { SpeechClient } from '@google-cloud/speech';
import { doc, updateDoc } from "firebase/firestore"
import { BullAdapter } from 'bull-board';
import { setQueues, router } from 'bull-board';

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


const speechClient = new SpeechClient({
    keyFilename: `${process.env.GCLOUD_TRANSCRIPT_KEY_FILE}`, // Path to your service account key file
});


const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.GCLOUD_KEY_FILE, // Path to the service account key file
});

const transcriptionQueue = new Bull('transcription', {
    redis: {
        host: 'localhost', // or your Redis server IP
        port: 6379,        // default Redis port
    },
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

setQueues([
    new BullAdapter(transcriptionQueue)
]);

app.use('/admin/queues', router);

if (process.env.MODE != "dev") {
    app.use(express.static(path.join(__dirname, "./build")));
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

// Function to upload the transcript to Google Cloud Storage
async function uploadTranscriptToGCS(transcript, fileName) {
    // Create a temporary local file with the transcript content
    const tempFilePath = path.join(__dirname, `${fileName}.txt`);

    fs.writeFileSync(tempFilePath, transcript);

    // Define the destination path within the bucket (e.g., transcripts/fileName.txt)
    const destination = `transcripts/${fileName}.txt`;

    // Upload the file to the specified Google Cloud Storage bucket
    await bucket.upload(tempFilePath, {
        destination: destination,
        public: false, // Optional: Set to true if you want the file to be publicly accessible
    });

    await storage.bucket(bucketName).file(destination).makePublic();


    // Delete the temporary file after upload
    fs.unlinkSync(tempFilePath);

    const publicUrl = `https://storage.googleapis.com/${process.env.GCLOUD_STORAGE_BUCKET}/${destination}`;
    return publicUrl;

}

function convertToGcsUri(publicUrl) {
    // Check if the URL is a valid Google Cloud Storage URL
    const baseUrl = 'https://storage.googleapis.com/';
    if (publicUrl.startsWith(baseUrl)) {
        // Replace the base URL with 'gs://'
        return publicUrl.replace(baseUrl, 'gs://');
    } else {
        throw new Error('Invalid Google Cloud Storage public URL.');
    }
}

async function transcribeLongAudio(publicUrl) {
    const audio = {
        uri: convertToGcsUri(publicUrl),
    };

    const config = {
        encoding: 'LINEAR16', // Adjust based on your audio file
        sampleRateHertz: 16000, // Adjust based on your audio file
        languageCode: 'en-US', // Adjust based on your audio language
    };

    const request = {
        audio: audio,
        config: config,
    };

    try {
        const [operation] = await speechClient.longRunningRecognize(request);
        const [response] = await operation.promise();
        const transcripts = response.results.map(result => result.alternatives[0].transcript);
        const transcriptText = transcripts.join('\n');

        const fileName = `transcript_${Date.now()}`;

        const transcriptUrl = await uploadTranscriptToGCS(transcriptText, fileName);
        return transcriptUrl;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw new Error('Transcription failed');
    }
}


// Route to transcribe video audio and upload the transcript
app.post('/api/transcribe', async (req, res) => {
    const { practicalId, videoUrl } = req.body;

    console.log(practicalId, videoUrl)

    if (!practicalId || !videoUrl) {
        return res.status(400).json({ error: 'practicalId and videoUri are required.' });
    }

    try {
        // Add the transcription job to the queue
        await transcriptionQueue.add({
            practicalId: practicalId,
            publicUrl: videoUrl
        });

        res.status(202).json({
            message: 'Transcription is in progress.',
            practicalId: practicalId
        });
    } catch (error) {
        console.error('Error queuing transcription job:', error);
        res.status(500).json({ error: 'Failed to start transcription process.' });
    }
});

const updatePractical = async (id, data) => {
    try {
        const practical = doc(db, 'practicals', id);
        await updateDoc(practical, data);
        console.log(`Practical ${id} updated successfully`);
    } catch (error) {
        console.error(`Error updating practical ${id}:`, error.message);
    }
};

transcriptionQueue.on('added', (job) => {
    console.log(`Job ${job.id} added to the queue.`);
});

transcriptionQueue.on('completed', (job) => {
    console.log(`Job ${job.id} completed.`);
});

transcriptionQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
});


transcriptionQueue.process(async (job) => {
    const { practicalId, publicUrl } = job.data;

    try {
        const transcriptUrl = await transcribeLongAudio(publicUrl); // Call your transcription function

        // Update the practical with the transcript URL
        await updatePractical(practicalId, { transcript_link: transcriptUrl });

    } catch (error) {
        console.error(`Error processing transcription for practical ${practicalId}:`, error);
    }
});

app.post('/api/getUploadUrl', async (req, res) => {
    try {
        const { fileName, contentType } = req.body;

        if (!fileName || !contentType) {
            return res.status(400).json({ error: 'Missing fileName or contentType in request body.' });
        }

        const options = {
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType,
        };

        const [url] = await storage
            .bucket(process.env.GCLOUD_STORAGE_BUCKET)
            .file(fileName)
            .getSignedUrl(options);

        res.status(200).json({ url });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ error: 'Failed to generate signed URL' });
    }
});


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

