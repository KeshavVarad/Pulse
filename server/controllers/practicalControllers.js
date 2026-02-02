// practicalController.js

import firebase from "../config/firebase.js";
import Practical from "../models/practicalModel.js";
import axios from "axios";
import dotenv from "dotenv";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    where,
    query,
} from "firebase/firestore";
import { index } from "../config/pineconeInit.js";

dotenv.config();

const db = getFirestore(firebase);
const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;
const NAMESPACE = "practicals"; // Pinecone namespace for practicals

/**
 * Compute embedding using OpenAI's API.
 */
async function computeEmbedding(text) {
    const response = await axios.post(
        "https://api.openai.com/v1/embeddings",
        {
            model: "text-embedding-ada-002",
            input: text,
        },
        {
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data.data[0].embedding;
}

/**
 * Build a text summary for the practical data used for embedding generation.
 */
function buildPracticalText(data) {
    let summary = `Practical: ${data.practical_name || data.name}. `;

    if (data.creation_date) {
        const date = new Date(data.creation_date);
        summary += `Created on ${date.toISOString()}. `;
    }
    if (data.avg_rating !== undefined) {
        summary += `Average Rating: ${data.avg_rating}. `;
    }
    if (data.tasks && Array.isArray(data.tasks)) {
        const tasksSummary = data.tasks
            .map((task) => {
                const tName = task.name || "";
                const red = task.red_count !== undefined ? task.red_count : "";
                const green = task.green_count !== undefined ? task.green_count : "";
                return `Task: ${tName} (Red: ${red}, Green: ${green})`;
            })
            .join(". ");
        summary += `Tasks: ${tasksSummary}. `;
    }
    if (data.comments && Array.isArray(data.comments)) {
        const commentsSummary = data.comments.join(", ");
        summary += `Comments: ${commentsSummary}. `;
    }
    if (data.chats && Array.isArray(data.chats)) {
        const chatsSummary = data.chats
            .map((chat) => chat.message || "")
            .join(" | ");
        summary += `Chats: ${chatsSummary}. `;
    }
    if (data.replies && Array.isArray(data.replies)) {
        const repliesSummary = data.replies
            .map((reply) => JSON.stringify(reply))
            .join(" | ");
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
 * Create a practical in Firestore and upsert its embeddings in Pinecone.
 * If a non-empty user_participants array exists, a separate embedding is created for each participant.
 */
export const createPractical = async (req, res, next) => {
    try {
        const data = req.body;
        // Save practical to Firestore
        await setDoc(doc(db, "practicals", data.id), data);

        // Build text summary for embedding generation
        const text = buildPracticalText(data);
        if (text.trim()) {
            try {
                const embedding = await computeEmbedding(text);
                // Build the common metadata (without the whole user_participants array)
                const baseMetadata = {
                    practical_id: data.id,
                    practical_name: data.practical_name || data.name,
                    creation_date: data.creation_date,
                    video_link: data.video_link,
                    user_creator: data.user_creator,
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
                };

                let records = [];
                if (Array.isArray(data.user_participants) && data.user_participants.length > 0) {
                    data.user_participants.forEach((participant, index) => {
                        records.push({
                            id: `${data.id}_${index}`,
                            values: embedding,
                            metadata: {
                                ...baseMetadata,
                                user_participant: participant,
                            },
                        });
                    });
                } else {
                    // If no participants, create a single record with "NA"
                    records.push({
                        id: data.id,
                        values: embedding,
                        metadata: {
                            ...baseMetadata,
                            user_participant: "NA",
                        },
                    });
                }

                console.log(records);

                await index.namespace(NAMESPACE).upsert(records);
            } catch (pineconeError) {
                console.error(`Error upserting vector for practical ${data.id}:`, pineconeError);
            }
        } else {
            console.warn(`Empty text summary for practical ${data.id}; skipping Pinecone upsert.`);
        }
        res.status(200).send("Practical created successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
};

/**
 * Get all practicals.
 */
export const getPracticals = async (req, res, next) => {
    try {
        const practicals = await getDocs(collection(db, "practicals"));
        const practicalArray = [];

        if (practicals.empty) {
            res.status(400).send("No Practicals found");
        } else {
            practicals.forEach((docSnap) => {
                const practical = new Practical(
                    docSnap.id,
                    docSnap.data().name,
                    docSnap.data().real_name,
                    docSnap.data().email,
                    docSnap.data().createdPracticals,
                    docSnap.data().inPracticals,
                    docSnap.data().user_instructor_id,
                    docSnap.data().user_instructor_name,
                    docSnap.data().tasks,
                    docSnap.data().comments,
                    docSnap.data().chats,
                    docSnap.data().red_count,
                    docSnap.data().yellow_count,
                    docSnap.data().green_count,
                    docSnap.data().avg_rating,
                    docSnap.data().school_id,
                    docSnap.data().cohort_year,
                    docSnap.data().transcript_link
                );
                practicalArray.push(practical);
            });
            res.status(200).send(practicalArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

/**
 * Get a specific practical.
 */
export const getPractical = async (req, res, next) => {
    try {
        const id = req.params.id;
        const practicalRef = doc(db, "practicals", id);
        const data = await getDoc(practicalRef);
        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send("Practical not found");
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

/**
 * Get practicals for a given student.
 */
export const getStudentPracticals = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const practicalQuery = query(
            collection(db, "practicals"),
            where("user_participants", "array-contains", userId)
        );
        const data = await getDocs(practicalQuery);
        const practicalArray = [];

        if (data.empty) {
            res.status(201).send([]);
        } else {
            data.forEach((docSnap) => {
                const practical = new Practical(
                    docSnap.id,
                    docSnap.data().practical_name,
                    docSnap.data().creation_date,
                    docSnap.data().video_link,
                    docSnap.data().user_creator,
                    docSnap.data().user_participants,
                    docSnap.data().user_instructor_id,
                    docSnap.data().user_instructor_name,
                    docSnap.data().tasks,
                    docSnap.data().comments,
                    docSnap.data().chats,
                    docSnap.data().red_count,
                    docSnap.data().yellow_count,
                    docSnap.data().green_count,
                    docSnap.data().avg_rating,
                    docSnap.data().school_id,
                    docSnap.data().cohort_year,
                    docSnap.data().transcript_link
                );
                practicalArray.push(practical);
            });
            res.status(200).send(practicalArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

/**
 * Get practicals for a given instructor.
 */
export const getInstructorPracticals = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const practicalQuery = query(
            collection(db, "practicals"),
            where("user_instructor_id", "==", userId)
        );
        const data = await getDocs(practicalQuery);
        const practicalArray = [];

        if (data.empty) {
            res.status(201).send([]);
        } else {
            data.forEach((docSnap) => {
                const practical = new Practical(
                    docSnap.id,
                    docSnap.data().practical_name,
                    docSnap.data().creation_date,
                    docSnap.data().video_link,
                    docSnap.data().user_creator,
                    docSnap.data().user_participants,
                    docSnap.data().user_instructor_id,
                    docSnap.data().user_instructor_name,
                    docSnap.data().tasks,
                    docSnap.data().comments,
                    docSnap.data().chats,
                    docSnap.data().red_count,
                    docSnap.data().yellow_count,
                    docSnap.data().green_count,
                    docSnap.data().avg_rating,
                    docSnap.data().school_id,
                    docSnap.data().cohort_year,
                    docSnap.data().transcript_link
                );
                practicalArray.push(practical);
            });
            res.status(200).send(practicalArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

/**
 * Update a practical in Firestore and update its embeddings in Pinecone.
 * This deletes all existing embedding records for the practical (main and participant-specific)
 * and then upserts new ones.
 */
export const updatePractical = async (req, res, next) => {
    try {
        const id = req.params.id;
        const incomingData = req.body;
        const practicalRef = doc(db, "practicals", id);

        // 1) Fetch the existing doc so we don’t lose any fields that aren’t in req.body
        const existingSnap = await getDoc(practicalRef);
        if (!existingSnap.exists()) {
            return res.status(404).send("Practical not found");
        }
        const existingData = existingSnap.data();

        // 2) Merge the existing doc fields with the new incoming fields
        const mergedData = {
            ...existingData,
            ...incomingData
        };

        // 3) Write the merged data back to Firestore
        //    (We use setDoc(..., mergedData) instead of updateDoc to ensure the entire doc is up-to-date)
        await setDoc(practicalRef, mergedData);

        // 4) Rebuild the text summary from the *merged* data
        const text = buildPracticalText(mergedData);
        if (text.trim()) {
            try {
                // 5) Compute updated embedding
                const embedding = await computeEmbedding(text);

                // 6) Remove all existing vectors for this practical
                const listResponse = await index.namespace(NAMESPACE).listPaginated({ prefix: `${id}` });
                const idsToDelete = listResponse.vectors.map((vector) => vector.id);
                if (idsToDelete && idsToDelete.length > 0) {
                    await index.namespace(NAMESPACE).deleteMany(idsToDelete);
                }

                // 7) Prepare new metadata from the merged data
                const baseMetadata = {
                    practical_id: mergedData.id,
                    practical_name: mergedData.practical_name || mergedData.name,
                    creation_date: mergedData.creation_date,
                    video_link: mergedData.video_link,
                    user_creator: mergedData.user_creator,
                    user_instructor_id: mergedData.user_instructor_id,
                    user_instructor_name: mergedData.user_instructor_name,
                    tasks: mergedData.tasks ? JSON.stringify(mergedData.tasks) : "NA",
                    comments: mergedData.comments ? JSON.stringify(mergedData.comments) : "NA",
                    chats: mergedData.chats ? JSON.stringify(mergedData.chats) : "NA",
                    red_count: mergedData.red_count,
                    yellow_count: mergedData.yellow_count,
                    green_count: mergedData.green_count,
                    avg_rating: mergedData.avg_rating,
                    school_id: mergedData.school_id,
                    cohort_year: mergedData.cohort_year ? mergedData.cohort_year : "NA",
                    transcript_link: mergedData.transcript_link,
                };

                // 8) Upsert vectors for each participant
                let records = [];
                if (
                    Array.isArray(mergedData.user_participants) &&
                    mergedData.user_participants.length > 0
                ) {
                    mergedData.user_participants.forEach((participant, index) => {
                        records.push({
                            id: `${id}_${index}`,
                            values: embedding,
                            metadata: {
                                ...baseMetadata,
                                user_participant: participant,
                            },
                        });
                    });
                } else {
                    records.push({
                        id: id,
                        values: embedding,
                        metadata: {
                            ...baseMetadata,
                            user_participant: "NA",
                        },
                    });
                }

                await index.namespace(NAMESPACE).upsert(records);
            } catch (pineconeError) {
                console.error(`Error updating vector for practical ${id}:`, pineconeError);
            }
        } else {
            console.warn(`Empty text summary for practical ${id}; skipping Pinecone upsert.`);
        }

        res.status(200).send("Practical updated successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
};

/**
 * Delete a practical from Firestore and remove its embeddings from Pinecone.
 */
export const deletePractical = async (req, res, next) => {
    try {
        const id = req.params.id;
        // Delete document from Firestore
        await deleteDoc(doc(db, "practicals", id));

        // Delete all embedding records for this practical
        try {
            const listResponse = await index
                .namespace(NAMESPACE)
                .listPaginated({ prefix: `${id}` });
            const idsToDelete = listResponse.vectors.map((vector) => vector.id);
            if (idsToDelete && idsToDelete.length > 0) {
                await index.namespace(NAMESPACE).deleteMany(idsToDelete);
            } else {
                console.log(`No vectors found for practical ${id}`);
            }
        } catch (pineconeError) {
            console.error(`Error deleting vectors for practical ${id}:`, pineconeError);
        }
        res.status(200).send("Practical deleted successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
};
