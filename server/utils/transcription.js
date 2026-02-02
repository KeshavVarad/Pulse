// transcription.js - Video transcription utility module

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from '@ffprobe-installer/ffprobe';

dotenv.config();

const execAsync = promisify(exec);

// Get paths to ffmpeg and ffprobe binaries
const FFMPEG = ffmpegPath;
const FFPROBE = ffprobePath.path;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY
});

// Maximum file size for Whisper API (25MB)
const MAX_WHISPER_FILE_SIZE_MB = 24;
// Default chunk duration in seconds (10 minutes)
const DEFAULT_CHUNK_DURATION = 600;

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    CHUNK_DELAY_MS: 2000,           // Delay between chunk transcriptions
    MAX_RETRIES: 3,                  // Maximum retry attempts
    INITIAL_BACKOFF_MS: 1000,        // Initial backoff delay
    MAX_BACKOFF_MS: 30000,           // Maximum backoff delay
};

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {string} operationName - Name of operation for logging
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>} - Result of the function
 */
async function retryWithBackoff(fn, operationName, maxRetries = RATE_LIMIT_CONFIG.MAX_RETRIES) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if it's a rate limit error (429) or server error (5xx)
            const isRateLimitError = error.status === 429 ||
                                     error.response?.status === 429 ||
                                     error.message?.includes('429');
            const isServerError = error.status >= 500 ||
                                  error.response?.status >= 500;

            if (attempt < maxRetries && (isRateLimitError || isServerError)) {
                const backoffMs = Math.min(
                    RATE_LIMIT_CONFIG.INITIAL_BACKOFF_MS * Math.pow(2, attempt),
                    RATE_LIMIT_CONFIG.MAX_BACKOFF_MS
                );
                console.warn(`[Transcription] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffMs}ms...`);
                await sleep(backoffMs);
            } else if (attempt < maxRetries) {
                // For other errors, still retry but with shorter delay
                const backoffMs = RATE_LIMIT_CONFIG.INITIAL_BACKOFF_MS;
                console.warn(`[Transcription] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
                await sleep(backoffMs);
            }
        }
    }

    throw lastError;
}

/**
 * Extract audio from video file using ffmpeg
 * Converts to WAV format, 16kHz sample rate, mono channel
 * @param {string} videoPath - Path to the video file
 * @param {string} outputPath - Path for the output audio file
 * @returns {Promise<string>} - Path to the extracted audio file
 */
export async function extractAudio(videoPath, outputPath) {
    // Use -ss 0 before -i for faster seeking
    const command = `"${FFMPEG}" -y -ss 0 -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}"`;

    try {
        await execAsync(command);
        return outputPath;
    } catch (error) {
        throw new Error(`Audio extraction failed: ${error.message}`);
    }
}

/**
 * Get the duration of an audio file in seconds
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<number>} - Duration in seconds
 */
export async function getAudioDuration(audioPath) {
    const { stdout } = await execAsync(
        `"${FFPROBE}" -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`
    );
    return parseFloat(stdout.trim());
}

/**
 * Chunk audio file into smaller segments for processing
 * @param {string} audioPath - Path to the audio file
 * @param {number} chunkDurationSeconds - Duration of each chunk in seconds
 * @returns {Promise<Array>} - Array of chunk metadata objects
 */
export async function chunkAudio(audioPath, chunkDurationSeconds = DEFAULT_CHUNK_DURATION) {
    const outputDir = path.dirname(audioPath);
    const baseName = path.basename(audioPath, '.wav');

    const totalDuration = await getAudioDuration(audioPath);

    const chunks = [];
    let startTime = 0;
    let chunkIndex = 0;

    while (startTime < totalDuration) {
        const duration = Math.min(chunkDurationSeconds, totalDuration - startTime);
        const chunkPath = path.join(outputDir, `${baseName}_chunk_${chunkIndex}.wav`);

        // Use -ss before -i for faster seeking
        await execAsync(
            `"${FFMPEG}" -y -ss ${startTime} -i "${audioPath}" -t ${duration} -acodec pcm_s16le -ar 16000 -ac 1 "${chunkPath}"`
        );

        chunks.push({
            path: chunkPath,
            startTime,
            endTime: startTime + duration,
            index: chunkIndex
        });

        startTime += chunkDurationSeconds;
        chunkIndex++;
    }

    return chunks;
}

/**
 * Transcribe an audio file using OpenAI Whisper API with retry logic
 * @param {string} audioFilePath - Path to the audio file
 * @returns {Promise<Object>} - Transcription response with segments and timestamps
 */
export async function transcribeAudio(audioFilePath) {
    return retryWithBackoff(async () => {
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFilePath),
            model: 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['segment']
        });
        return response;
    }, `Whisper transcription for ${path.basename(audioFilePath)}`);
}

