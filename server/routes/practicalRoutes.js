import express from 'express';

import {
    createPractical,
    getPractical,
    getPracticals,
    getUserPracticals,
    updatePractical,
    deletePractical,
} from '../controllers/practicalControllers.js';

const router = express.Router();

router.get('/', getPracticals);
router.post('/newPractical', createPractical);
router.get('/practical/:id', getPractical);
router.get('/practical/user/:id', getUserPracticals);
router.put('/updatePractical/:id', updatePractical);
router.delete('/deletePractical/:id', deletePractical);

export default router;