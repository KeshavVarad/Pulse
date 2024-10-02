/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore"; // Import Firestore trigger
import { generateTranscript, checkTranscriptExists } from "./utils/transcriptionUtils.js";

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const onPracticalCreate = onDocumentCreated("/practicals/{practicalId}", async (event) => {
    const practicalId = event.params.practicalId;
    const practicalData = event.data.data();

    // Assuming practicalData contains `school_id` and video info
    const schoolId = practicalData.school_id;
    const videoName = practicalData.video_name; // Modify this according to your Firestore document structure

    const videoPath = path.join(schoolId, practicalId, videoName);
    const transcriptPath = path.join(schoolId, practicalId, `${videoName.split('.')[0]}_transcript.txt`);

    console.log(`Checking transcript for practical ID ${practicalId}`);

    try {
        // Check if the transcript already exists in Google Cloud Storage
        const transcriptExists = await checkTranscriptExists(transcriptPath);

        if (!transcriptExists) {
            console.log(`Transcript not found for practical ID ${practicalId}. Generating transcript...`);

            // Generate the transcript using the provided videoPath and transcriptPath
            await generateTranscript(videoPath, transcriptPath);
        } else {
            console.log(`Transcript already exists for practical ID ${practicalId}.`);
        }
    } catch (error) {
        console.error(`Error processing practical ${practicalId}:`, error);
    }
});
