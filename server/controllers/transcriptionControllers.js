// transcriptionControllers.js - Controller for video transcription endpoints

import firebase from '../config/firebase.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
} from 'firebase/firestore';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { transcribeVideo, downloadFile } from '../utils/transcription.js';
import {
    upsertTranscriptSegments,
    deleteTranscriptSegments,
    getTranscriptForPractical,
} from '../utils/transcriptPinecone.js';

dotenv.config();

const db = getFirestore(firebase);

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.GCLOUD_KEY_FILE,
});
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

/**
 * Transcribe video for a practical
 * POST /api/transcription/transcribe/:practicalId
 *
 * This endpoint:
 * 1. Fetches the practical from Firestore to get video URL
 * 2. Downloads the video temporarily
 * 3. Transcribes it using Whisper API
 * 4. Stores transcript in Firestore
 * 5. Upserts transcript segments to Pinecone
 */
export const transcribePracticalVideo = async (req, res) => {
    const { practicalId } = req.params;
    const { diarize = false } = req.body;

    console.log(`[Transcription] Starting transcription for practical: ${practicalId}`);

    try {
        // 1. Get practical from Firestore
        const practicalRef = doc(db, 'practicals', practicalId);
        const practicalSnap = await getDoc(practicalRef);

        if (!practicalSnap.exists()) {
            return res.status(404).json({ error: 'Practical not found' });
        }

        const practicalData = practicalSnap.data();
        const videoLink = practicalData.video_link;

        if (!videoLink) {
            return res.status(400).json({ error: 'No video link found for this practical' });
        }

        // 2. Update practical status to indicate transcription is in progress
        await updateDoc(practicalRef, {
            transcription_status: 'processing',
            transcription_started_at: Date.now()
        });

        // 3. Create temp directory for video processing
        const tempDir = path.join(os.tmpdir(), 'pulse-transcription', practicalId);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // 4. Download video from GCS or URL
        const videoPath = path.join(tempDir, `video_${practicalId}.mp4`);

        // Check if it's a GCS URL or signed URL
        if (videoLink.includes('storage.googleapis.com') || videoLink.includes('storage.cloud.google.com')) {
            console.log(`[Transcription] Downloading video from GCS...`);
            await downloadFile(videoLink, videoPath);
        } else {
            // Assume it's a direct URL
            console.log(`[Transcription] Downloading video from URL...`);
            await downloadFile(videoLink, videoPath);
        }

        // 5. Transcribe the video
        console.log(`[Transcription] Starting transcription...`);
        const transcript = await transcribeVideo(videoPath, practicalId, diarize);

        // 6. Clean up video file
        try {
            fs.unlinkSync(videoPath);
            fs.rmdirSync(tempDir);
        } catch (e) {
            console.warn(`[Transcription] Could not clean up temp files: ${e.message}`);
        }

        // 7. Store transcript in Firestore (under practicals collection)
        // Store segments separately if there are many to avoid Firestore 1MB limit
        const transcriptData = {
            practical_id: practicalId,
            full_text: transcript.full_text,
            segment_count: transcript.segment_count,
            created_at: transcript.created_at,
            status: 'completed'
        };

        // Store in a separate transcripts collection
        await setDoc(doc(db, 'transcripts', practicalId), {
            ...transcriptData,
            segments: transcript.segments
        });

        // 8. Update practical with transcript reference
        await updateDoc(practicalRef, {
            transcription_status: 'completed',
            transcription_completed_at: Date.now(),
            transcript_id: practicalId,
            has_transcript: true
        });

        // 9. Upsert transcript segments to Pinecone
        // Build metadata from practical data
        const practicalMetadata = {
            practical_name: practicalData.practical_name || practicalData.name,
            user_instructor_id: practicalData.user_instructor_id,
            school_id: practicalData.school_id,
            cohort_year: practicalData.cohort_year,
            video_link: videoLink
        };

        // If there are multiple participants, upsert for each
        if (Array.isArray(practicalData.user_participants) && practicalData.user_participants.length > 0) {
            for (const participant of practicalData.user_participants) {
                await upsertTranscriptSegments(
                    practicalId,
                    transcript.segments,
                    { ...practicalMetadata, user_participant: participant }
                );
            }
        } else {
            await upsertTranscriptSegments(
                practicalId,
                transcript.segments,
                { ...practicalMetadata, user_participant: 'NA' }
            );
        }

        console.log(`[Transcription] Completed successfully for practical: ${practicalId}`);

        res.status(200).json({
            message: 'Transcription completed successfully',
            practical_id: practicalId,
            segment_count: transcript.segment_count,
            full_text_preview: transcript.full_text.substring(0, 500) + '...'
        });

    } catch (error) {
        console.error(`[Transcription] Error for practical ${practicalId}:`, error);

        // Update practical status to indicate failure
        try {
            const practicalRef = doc(db, 'practicals', practicalId);
            await updateDoc(practicalRef, {
                transcription_status: 'failed',
                transcription_error: error.message
            });
        } catch (e) {
            console.error(`[Transcription] Could not update failure status:`, e);
        }

        res.status(500).json({
            error: 'Transcription failed',
            message: error.message
        });
    }
};

