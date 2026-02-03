// conversationController.js - Handles saving and retrieving conversations

import firebase from "../config/firebase.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
} from "firebase/firestore";

const db = getFirestore(firebase);
const CONVERSATIONS_COLLECTION = "conversations";

/**
 * Save a new conversation or update an existing one
 * POST /api/conversations
 */
export const saveConversation = async (req, res) => {
    try {
        const { conversationId, userId, type, title, messages, metadata } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "messages array is required" });
        }

        const id = conversationId || `conv_${Date.now()}_${userId.substring(0, 8)}`;

        const conversationData = {
            userId,
            type: type || "chat", // "chat" or "guided_reflection"
            title: title || generateTitle(messages),
            messages,
            metadata: metadata || {},
            messageCount: messages.length,
            updatedAt: Date.now(),
        };

        // Check if conversation exists
        const docRef = doc(db, CONVERSATIONS_COLLECTION, id);
        const existingDoc = await getDoc(docRef);

        if (existingDoc.exists()) {
            // Update existing conversation
            await updateDoc(docRef, conversationData);
        } else {
            // Create new conversation
            conversationData.createdAt = Date.now();
            await setDoc(docRef, conversationData);
        }

        res.status(200).json({
            success: true,
            conversationId: id,
            message: existingDoc.exists() ? "Conversation updated" : "Conversation saved"
        });

    } catch (error) {
        console.error("[ConversationController] Error saving conversation:", error);
        res.status(500).json({ error: "Failed to save conversation" });
    }
};

/**
 * Get all conversations for a user
 * GET /api/conversations/:userId
 */
export const getConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, limitCount } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        // Simple query by userId only - avoid composite index requirements
        // We'll filter by type and sort client-side
        const q = query(
            collection(db, CONVERSATIONS_COLLECTION),
            where("userId", "==", userId)
        );

        const snapshot = await getDocs(q);
        let conversations = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            // Filter by type client-side if specified
            if (type && data.type !== type) {
                return; // Skip this one
            }
            conversations.push({
                id: doc.id,
                type: data.type,
                title: data.title,
                messageCount: data.messageCount,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                metadata: data.metadata,
                // Don't include full messages in list view for performance
                preview: data.messages?.[0]?.content?.substring(0, 100) || ""
            });
        });

        // Sort by updatedAt descending (client-side)
        conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        // Apply limit if specified
        if (limitCount) {
            conversations = conversations.slice(0, parseInt(limitCount));
        }

        res.status(200).json({ conversations });

    } catch (error) {
        console.error("[ConversationController] Error getting conversations:", error);
        res.status(500).json({ error: "Failed to get conversations" });
    }
};

/**
 * Get a single conversation by ID
 * GET /api/conversations/detail/:conversationId
 */
export const getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({ error: "conversationId is required" });
        }

        const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const data = docSnap.data();
        res.status(200).json({
            id: docSnap.id,
            ...data
        });

    } catch (error) {
        console.error("[ConversationController] Error getting conversation:", error);
        res.status(500).json({ error: "Failed to get conversation" });
    }
};

/**
 * Delete a conversation
 * DELETE /api/conversations/:conversationId
 */
export const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({ error: "conversationId is required" });
        }

        const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        await deleteDoc(docRef);

        res.status(200).json({
            success: true,
            message: "Conversation deleted"
        });

    } catch (error) {
        console.error("[ConversationController] Error deleting conversation:", error);
        res.status(500).json({ error: "Failed to delete conversation" });
    }
};

/**
 * Generate a title from the first user message
 */
function generateTitle(messages) {
    const firstUserMessage = messages.find(m => m.role === "user");
    if (firstUserMessage?.content) {
        const content = firstUserMessage.content;
        // Truncate to first 50 chars and add ellipsis if needed
        return content.length > 50 ? content.substring(0, 50) + "..." : content;
    }
    return "Untitled Conversation";
}
