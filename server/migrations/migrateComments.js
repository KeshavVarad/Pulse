import { index } from '../config/pineconeInit.js';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebase from '../config/firebase.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const db = getFirestore(firebase);
const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;
const BATCH_SIZE = 50; // Adjust the batch size as needed

/**
 * Compute embedding using OpenAI's API.
 */
async function computeEmbedding(text) {
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
}

/**
 * Upsert a batch of records to Pinecone.
 */
async function upsertBatch(records) {
    try {
        await index.namespace('comments').upsert(records);
        console.log(`Successfully upserted batch of ${records.length} records.`);
    } catch (error) {
        console.error('Error upserting batch:', error);
    }
}

/**
 * Process all comments from Firestore and batch upsert them into Pinecone.
 * For each comment, upsert the main comment embedding.
 * For every tag found in the comment (pattern: @[{student_name}]({student_email})),
 * compute an additional embedding (with appended tag context) and upsert that record
 * with metadata including a dedicated "student_tag" field.
 */
async function runMigration() {
    const snapshot = await getDocs(collection(db, 'comments'));
    const batchRecords = [];
    let batch_num = 1;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (!data.feedback) continue;  // Skip if no feedback

        try {
            // Compute the main embedding for the feedback.
            const mainEmbedding = await computeEmbedding(data.feedback);

            // Ensure that the embedding is an array.
            if (!Array.isArray(mainEmbedding)) {
                console.error(`Embedding for comment ${docSnap.id} is not an array.`);
                continue;
            }

            // Upsert the main comment record (without storing the tags in metadata).
            batchRecords.push({
                id: docSnap.id,
                values: mainEmbedding,
                metadata: {
                    comment_id: docSnap.id,
                    task: data.task,
                    timestamp: data.timestamp,
                    rating: data.rating,
                    feedback: data.feedback,
                },
            });

            // Extract student tags from feedback using regex.
            // Pattern: @[{student_name}]({student_email})
            const tagRegex = /@\[(.*?)\]\((.*?)\)/g;
            const tagMatches = data.feedback.matchAll(tagRegex);
            for (const match of tagMatches) {
                // Remove curly braces from the extracted values.
                const studentName = match[1].replace(/[{}]/g, "").trim();
                const studentEmail = match[2].replace(/[{}]/g, "").trim();
                // Format as "studentName|studentEmail"
                const tagString = `${studentName}|${studentEmail}`;

                // Append a tag indicator to the feedback text.
                const tagText = `${data.feedback} [tag: ${tagString}]`;
                const tagEmbedding = await computeEmbedding(tagText);

                // Create a unique id for this tag-specific record.
                const sanitizedTag = tagString.replace(/[^a-zA-Z0-9]/g, '');
                const tagRecordId = `${docSnap.id}-${sanitizedTag}`;

                batchRecords.push({
                    id: tagRecordId,
                    values: tagEmbedding,
                    metadata: {
                        comment_id: docSnap.id,
                        task: data.task,
                        timestamp: data.timestamp,
                        rating: data.rating,
                        feedback: data.feedback,
                        student_tag: tagString, // dedicated metadata field for this tag
                    },
                });
            }

            // If batch size is reached, upsert and clear the batch.
            if (batchRecords.length >= BATCH_SIZE) {
                console.log(`Generated embeddings for batch ${batch_num}`);
                await upsertBatch(batchRecords);
                batchRecords.length = 0; // Clear the batch.
                batch_num += 1;
            }
        } catch (error) {
            console.error(`Error processing comment ${docSnap.id}:`, error);
        }
    }

    // Upsert any remaining records.
    if (batchRecords.length > 0) {
        await upsertBatch(batchRecords);
    } else {
        console.log('No records to upsert.');
    }
}

runMigration().catch(err => console.error("Migration failed:", err));
