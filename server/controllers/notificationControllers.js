import firebase from "../config/firebase.js"
import Comment from '../models/commentModel.js';

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where
} from 'firebase/firestore';
import Notification from "../models/notificationModel.js";

const db = getFirestore(firebase);

export const createNotification = async (req, res, next) => {
    try {
        const data = req.body;
        await setDoc(doc(db, 'notifications', data.id), data);
        res.status(200).send('Notification created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await getDocs(collection(db, 'notifications'));
        const notificationArray = [];

        if (notifications.empty) {
            res.status(400).send('No notifications found');
        } else {
            notifications.forEach((doc) => {
                const notification = new Notification(
                    doc.id,
                    doc.data().task,
                    doc.data().user_id,
                    doc.data().message,
                    doc.data().timestamp,
                    doc.data().read_status,
                    doc.data().practical_id,
                );
                notificationArray.push(notification);
            });

            res.status(200).send(notificationArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getUserNotifications = async (req, res, next) => {
    const { userId } = req.params; // Assume userId is passed as a URL parameter

    try {
        // Create a query to filter notifications by user_id
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('user_id', '==', userId) // Filter by user_id
        );

        const notifications = await getDocs(notificationsQuery);
        const notificationArray = [];

        if (notifications.empty) {
            res.status(400).send('No notifications found for this user');
        } else {
            notifications.forEach((doc) => {
                const notification = new Notification(
                    doc.id,
                    doc.data().task,
                    doc.data().user_id,
                    doc.data().message,
                    doc.data().timestamp,
                    doc.data().read_status,
                    doc.data().practical_id,
                );
                notificationArray.push(notification);
            });

            res.status(200).send(notificationArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getNotification = async (req, res, next) => {
    try {
        const id = req.params.id;
        const notification = doc(db, 'notifications', id);
        const data = await getDoc(notification);
        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send('Notification not found');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateNotification = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const notification = doc(db, 'notifications', id);
        await updateDoc(notification, data);
        res.status(200).send('Notification updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteNotification = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'notifications', id));
        res.status(200).send('Notification deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};