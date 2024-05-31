import firebase from "../config/firebase.js"
import User from '../models/userModel.js';

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit
} from 'firebase/firestore';

const db = getFirestore(firebase);

export const createUser = async (req, res, next) => {
    try {
        const data = req.body;
        await addDoc(collection(db, 'users'), data);
        res.status(200).send('User created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        const users = await getDocs(collection(db, 'users'));
        const userArray = [];

        if (users.empty) {
            res.status(400).send('No Users found');
        } else {
            users.forEach((doc) => {
                const user = new User(
                    doc.id,
                    doc.data().name,
                    doc.data().real_name,
                    doc.data().email,
                    doc.data().createdPracticals,
                    doc.data().inPracticals,
                );
                userArray.push(user);
            });

            res.status(200).send(userArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getUser = async (req, res, next) => {
    try {
        const email = req.params.email;
        const userQuery = query(collection(db, "users"), where("email", "==", email), limit(1));

        const users = await getDocs(userQuery);
        const userArray = [];

        if (users.empty) {
            res.status(400).send('No Users found');
        } else {
            users.forEach((doc) => {
                const user = new User(
                    doc.id,
                    doc.data().name,
                    doc.data().real_name,
                    doc.data().email,
                    doc.data().createdPracticals,
                    doc.data().inPracticals,
                );
                userArray.push(user);
            });

            res.status(200).send(userArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user = doc(db, 'users', id);
        await updateDoc(user, data);
        res.status(200).send('User updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'users', id));
        res.status(200).send('User deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};