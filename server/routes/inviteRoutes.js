import express from 'express';

import {
    createInvite,
    getInvite,
    getInviteByEmail,
    getInvitesBySchool,
    updateInvite,
    deleteInvite,
    getInvites
} from "../controllers/inviteControllers.js"

const router = express.Router();

router.get('/', getInvites);
router.post('/newInvite', createInvite);
router.get('/invite/:id', getInvite);
router.get('/invite/email/:email', getInviteByEmail);
router.get('/invite/school/:school_name', getInvitesBySchool);
router.put('/updateInvite/:id', updateInvite);
router.delete('/deleteInvite/:id', deleteInvite);

export default router;