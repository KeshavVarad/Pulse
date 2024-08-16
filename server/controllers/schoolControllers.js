import firebase from "../config/firebase.js"
import Admin from "../models/adminModel.js";
import School from "../models/schoolModel.js";

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

export const createSchool = async (req, res, next) => {
    try {
        const data = req.body;
        await setDoc(doc(db, 'schools', data.id), data);
        res.status(200).send('School created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getSchools = async (req, res, next) => {
    try {
        const schools = await getDocs(collection(db, 'schools'));
        const schoolArray = [];

        if (schools.empty) {
            res.status(400).send('No schools found');
        } else {
            schools.forEach((doc) => {
                const school = new School(
                    doc.id,
                    doc.data().school_name,
                    doc.data().practicals,
                    doc.data().students,
                    doc.data().instructors,
                    doc.data().admins,
                );
                schoolArray.push(school);
            });

            res.status(200).send(schoolArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getSchool = async (req, res, next) => {
    try {
        const id = req.params.id;

        const school = doc(db, 'schools', id);
        const data = await getDoc(school);


        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send('School not found');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getSchoolByName = async (req, res, next) => {
    try {
        const school_name = req.params.school_name;

        const schoolQuery = query(collection(db, 'schools'), where("school_name", "==", school_name))
        const data = await getDocs(schoolQuery, limit(1));
        const schoolArray = [];

        if (data.empty) {
            res.status(400).send('No schools found');
        } else {
            data.forEach((doc) => {
                const school = new School(
                    doc.id,
                    doc.data().school_name,
                    doc.data().practicals,
                    doc.data().students,
                    doc.data().instructors,
                    doc.data().admins,
                );
                schoolArray.push(school);
            });

            res.status(200).send(schoolArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateSchool = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const school = doc(db, 'schools', id);
        await updateDoc(school, data);
        res.status(200).send('School updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteSchool = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'schools', id));
        res.status(200).send('School deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};