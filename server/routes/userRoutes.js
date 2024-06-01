import express from 'express';

import {
    createUser,
    getUser,
    getUsers,
    updateUser,
    deleteUser,
    getUserByEmail,
} from '../controllers/userControllers.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/newUser', createUser);
router.get('/user/:id', getUser);
router.get('/user/email/:email', getUserByEmail);
router.put('/updateUser/:id', updateUser);
router.delete('/deleteUser/:id', deleteUser);

export default router;