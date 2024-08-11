import firebase from "../config/firebase.js"
import Admin from "../models/adminModel.js";

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    setDoc,
} from 'firebase/firestore';

const db = getFirestore(firebase);

export const createAdmin = async (req, res, next) => {
    try {
        const data = req.body;
        await setDoc(doc(db, 'admins', data.id), data);
        res.status(200).send('Admin created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getAdmins = async (req, res, next) => {
    try {
        const admins = await getDocs(collection(db, 'admins'));
        const adminArray = [];

        if (admins.empty) {
            res.status(400).send('No admins found');
        } else {
            admins.forEach((doc) => {
                const admin = new Admin(
                    doc.id,
                    doc.data().username,
                    doc.data().school_name,
                    doc.data().email,
                    doc.data().createdPracticals,
                    doc.data().students,
                    doc.data().instructors,
                );
                adminArray.push(admin);
            });

            res.status(200).send(adminArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getAdmin = async (req, res, next) => {
    try {
        const id = req.params.id;

        const admin = doc(db, 'admins', id);
        const data = await getDoc(admin);


        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send('Admin not found');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getAdminByEmail = async (req, res, next) => {
    try {
        const email = req.params.email;

        const adminQuery = query(collection(db, 'admins'), where("email", "==", email))
        const data = await getDocs(adminQuery, limit(1));
        const adminArray = [];

        if (data.empty) {
            res.status(400).send('No admins found');
        } else {
            data.forEach((doc) => {
                const admin = new Admin(
                    doc.id,
                    doc.data().username,
                    doc.data().school_name,
                    doc.data().email,
                    doc.data().createdPracticals,
                    doc.data().students,
                    doc.data().instructors,
                );
                adminArray.push(admin);
            });

            res.status(200).send(adminArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateAdmin = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const admin = doc(db, 'admins', id);
        await updateDoc(admin, data);
        res.status(200).send('Admin updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteAdmin = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'admins', id));
        res.status(200).send('Admin deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};