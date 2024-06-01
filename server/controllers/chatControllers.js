import firebase from "../config/firebase.js"
import Chat from '../models/chatModel.js';

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

export const createChat = async (req, res, next) => {
    try {
        const data = req.body;
        await addDoc(collection(db, 'chats'), data);
        res.status(200).send('Chat created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getChats = async (req, res, next) => {
    try {
        const chats = await getDocs(collection(db, 'chats'));
        const chatArray = [];

        if (chats.empty) {
            res.status(400).send('No Chats found');
        } else {
            chats.forEach((doc) => {
                const chat = new Chat(
                    doc.id,
                    doc.data().name,
                    doc.data().real_name,
                    doc.data().email,
                    doc.data().createdChats,
                    doc.data().inChats,
                );
                chatArray.push(chat);
            });

            res.status(200).send(chatArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getChat = async (req, res, next) => {
    try {
        const id = req.params.id;
        const chat = doc(db, 'chats', id);
        const data = await getDoc(chat);
        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send('Chat not found');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateChat = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const chat = doc(db, 'chats', id);
        await updateDoc(chat, data);
        res.status(200).send('Chat updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteChat = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'chats', id));
        res.status(200).send('Chat deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};