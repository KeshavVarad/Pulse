// migratePracticals.js

import { index } from '../config/pineconeInit.js';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebase from '../config/firebase.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const db = getFirestore(firebase);
const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;
const BATCH_SIZE = 10; // Adjust as needed
const NAMESPACE = "practicals"; // Change to your desired namespace

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
 * Upsert a batch of practical records to Pinecone.
 */
async function upsertBatch(records) {
    try {
        await index.namespace(NAMESPACE).upsert(records);
        console.log(`Successfully upserted batch of ${records.length} records.`);
    } catch (error) {
        console.error('Error upserting batch:', error);
    }
}

/**
 * Build a text summary for the practical data for embedding generation.
 * This function uses the provided sample fields.
 */
function buildPracticalText(data) {
    let summary = `Practical: ${data.practical_name || data.name}. `;

    // Convert creation_date (if provided) to an ISO string.
    if (data.creation_date) {
        const date = new Date(data.creation_date);
        summary += `Created on ${date.toISOString()}. `;
    }

    if (data.avg_rating !== undefined) {
        summary += `Average Rating: ${data.avg_rating}. `;
    }

    // Process tasks (an array of maps)
    if (data.tasks && Array.isArray(data.tasks)) {
        const tasksSummary = data.tasks.map(task => {
            const tName = task.name || "";
            const red = task.red_count !== undefined ? task.red_count : "";
            const green = task.green_count !== undefined ? task.green_count : "";
            return `Task: ${tName} (Red: ${red}, Green: ${green})`;
        }).join(". ");
        summary += `Tasks: ${tasksSummary}. `;
    }

    // Process comments (an array of strings)
    if (data.comments && Array.isArray(data.comments)) {
        const commentsSummary = data.comments.join(", ");
        summary += `Comments: ${commentsSummary}. `;
    }

    // Process chats (an array of maps; extract the message field)
    if (data.chats && Array.isArray(data.chats)) {
        const chatsSummary = data.chats.map(chat => chat.message || "").join(" | ");
        summary += `Chats: ${chatsSummary}. `;
    }

    // Process replies if available (convert to JSON string)
    if (data.replies && Array.isArray(data.replies)) {
        const repliesSummary = data.replies.map(reply => JSON.stringify(reply)).join(" | ");
        summary += `Replies: ${repliesSummary}. `;
    }

    if (data.school_id) {
        summary += `School ID: ${data.school_id}. `;
    }
    if (data.cohort_year) {
        summary += `Cohort Year: ${data.cohort_year}. `;
    }

    return summary;
}

/**
 * Process all practical documents from Firestore and batch upsert them into Pinecone.
 */
async function runMigration() {
    const snapshot = await getDocs(collection(db, 'practicals'));
    const batchRecords = [];

    for (const docSnap of snapshot.docs) {
        // console.log(`Processing practical ${docSnap.id}`);
        const data = docSnap.data();

        // Build a text summary from practical data
        const text = buildPracticalText(data);
        if (!text.trim()) {
            console.warn(`Skipping practical ${docSnap.id} due to empty summary text.`);
            continue;
        }

        try {
            const embedding = await computeEmbedding(text);

            // Ensure embedding is an array of numbers.
            if (!Array.isArray(embedding)) {
                console.error(`Embedding for practical ${docSnap.id} is not an array.`);
                continue;
            }

            // Create a record including metadata (convert arrays/objects to strings if needed)
            batchRecords.push({
                id: docSnap.id,
                values: embedding,
                metadata: {
                    practical_id: docSnap.id,
                    practical_name: data.practical_name || data.name,
                    creation_date: data.creation_date,
                    video_link: data.video_link,
                    user_creator: data.user_creator,
                    user_participants: data.user_participants ? JSON.stringify(data.user_participants) : "NA",
                    user_instructor_id: data.user_instructor_id,
                    user_instructor_name: data.user_instructor_name,
                    tasks: data.tasks ? JSON.stringify(data.tasks) : "NA",
                    comments: data.comments ? JSON.stringify(data.comments) : "NA",
                    chats: data.chats ? JSON.stringify(data.chats) : "NA",
                    red_count: data.red_count,
                    yellow_count: data.yellow_count,
                    green_count: data.green_count,
                    avg_rating: data.avg_rating,
                    school_id: data.school_id,
                    cohort_year: data.cohort_year ? data.cohort_year : "NA",
                    transcript_link: data.transcript_link,
                },
            });

            // If batch size is reached, upsert and clear the batch array.
            if (batchRecords.length >= BATCH_SIZE) {
                await upsertBatch(batchRecords);
                batchRecords.length = 0; // Clear array
            }
        } catch (error) {
            console.error(`Error processing practical ${docSnap.id}:`, error);
        }
    }

    // Upsert any remaining records.
    if (batchRecords.length > 0) {
        await upsertBatch(batchRecords);
    } else {
        console.log('No remaining records to upsert.');
    }
}

runMigration().catch(err => console.error("Migration failed:", err));
