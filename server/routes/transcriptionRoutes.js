// transcriptionRoutes.js - Routes for video transcription

import express from 'express';

import {
    transcribePracticalVideo,
    getTranscript,
    getTranscriptionStatus,
    deleteTranscript,
    searchTranscript,
    listTranscriptionStatuses,
} from '../controllers/transcriptionControllers.js';

const router = express.Router();

// List all transcription statuses (must be before :practicalId routes)
router.get('/transcription/list/all', listTranscriptionStatuses);

// Transcribe a practical's video
router.post('/transcription/transcribe/:practicalId', transcribePracticalVideo);

// Get transcript for a practical
router.get('/transcription/:practicalId', getTranscript);

// Get transcription status for a practical
router.get('/transcription/status/:practicalId', getTranscriptionStatus);

// Delete transcript for a practical
router.delete('/transcription/:practicalId', deleteTranscript);

// Search within a transcript
router.post('/transcription/search/:practicalId', searchTranscript);

export default router;
