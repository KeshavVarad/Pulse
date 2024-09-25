import express from 'express';

import {
    createNotification,
    getNotification,
    getNotifications,
    updateNotification,
    deleteNotification,
    getUserNotifications
} from "../controllers/notificationControllers.js"

const router = express.Router();

router.get('/', getNotifications);
router.post('/newNotification', createNotification);
router.get('/notification/:id', getNotification);
router.get('/notification/user/:userId', getUserNotifications);
router.put('/updateNotification/:id', updateNotification);
router.delete('/deleteNotification/:id', deleteNotification);

export default router;