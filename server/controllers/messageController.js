import firebase from "../config/firebase.js"
import Message from '../models/messageModel.js';

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';

const db = getFirestore(firebase);

export const createMessage = async (req, res, next) => {
    try {
        const data = req.body;
        await addDoc(collection(db, 'messages'), data);
        res.status(200).send('Message created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getMessages = async (req, res, next) => {
    try {
        const messages = await getDocs(collection(db, 'messages'));
        const messageArray = [];

        if (messages.empty) {
            res.status(400).send('No Messages found');
        } else {
            messages.forEach((doc) => {
                const message = new Message(
                    doc.id,
                    doc.data().name,
                    doc.data().real_name,
                    doc.data().email,
                    doc.data().createdMessages,
                    doc.data().inMessages,
                );
                messageArray.push(message);
            });

            res.status(200).send(messageArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getMessage = async (req, res, next) => {
    try {
        const id = req.params.id;
        const message = doc(db, 'messages', id);
        const data = await getDoc(message);
        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send('Message not found');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateMessage = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const message = doc(db, 'messages', id);
        await updateDoc(message, data);
        res.status(200).send('Message updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteMessage = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'messages', id));
        res.status(200).send('Message deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};