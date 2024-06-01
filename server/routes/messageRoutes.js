import express from 'express';

import {
    createMessage,
    getMessage,
    getMessages,
    updateMessage,
    deleteMessage,
} from '../controllers/messageControllers.js';

const router = express.Router();

router.get('/', getMessages);
router.post('/new', createMessage);
router.get('/message/:email', getMessage);
router.put('/update/:id', updateMessage);
router.delete('/delete/:id', deleteMessage);

export default router;