import firebase from "../config/firebase.js"
import Practical from '../models/practicalModel.js';

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    where,
    query
} from 'firebase/firestore';

const db = getFirestore(firebase);

export const createPractical = async (req, res, next) => {

    try {
        const data = req.body;
        await setDoc(doc(db, 'practicals', data.id), data);
        res.status(200).send('Practical created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getPracticals = async (req, res, next) => {
    try {
        const practicals = await getDocs(collection(db, 'practicals'));
        const practicalArray = [];

        if (practicals.empty) {
            res.status(400).send('No Practicals found');
        } else {
            practicals.forEach((doc) => {
                const practical = new Practical(
                    doc.id,
                    doc.data().name,
                    doc.data().real_name,
                    doc.data().email,
                    doc.data().createdPracticals,
                    doc.data().inPracticals,
                );
                practicalArray.push(practical);
            });

            res.status(200).send(practicalArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getPractical = async (req, res, next) => {
    try {
        const id = req.params.id;
        const practical = doc(db, 'practicals', id);
        const data = await getDoc(practical);
        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send('Practical not found');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getStudentPracticals = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const practicalQuery = query(collection(db, 'practicals'), where("user_participants", "array-contains", userId))


        const data = await getDocs(practicalQuery);

        const practicalArray = [];

        if (data.empty) {
            res.status(400).send('No Users found');
        } else {
            data.forEach((doc) => {
                const practical = new Practical(
                    doc.id,
                    doc.data().practical_name,
                    doc.data().creation_date,
                    doc.data().video_link,
                    doc.data().user_creator,
                    doc.data().user_participants,
                    doc.data().user_instructor_id,
                    doc.data().user_instructor_name,
                    doc.data().tasks,
                    doc.data().comments,
                    doc.data().chats
                );
                practicalArray.push(practical);
            });

            res.status(200).send(practicalArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};


export const getInstructorPracticals = async (req, res, next) => {
    try {
        const userId = req.params.id;


        const practicalQuery = query(collection(db, 'practicals'), where("user_instructor_id", "==", userId))


        const data = await getDocs(practicalQuery);

        const practicalArray = [];

        if (data.empty) {
            res.status(400).send('No Users found');
        } else {
            data.forEach((doc) => {
                const practical = new Practical(
                    doc.id,
                    doc.data().practical_name,
                    doc.data().creation_date,
                    doc.data().video_link,
                    doc.data().user_creator,
                    doc.data().user_participants,
                    doc.data().user_instructor_id,
                    doc.data().user_instructor_name,
                    doc.data().tasks,
                    doc.data().comments,
                    doc.data().chats
                );
                practicalArray.push(practical);
            });

            res.status(200).send(practicalArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updatePractical = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;

        const practical = doc(db, 'practicals', id);
        await updateDoc(practical, data);
        res.status(200).send('Practical updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deletePractical = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'practicals', id));
        res.status(200).send('Practical deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};