/**
 * Get transcript for a practical
 * GET /api/transcription/:practicalId
 */
export const getTranscript = async (req, res) => {
    const { practicalId } = req.params;

    try {
        const transcriptRef = doc(db, 'transcripts', practicalId);
        const transcriptSnap = await getDoc(transcriptRef);

        if (!transcriptSnap.exists()) {
            return res.status(404).json({ error: 'Transcript not found' });
        }

        res.status(200).json(transcriptSnap.data());

    } catch (error) {
        console.error(`[Transcription] Error getting transcript for ${practicalId}:`, error);
        res.status(500).json({ error: 'Failed to get transcript', message: error.message });
    }
};

/**
 * Get transcript status for a practical
 * GET /api/transcription/status/:practicalId
 */
export const getTranscriptionStatus = async (req, res) => {
    const { practicalId } = req.params;

    try {
        const practicalRef = doc(db, 'practicals', practicalId);
        const practicalSnap = await getDoc(practicalRef);

        if (!practicalSnap.exists()) {
            return res.status(404).json({ error: 'Practical not found' });
        }

        const data = practicalSnap.data();

        res.status(200).json({
            practical_id: practicalId,
            has_transcript: data.has_transcript || false,
            transcription_status: data.transcription_status || 'not_started',
            transcription_started_at: data.transcription_started_at,
            transcription_completed_at: data.transcription_completed_at,
            transcription_error: data.transcription_error
        });

    } catch (error) {
        console.error(`[Transcription] Error getting status for ${practicalId}:`, error);
        res.status(500).json({ error: 'Failed to get status', message: error.message });
    }
};

/**
 * Delete transcript for a practical
 * DELETE /api/transcription/:practicalId
 */
export const deleteTranscript = async (req, res) => {
    const { practicalId } = req.params;

    try {
        // 1. Delete from Firestore
        const transcriptRef = doc(db, 'transcripts', practicalId);
        await deleteDoc(transcriptRef);

        // 2. Delete from Pinecone
        await deleteTranscriptSegments(practicalId);

        // 3. Update practical to remove transcript reference
        const practicalRef = doc(db, 'practicals', practicalId);
        await updateDoc(practicalRef, {
            has_transcript: false,
            transcript_id: null,
            transcription_status: 'not_started',
            transcription_started_at: null,
            transcription_completed_at: null,
            transcription_error: null
        });

        res.status(200).json({ message: 'Transcript deleted successfully' });

    } catch (error) {
        console.error(`[Transcription] Error deleting transcript for ${practicalId}:`, error);
        res.status(500).json({ error: 'Failed to delete transcript', message: error.message });
    }
};

/**
 * Search transcript segments for a practical
 * POST /api/transcription/search/:practicalId
 * Body: { query: "search text" }
 */
export const searchTranscript = async (req, res) => {
    const { practicalId } = req.params;
    const { query, topK = 10 } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const matches = await getTranscriptForPractical(practicalId, query, topK);

        // Format results with video timestamp links
        const results = matches.map(match => ({
            text: match.metadata.text,
            start_time: match.metadata.start_time,
            end_time: match.metadata.end_time,
            speaker: match.metadata.speaker,
            score: match.score,
            video_timestamp_link: match.metadata.video_link
                ? `${match.metadata.video_link}#t=${match.metadata.start_time.toFixed(1)}`
                : null
        }));

        res.status(200).json({
            practical_id: practicalId,
            query,
            results
        });

    } catch (error) {
        console.error(`[Transcription] Error searching transcript for ${practicalId}:`, error);
        res.status(500).json({ error: 'Failed to search transcript', message: error.message });
    }
};

/**
 * List all transcription statuses
 * GET /api/transcription/list/all
 * Query params: ?status=processing (optional, filter by status)
 */
export const listTranscriptionStatuses = async (req, res) => {
    const { status } = req.query;

    try {
        let practicalsQuery;

        if (status) {
            // Filter by specific status
            practicalsQuery = query(
                collection(db, 'practicals'),
                where('transcription_status', '==', status)
            );
        } else {
            // Get all practicals that have any transcription status set
            practicalsQuery = query(
                collection(db, 'practicals'),
                where('transcription_status', 'in', ['processing', 'completed', 'failed'])
            );
        }

        const snapshot = await getDocs(practicalsQuery);

        const results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            results.push({
                practical_id: doc.id,
                practical_name: data.practical_name,
                has_transcript: data.has_transcript || false,
                transcription_status: data.transcription_status,
                transcription_started_at: data.transcription_started_at,
                transcription_completed_at: data.transcription_completed_at,
                transcription_error: data.transcription_error
            });
        });

        // Sort by started_at descending (most recent first)
        results.sort((a, b) => (b.transcription_started_at || 0) - (a.transcription_started_at || 0));

        res.status(200).json({
            count: results.length,
            filter: status || 'all',
            transcriptions: results
        });

    } catch (error) {
        console.error(`[Transcription] Error listing transcription statuses:`, error);
        res.status(500).json({ error: 'Failed to list transcriptions', message: error.message });
    }
};
