import express from 'express';

import {
    createAdmin,
    getAdmin,
    getAdmins,
    updateAdmin,
    deleteAdmin,
    getAdminByEmail
} from "../controllers/adminControllers.js"

const router = express.Router();

router.get('/', getAdmins);
router.post('/newAdmin', createAdmin);
router.get('/admin/:id', getAdmin);
router.get('/admin/email/:email', getAdminByEmail);
router.put('/updateAdmin/:id', updateAdmin);
router.delete('/deleteAdmin/:id', deleteAdmin);

export default router;