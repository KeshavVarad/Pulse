import { exec } from "child_process";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv"

import { Storage } from '@google-cloud/storage'
import path from "path"

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateTranscript(videoPath, transcriptPath) {
    // Construct the full paths relative to the project root
    const serviceAccountPath = path.join(__dirname, '../../config/transcriptServiceAccount.json');
    const whisperDir = path.join(__dirname, '../../../whisper'); // Go up one level to the project root and into the whisper folder

    const command = `
      docker run -e GOOGLE_APPLICATION_CREDENTIALS=/transcriptServiceAccount.json \
                 -v ${serviceAccountPath}:${serviceAccountPath} \
                 -v ${whisperDir}:${whisperDir} \
                 whisper-transcriber ${GCLOUD_STORAGE_BUCKET} ${videoPath} ${transcriptPath}
    `;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error generating transcript: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error output: ${stderr}`);
            return;
        }
        console.log(`Transcript generated successfully: ${stdout}`);
    });
}

export async function checkTranscriptExists(transcriptPath) {
    const storage = new Storage({
        projectId: process.env.GCLOUD_PROJECT_ID,
        keyFilename: process.env.GCLOUD_KEY_FILE, // Path to the service account key file
    });

    const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

    try {
        const transcriptFile = bucket.file(transcriptPath); // Get a reference to the transcript file
        const [exists] = await transcriptFile.exists(); // Check if the file exists
        return exists; // Return the existence status
    } catch (error) {
        console.error("Error checking transcript existence:", error);
        return false; // Return false in case of an error
    }
}