import firebase from "../config/firebase.js";
import Comment from "../models/commentModel.js";
import axios from "axios";
import dotenv from "dotenv";
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const db = getFirestore(firebase);
const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY; // Ensure this variable is correctly set in your .env file
const NAMESPACE = "comments"; // Adjust if needed
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

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

export const createComment = async (req, res, next) => {
    try {
        const data = req.body;
        // Create comment in Firestore
        await setDoc(doc(db, "comments", data.id), data);

        // If there is feedback, compute the embedding and upsert to Pinecone
        if (data.feedback && data.feedback.trim() !== "") {
            try {
                // Compute main embedding for the feedback
                const mainEmbedding = await computeEmbedding(data.feedback);
                await index.namespace(NAMESPACE).upsert([
                    {
                        id: data.id,
                        values: mainEmbedding,
                        metadata: {
                            task: data.task,
                            timestamp: data.timestamp,
                            rating: data.rating,
                            feedback: data.feedback,
                        },
                    },
                ]);

                // Look for tags in the feedback in the form @[{student_name}]({student_email})
                const tagRegex = /@\[(.*?)\]\((.*?)\)/g;
                const tagMatches = data.feedback.matchAll(tagRegex);
                for (const match of tagMatches) {
                    const studentName = match[1].replace(/[{}]/g, "").trim();
                    const studentEmail = match[2].replace(/[{}]/g, "").trim();
                    const tagString = `${studentName}|${studentEmail}`;
                    // Append a tag indicator to the feedback to produce a tag-specific context
                    const tagFeedback = `${data.feedback} [tag: ${tagString}]`;
                    const tagEmbedding = await computeEmbedding(tagFeedback);
                    // Generate a unique id for this tag-specific record
                    const sanitizedTag = tagString.replace(/[^a-zA-Z0-9]/g, '');
                    const tagRecordId = `${data.id}-${sanitizedTag}`;
                    await index.namespace(NAMESPACE).upsert([
                        {
                            id: tagRecordId,
                            values: tagEmbedding,
                            metadata: {
                                comment_id: data.id,
                                task: data.task,
                                timestamp: data.timestamp,
                                rating: data.rating,
                                feedback: data.feedback,
                                student_tag: tagString, // dedicated field for this tag
                            },
                        },
                    ]);
                }
            } catch (pineconeError) {
                console.error(`Error upserting vector for comment ${data.id}:`, pineconeError);
            }
        }

        res.status(200).send("Comment created successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getComments = async (req, res, next) => {
    try {
        const commentsSnapshot = await getDocs(collection(db, "comments"));
        const commentArray = [];

        if (commentsSnapshot.empty) {
            res.status(400).send("No Comments found");
        } else {
            commentsSnapshot.forEach((docSnap) => {
                const comment = new Comment(
                    docSnap.id,
                    docSnap.data().task,
                    docSnap.data().timestamp,
                    docSnap.data().rating,
                    docSnap.data().feedback,
                    docSnap.data().replies
                );
                commentArray.push(comment);
            });

            res.status(200).send(commentArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getComment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const commentRef = doc(db, "comments", id);
        const data = await getDoc(commentRef);
        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send("Comment not found");
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// In your update endpoint:
export const updateComment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const newData = req.body;
        const commentRef = doc(db, "comments", id);
        const oldSnapshot = await getDoc(commentRef);
        if (!oldSnapshot.exists()) {
            return res.status(404).send("Comment not found");
        }
        // Update the comment in Firestore
        await updateDoc(commentRef, newData);

        // Delete all tag-specific records (and if desired, main record too) that have metadata.comment_id === id.
        // For tag records, you already include comment_id in metadata.
        try {
            // List all vector IDs that start with the prefix for the comment
            const listResponse = await index.namespace(NAMESPACE).listPaginated({ prefix: `${id}` });
            const idsToDelete = listResponse.vectors.map((vector) => vector.id);

            if (idsToDelete && idsToDelete.length > 0) {
                await index.namespace(NAMESPACE).deleteMany(idsToDelete);
            } else {
                console.log(`No vectors found for comment ${id}`);
            }
        } catch (error) {
            console.log(`Error processing deletion for comment ${id}: ${error}`);
        }

        // Optionally, delete the main record by its id if you also want to remove that embedding.
        // await index.delete({ ids: [id], namespace: NAMESPACE });

        // Now re-insert the updated embeddings.
        // Upsert the main embedding (you may want to include comment_id in its metadata for consistency)
        if (newData.feedback && newData.feedback.trim() !== "") {
            try {
                // Compute main embedding for the feedback
                const mainEmbedding = await computeEmbedding(newData.feedback);
                await index.namespace(NAMESPACE).upsert([
                    {
                        id: id,
                        values: mainEmbedding,
                        metadata: {
                            task: newData.task,
                            timestamp: newData.timestamp,
                            rating: newData.rating,
                            feedback: newData.feedback,
                        },
                    },
                ]);

                // Look for tags in the feedback in the form @[{student_name}]({student_email})
                const tagRegex = /@\[(.*?)\]\((.*?)\)/g;
                const tagMatches = newData.feedback.matchAll(tagRegex);
                for (const match of tagMatches) {
                    const studentName = match[1].replace(/[{}]/g, "").trim();
                    const studentEmail = match[2].replace(/[{}]/g, "").trim();
                    const tagString = `${studentName}|${studentEmail}`;
                    // Append a tag indicator to the feedback to produce a tag-specific context
                    const tagFeedback = `${newData.feedback} [tag: ${tagString}]`;
                    const tagEmbedding = await computeEmbedding(tagFeedback);
                    // Generate a unique id for this tag-specific record
                    const sanitizedTag = tagString.replace(/[^a-zA-Z0-9]/g, '');
                    const tagRecordId = `${id}-${sanitizedTag}`;
                    await index.namespace(NAMESPACE).upsert([
                        {
                            id: tagRecordId,
                            values: tagEmbedding,
                            metadata: {
                                comment_id: id,
                                task: newData.task,
                                timestamp: newData.timestamp,
                                rating: newData.rating,
                                feedback: newData.feedback,
                                student_tag: tagString, // dedicated field for this tag
                            },
                        },
                    ]);
                }
            } catch (pineconeError) {
                console.error(`Error upserting vector for comment ${id}:`, pineconeError);
            }
        }

        res.status(200).send("Comment updated successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
};


export const deleteComment = async (req, res, next) => {
    try {
        const id = req.params.id;
        // Delete comment from Firestore
        await deleteDoc(doc(db, "comments", id));

        // Delete the main comment vector from Pinecone
        try {
            await index.namespace(NAMESPACE).delete([id]);
        } catch (pineconeError) {
            console.error(`Error deleting vector for comment ${id}:`, pineconeError);
        }

        // Note: Optionally, you may also want to delete any tag-specific records related to this comment.
        // That would require listing or tracking the tag record IDs.

        res.status(200).send("Comment deleted successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
};
