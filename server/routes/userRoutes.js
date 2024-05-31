import express from 'express';

import {
    createUser,
    getUser,
    getUsers,
    updateUser,
    deleteUser,
} from '../controllers/userControllers.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/new', createUser);
router.get('/user/:email', getUser);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);

export default router;