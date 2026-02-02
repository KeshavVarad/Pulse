// transcriptPinecone.js - Pinecone integration for transcript segments

import axios from 'axios';
import dotenv from 'dotenv';
import { index } from '../config/pineconeInit.js';

dotenv.config();

const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;
const TRANSCRIPT_NAMESPACE = 'transcripts';
const BATCH_SIZE = 100;

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    EMBEDDING_BATCH_DELAY_MS: 500,   // Delay between embedding batches
    UPSERT_BATCH_DELAY_MS: 200,      // Delay between Pinecone upserts
    MAX_RETRIES: 3,                   // Maximum retry attempts
    INITIAL_BACKOFF_MS: 1000,         // Initial backoff delay
    MAX_BACKOFF_MS: 30000,            // Maximum backoff delay
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
            const statusCode = error.status || error.response?.status;
            const isRateLimitError = statusCode === 429 || error.message?.includes('429');
            const isServerError = statusCode >= 500;

            if (attempt < maxRetries && (isRateLimitError || isServerError)) {
                const backoffMs = Math.min(
                    RATE_LIMIT_CONFIG.INITIAL_BACKOFF_MS * Math.pow(2, attempt),
                    RATE_LIMIT_CONFIG.MAX_BACKOFF_MS
                );
                console.warn(`[TranscriptPinecone] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffMs}ms...`);
                await sleep(backoffMs);
            } else if (attempt < maxRetries) {
                // For other errors, still retry but with shorter delay
                const backoffMs = RATE_LIMIT_CONFIG.INITIAL_BACKOFF_MS;
                console.warn(`[TranscriptPinecone] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
                await sleep(backoffMs);
            }
        }
    }

    throw lastError;
}

/**
 * Compute embedding using OpenAI's API with retry logic
 * @param {string} text - Text to compute embedding for
 * @returns {Promise<Array<number>>} - Embedding vector
 */
async function computeEmbedding(text) {
    return retryWithBackoff(async () => {
        const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
                model: 'text-embedding-ada-002',
                input: text,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data.data[0].embedding;
    }, 'Single text embedding');
}

/**
 * Compute embeddings for multiple texts in batch with retry logic
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
async function computeEmbeddingsBatch(texts) {
    return retryWithBackoff(async () => {
        const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
                model: 'text-embedding-ada-002',
                input: texts,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Sort by index to maintain order
        const sortedData = response.data.data.sort((a, b) => a.index - b.index);
        return sortedData.map(item => item.embedding);
    }, `Embedding batch of ${texts.length} texts`);
}

/**
 * Upsert transcript segments to Pinecone
 * @param {string} practicalId - ID of the practical
 * @param {Array} segments - Array of transcript segments
 * @param {Object} practicalMetadata - Metadata about the practical
 * @returns {Promise<number>} - Number of records upserted
 */
export async function upsertTranscriptSegments(practicalId, segments, practicalMetadata) {
    if (!segments || segments.length === 0) {
        console.log(`[TranscriptPinecone] No segments to upsert for practical ${practicalId}`);
        return 0;
    }

    console.log(`[TranscriptPinecone] Upserting ${segments.length} segments for practical ${practicalId}`);

    // Extract texts for batch embedding
    const texts = segments.map(seg => seg.text);

    // Compute embeddings in batches to avoid API limits
    const embeddings = [];
    const embeddingBatchSize = 100; // OpenAI recommends smaller batches
    const totalBatches = Math.ceil(texts.length / embeddingBatchSize);

    for (let i = 0; i < texts.length; i += embeddingBatchSize) {
        const batch = texts.slice(i, i + embeddingBatchSize);
        const batchNum = Math.floor(i / embeddingBatchSize) + 1;
        console.log(`[TranscriptPinecone] Computing embeddings for segments ${i + 1}-${Math.min(i + embeddingBatchSize, texts.length)} (batch ${batchNum}/${totalBatches})`);
        const batchEmbeddings = await computeEmbeddingsBatch(batch);
        embeddings.push(...batchEmbeddings);

        // Add delay between embedding batches to avoid rate limits (except after last batch)
        if (i + embeddingBatchSize < texts.length) {
            await sleep(RATE_LIMIT_CONFIG.EMBEDDING_BATCH_DELAY_MS);
        }
    }

    // Build Pinecone records
    const records = segments.map((segment, idx) => ({
        id: `${practicalId}_transcript_${idx}`,
        values: embeddings[idx],
        metadata: {
            practical_id: practicalId,
            segment_index: idx,
            content_type: 'transcript',
            text: segment.text,
            start_time: segment.start,
            end_time: segment.end,
            speaker: segment.speaker || 'unknown',
            // Include practical metadata for filtering
            practical_name: practicalMetadata.practical_name || 'NA',
            user_instructor_id: practicalMetadata.user_instructor_id || 'NA',
            user_participant: practicalMetadata.user_participant || 'NA',
            school_id: practicalMetadata.school_id || 'NA',
            cohort_year: practicalMetadata.cohort_year || 'NA',
            video_link: practicalMetadata.video_link || 'NA'
        }
    }));

    // Upsert in batches with retry and delays
    const totalUpsertBatches = Math.ceil(records.length / BATCH_SIZE);
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        console.log(`[TranscriptPinecone] Upserting batch ${batchNum}/${totalUpsertBatches}`);

        await retryWithBackoff(
            () => index.namespace(TRANSCRIPT_NAMESPACE).upsert(batch),
            `Pinecone upsert batch ${batchNum}`
        );

        // Add delay between upserts to avoid rate limits (except after last batch)
        if (i + BATCH_SIZE < records.length) {
            await sleep(RATE_LIMIT_CONFIG.UPSERT_BATCH_DELAY_MS);
        }
    }

    console.log(`[TranscriptPinecone] Successfully upserted ${records.length} transcript segments`);
    return records.length;
}

/**
 * Delete all transcript vectors for a practical
 * @param {string} practicalId - ID of the practical
 * @returns {Promise<number>} - Number of records deleted
 */
export async function deleteTranscriptSegments(practicalId) {
    console.log(`[TranscriptPinecone] Deleting transcript segments for practical ${practicalId}`);

    try {
        // List all vectors with the practical's transcript prefix
        const listResponse = await index
            .namespace(TRANSCRIPT_NAMESPACE)
            .listPaginated({ prefix: `${practicalId}_transcript` });

        if (!listResponse.vectors || listResponse.vectors.length === 0) {
            console.log(`[TranscriptPinecone] No transcript vectors found for practical ${practicalId}`);
            return 0;
        }

        const idsToDelete = listResponse.vectors.map(vector => vector.id);
        console.log(`[TranscriptPinecone] Found ${idsToDelete.length} vectors to delete`);

        // Delete in batches
        for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
            const batch = idsToDelete.slice(i, i + BATCH_SIZE);
            await index.namespace(TRANSCRIPT_NAMESPACE).deleteMany(batch);
        }

        console.log(`[TranscriptPinecone] Successfully deleted ${idsToDelete.length} transcript segments`);
        return idsToDelete.length;
    } catch (error) {
        console.error(`[TranscriptPinecone] Error deleting vectors for practical ${practicalId}:`, error);
        throw error;
    }
}

/**
 * Query transcript segments from Pinecone
 * @param {string} queryText - Text to search for
 * @param {Object} filter - Pinecone filter object
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} - Array of matching transcript segments
 */
export async function queryTranscriptSegments(queryText, filter = {}, topK = 20) {
    console.log(`[TranscriptPinecone] Querying transcripts with filter:`, filter);

    const queryEmbedding = await computeEmbedding(queryText);

    const response = await index.namespace(TRANSCRIPT_NAMESPACE).query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter
    });

    return response.matches || [];
}

/**
 * Get transcript segments for a specific practical
 * @param {string} practicalId - ID of the practical
 * @param {string} queryText - Optional search query
 * @param {number} topK - Number of results
 * @returns {Promise<Array>} - Array of transcript segments
 */
export async function getTranscriptForPractical(practicalId, queryText = null, topK = 50) {
    const filter = { practical_id: { '$eq': practicalId } };

    if (queryText) {
        return queryTranscriptSegments(queryText, filter, topK);
    }

    // If no query text, just list vectors for this practical
    const listResponse = await index
        .namespace(TRANSCRIPT_NAMESPACE)
        .listPaginated({ prefix: `${practicalId}_transcript` });

    return listResponse.vectors || [];
}

export { computeEmbedding, TRANSCRIPT_NAMESPACE };
