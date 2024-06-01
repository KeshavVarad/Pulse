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
router.post('/newComment', createComment);
router.get('/comment/:id', getComment);
router.put('/updateComment/:id', updateComment);
router.delete('/deleteComment/:id', deleteComment);

export default router;