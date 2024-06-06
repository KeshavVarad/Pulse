import express from 'express';

import {
    createPractical,
    getPractical,
    getPracticals,
    updatePractical,
    deletePractical,
    getStudentPracticals,
    getInstructorPracticals,
} from '../controllers/practicalControllers.js';

const router = express.Router();

router.get('/', getPracticals);
router.post('/newPractical', createPractical);
router.get('/practical/:id', getPractical);
router.get('/practical/student/:id', getStudentPracticals);
router.get('/practical/instructor/:id', getInstructorPracticals);
router.put('/updatePractical/:id', updatePractical);
router.delete('/deletePractical/:id', deletePractical);

export default router;