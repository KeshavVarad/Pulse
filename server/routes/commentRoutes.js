import express from 'express';

import {
    createComment,
    getComment,
    getComments,
    updateComment,
    deleteComment,
} from '../controllers/commentControllers.js';

const router = express.Router();

router.get('/', getComments);
router.post('/new', createComment);
router.get('/comment/:email', getComment);
router.put('/update/:id', updateComment);
router.delete('/delete/:id', deleteComment);

export default router;