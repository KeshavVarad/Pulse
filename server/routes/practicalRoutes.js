import express from 'express';

import {
    createPractical,
    getPractical,
    getPracticals,
    updatePractical,
    deletePractical,
} from '../controllers/practicalControllers.js';

const router = express.Router();

router.get('/', getPracticals);
router.post('/newPractical', createPractical);
router.get('/practical/:id', getPractical);
router.put('/practicalUpdate/:id', updatePractical);
router.delete('/practicalDelete/:id', deletePractical);

export default router;