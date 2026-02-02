// migrateTranscripts.js
// Migration script to transcribe all practicals that have videos but no transcripts

import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import firebase from '../config/firebase.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { transcribeVideo, downloadFile } from '../utils/transcription.js';
import { upsertTranscriptSegments } from '../utils/transcriptPinecone.js';

dotenv.config();

const db = getFirestore(firebase);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 0;
const SKIP_ERRORS = process.argv.includes('--skip-errors');

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Transcribe a single practical
 */
async function transcribePractical(practicalId, practicalData) {
    const videoLink = practicalData.video_link;

    console.log(`\n[${practicalId}] Starting transcription...`);
    console.log(`[${practicalId}] Video URL: ${videoLink}`);

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), 'pulse-transcription', practicalId);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Update status to processing
    const practicalRef = doc(db, 'practicals', practicalId);
    await updateDoc(practicalRef, {
        transcription_status: 'processing',
        transcription_started_at: Date.now()
    });

    try {
        // Download video
        const videoPath = path.join(tempDir, `video_${practicalId}.mp4`);
        console.log(`[${practicalId}] Downloading video...`);
        await downloadFile(videoLink, videoPath);

        // Transcribe
        console.log(`[${practicalId}] Transcribing...`);
        const transcript = await transcribeVideo(videoPath, practicalId, false);

        // Clean up video file
        try {
            fs.unlinkSync(videoPath);
            fs.rmdirSync(tempDir);
        } catch (e) {
            console.warn(`[${practicalId}] Could not clean up temp files`);
        }

        // Store transcript in Firestore
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'transcripts', practicalId), {
            practical_id: practicalId,
            full_text: transcript.full_text,
            segments: transcript.segments,
            segment_count: transcript.segment_count,
            created_at: transcript.created_at,
            status: 'completed'
        });

        // Update practical document
        await updateDoc(practicalRef, {
            transcription_status: 'completed',
            transcription_completed_at: Date.now(),
            transcript_id: practicalId,
            has_transcript: true
        });

        // Upsert to Pinecone
        const practicalMetadata = {
            practical_name: practicalData.practical_name || practicalData.name,
            user_instructor_id: practicalData.user_instructor_id,
            school_id: practicalData.school_id,
            cohort_year: practicalData.cohort_year,
            video_link: videoLink
        };

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

        console.log(`[${practicalId}] ✓ Completed - ${transcript.segment_count} segments`);
        return { success: true, segments: transcript.segment_count };

    } catch (error) {
        console.error(`[${practicalId}] ✗ Failed: ${error.message}`);

        // Update status to failed
        await updateDoc(practicalRef, {
            transcription_status: 'failed',
            transcription_error: error.message
        });

        return { success: false, error: error.message };
    }
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('='.repeat(60));
    console.log('TRANSCRIPT MIGRATION');
    console.log('='.repeat(60));

    if (DRY_RUN) {
        console.log('*** DRY RUN MODE - No changes will be made ***\n');
    }

    // Fetch all practicals
    console.log('Fetching practicals from Firestore...');
    const snapshot = await getDocs(collection(db, 'practicals'));
    console.log(`Found ${snapshot.docs.length} total practicals\n`);

    // Filter practicals that need transcription
    const toTranscribe = [];
    const skipped = {
        noVideo: 0,
        alreadyTranscribed: 0,
        processing: 0
    };

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const id = docSnap.id;

        // Skip if no video link
        if (!data.video_link) {
            skipped.noVideo++;
            continue;
        }

        // Skip if already transcribed
        if (data.has_transcript === true) {
            skipped.alreadyTranscribed++;
            continue;
        }

        // Skip if currently processing
        if (data.transcription_status === 'processing') {
            skipped.processing++;
            continue;
        }

        toTranscribe.push({ id, data });
    }

    console.log('Summary:');
    console.log(`  - To transcribe: ${toTranscribe.length}`);
    console.log(`  - Skipped (no video): ${skipped.noVideo}`);
    console.log(`  - Skipped (already done): ${skipped.alreadyTranscribed}`);
    console.log(`  - Skipped (in progress): ${skipped.processing}`);
    console.log('');

    if (toTranscribe.length === 0) {
        console.log('No practicals need transcription. Exiting.');
        return;
    }

    // Apply limit if specified
    let practicalsToProcess = toTranscribe;
    if (LIMIT > 0 && LIMIT < toTranscribe.length) {
        practicalsToProcess = toTranscribe.slice(0, LIMIT);
        console.log(`Limiting to first ${LIMIT} practicals\n`);
    }

    // List practicals to process
    console.log('Practicals to transcribe:');
    practicalsToProcess.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.data.practical_name || p.id}`);
    });
    console.log('');

    if (DRY_RUN) {
        console.log('Dry run complete. Run without --dry-run to execute.');
        return;
    }

    // Process each practical
    const results = {
        success: 0,
        failed: 0,
        totalSegments: 0
    };

    for (let i = 0; i < practicalsToProcess.length; i++) {
        const { id, data } = practicalsToProcess[i];
        console.log(`\n[${i + 1}/${practicalsToProcess.length}] Processing: ${data.practical_name || id}`);

        try {
            const result = await transcribePractical(id, data);

            if (result.success) {
                results.success++;
                results.totalSegments += result.segments;
            } else {
                results.failed++;
                if (!SKIP_ERRORS) {
                    console.error('\nStopping due to error. Use --skip-errors to continue on failures.');
                    break;
                }
            }
        } catch (error) {
            console.error(`Unexpected error: ${error.message}`);
            results.failed++;
            if (!SKIP_ERRORS) {
                break;
            }
        }

        // Small delay between transcriptions to avoid rate limits
        if (i < practicalsToProcess.length - 1) {
            console.log('Waiting 2 seconds before next transcription...');
            await sleep(2000);
        }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`  Successful: ${results.success}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Total segments: ${results.totalSegments}`);
}

// Run migration
runMigration()
    .then(() => {
        console.log('\nMigration script finished.');
        process.exit(0);
    })
    .catch(err => {
        console.error('\nMigration failed:', err);
        process.exit(1);
    });
