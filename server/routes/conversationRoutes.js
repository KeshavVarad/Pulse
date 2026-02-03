// conversationRoutes.js - Routes for conversation persistence

import express from "express";
import {
    saveConversation,
    getConversations,
    getConversation,
    deleteConversation,
} from "../controllers/conversationController.js";

const router = express.Router();

// Save or update a conversation
router.post("/", saveConversation);

// Get all conversations for a user
router.get("/:userId", getConversations);

// Get a single conversation by ID
router.get("/detail/:conversationId", getConversation);

// Delete a conversation
router.delete("/:conversationId", deleteConversation);

export default router;
