import express from 'express';

import {
    createChat,
    getChat,
    getChats,
    updateChat,
    deleteChat,
} from '../controllers/chatControllers.js';

const router = express.Router();

router.get('/', getChats);
router.post('/new', createChat);
router.get('/chat/:email', getChat);
router.put('/update/:id', updateChat);
router.delete('/delete/:id', deleteChat);

export default router;