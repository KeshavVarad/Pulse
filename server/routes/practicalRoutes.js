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
router.post('/new', createPractical);
router.get('/practical/:id', getPractical);
router.put('/update/:id', updatePractical);
router.delete('/delete/:id', deletePractical);

export default router;