/**
 * Complete transcription workflow for a video file
 * Handles audio extraction, chunking (if needed), and transcription
 * @param {string} videoPath - Path to the video file
 * @param {string} practicalId - ID of the practical this video belongs to
 * @param {boolean} diarize - Whether to use speaker diarization
 * @returns {Promise<Object>} - Complete transcript object with segments
 */
export async function transcribeVideo(videoPath, practicalId, diarize = false) {
    // Generate paths for temporary files
    const videoDir = path.dirname(videoPath);
    const videoBaseName = path.basename(videoPath, path.extname(videoPath));
    const audioPath = path.join(videoDir, `${videoBaseName}_audio.wav`);

    console.log(`[Transcription] Starting transcription for practical: ${practicalId}`);
    console.log(`[Transcription] Extracting audio from: ${videoPath}`);

    // Extract audio from video
    await extractAudio(videoPath, audioPath);

    // Check file size to determine if chunking is needed
    const fileSizeMB = fs.statSync(audioPath).size / (1024 * 1024);
    console.log(`[Transcription] Audio file size: ${fileSizeMB.toFixed(2)} MB`);

    let segments = [];

    if (fileSizeMB > MAX_WHISPER_FILE_SIZE_MB) {
        console.log(`[Transcription] File exceeds ${MAX_WHISPER_FILE_SIZE_MB}MB, chunking audio...`);

        // Chunk audio and transcribe each chunk
        const chunks = await chunkAudio(audioPath);
        console.log(`[Transcription] Created ${chunks.length} chunks`);

        // Transcribe chunks SEQUENTIALLY with delays to avoid rate limits
        for (let idx = 0; idx < chunks.length; idx++) {
            const chunk = chunks[idx];
            console.log(`[Transcription] Transcribing chunk ${idx + 1}/${chunks.length}`);

            try {
                const result = await transcribeAudio(chunk.path);

                if (result.segments) {
                    const adjustedSegments = result.segments.map(seg => ({
                        ...seg,
                        start: seg.start + chunk.startTime,
                        end: seg.end + chunk.startTime
                    }));
                    segments = segments.concat(adjustedSegments);
                }
            } finally {
                // Clean up chunk file
                try {
                    fs.unlinkSync(chunk.path);
                } catch (e) {
                    console.warn(`[Transcription] Could not delete chunk file: ${chunk.path}`);
                }
            }

            // Add delay between chunks to avoid rate limits (except after last chunk)
            if (idx < chunks.length - 1) {
                console.log(`[Transcription] Waiting ${RATE_LIMIT_CONFIG.CHUNK_DELAY_MS}ms before next chunk...`);
                await sleep(RATE_LIMIT_CONFIG.CHUNK_DELAY_MS);
            }
        }
    } else {
        console.log(`[Transcription] File size OK, transcribing directly...`);
        const result = await transcribeAudio(audioPath);
        segments = result.segments || [];
    }

    // Clean up main audio file
    try {
        fs.unlinkSync(audioPath);
    } catch (e) {
        console.warn(`[Transcription] Could not delete audio file: ${audioPath}`);
    }

    // Build the transcript object
    const transcript = {
        practical_id: practicalId,
        full_text: segments.map(s => s.text).join(' '),
        segments: segments.map((seg, idx) => ({
            index: idx,
            text: seg.text,
            start: seg.start,
            end: seg.end,
            speaker: seg.speaker || 'unknown'
        })),
        segment_count: segments.length,
        created_at: Date.now()
    };

    console.log(`[Transcription] Completed. Total segments: ${segments.length}`);

    return transcript;
}

/**
 * Download a file from a URL to a local path
 * @param {string} url - URL to download from
 * @param {string} destPath - Destination path
 * @returns {Promise<string>} - Path to downloaded file
 */
export async function downloadFile(url, destPath) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(destPath));
        writer.on('error', reject);
    });
}

/**
 * Transcribe a video from a URL
 * Downloads the video, processes it, then cleans up
 * @param {string} videoUrl - URL of the video to transcribe
 * @param {string} practicalId - ID of the practical
 * @param {string} tempDir - Directory for temporary files
 * @param {boolean} diarize - Whether to use speaker diarization
 * @returns {Promise<Object>} - Complete transcript object
 */
export async function transcribeVideoFromUrl(videoUrl, practicalId, tempDir, diarize = false) {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const videoPath = path.join(tempDir, `${practicalId}_video.mp4`);

    console.log(`[Transcription] Downloading video from URL...`);
    await downloadFile(videoUrl, videoPath);

    try {
        const transcript = await transcribeVideo(videoPath, practicalId, diarize);

        // Clean up downloaded video
        fs.unlinkSync(videoPath);

        return transcript;
    } catch (error) {
        // Clean up on error
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
        throw error;
    }
}
