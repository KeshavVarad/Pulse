import express from 'express';

import {
    createSchool,
    getSchool,
    getSchools,
    getSchoolByName,
    updateSchool,
    deleteSchool
} from "../controllers/schoolControllers.js"

const router = express.Router();

router.get('/', getSchools);
router.post('/newSchool', createSchool);
router.get('/school/:id', getSchool);
router.get('/school/name/:school_name', getSchoolByName);
router.put('/updateSchool/:id', updateSchool);
router.delete('/deleteSchool/:id', deleteSchool);

export default router;