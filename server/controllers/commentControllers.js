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
} from 'firebase/firestore';

const db = getFirestore(firebase);

export const createComment = async (req, res, next) => {
    try {
        const data = req.body;
        await setDoc(doc(db, 'comments', data.id), data);
        res.status(200).send('Comment created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getComments = async (req, res, next) => {
    try {
        const comments = await getDocs(collection(db, 'comments'));
        const commentArray = [];

        if (comments.empty) {
            res.status(400).send('No Comments found');
        } else {
            comments.forEach((doc) => {
                const comment = new Comment(
                    doc.id,
                    doc.data().name,
                    doc.data().real_name,
                    doc.data().email,
                    doc.data().createdComments,
                    doc.data().inComments,
                );
                commentArray.push(comment);
            });

            res.status(200).send(commentArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getComment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const comment = doc(db, 'comments', id);
        const data = await getDoc(comment);
        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send('Comment not found');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateComment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const comment = doc(db, 'comments', id);
        await updateDoc(comment, data);
        res.status(200).send('Comment updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'comments', id));
        res.status(200).send('Comment deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};