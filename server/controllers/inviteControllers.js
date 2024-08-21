import firebase from "../config/firebase.js"
import Invite from "../models/inviteModel.js";

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
import dotenv from "dotenv";
import nodemailer from "nodemailer"

dotenv.config();

const db = getFirestore(firebase);


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});


export const createInvite = async (req, res, next) => {
    try {
        const data = req.body;

        const email_subject = `PULSE INVITE FOR ${data.school_name}`
        const sign_up_link = `${process.env.HOST_NAME}/register_user`
        const email_text = `You have been invited to join ${data.school_name} on Pulse. Sign up at the link below and get started!\n\n\n${sign_up_link}`


        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: data.invite_email,
            subject: email_subject,
            text: email_text
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Failed to send email' });
            } else {
                console.log('Email sent:', info.response);
            }
        });

        await setDoc(doc(db, 'invites', data.id), data);




        res.status(200).send('Invite created successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getInvites = async (req, res, next) => {
    try {
        const invites = await getDocs(collection(db, 'invites'));
        const inviteArray = [];

        if (invites.empty) {
            res.status(400).send('No invites found');
        } else {
            invites.forEach((doc) => {
                const invite = new Invite(
                    doc.id,
                    doc.data().school_name,
                    doc.data().school_id,
                    doc.data().invite_email,
                    doc.data().status,
                    doc.data().expiresOn,
                );
                inviteArray.push(invite);
            });

            res.status(200).send(inviteArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getInvite = async (req, res, next) => {
    try {
        const id = req.params.id;

        const invite = doc(db, 'invites', id);
        const data = await getDoc(invite);


        if (data.exists()) {
            res.status(200).send(data.data());
        } else {
            res.status(404).send('Invite not found');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getInvitesBySchool = async (req, res, next) => {
    try {
        const school_name = req.params.school_name;

        const inviteQuery = query(collection(db, 'invites'), where("school_name", "==", school_name))
        const data = await getDocs(inviteQuery);
        const inviteArray = [];

        if (data.empty) {
            res.status(400).send('No invites found');
        } else {
            data.forEach((doc) => {
                const invite = new Invite(
                    doc.id,
                    doc.data().school_name,
                    doc.data().school_id,
                    doc.data().invite_email,
                    doc.data().role,
                    doc.data().status,
                    doc.data().expires_on,
                );
                inviteArray.push(invite);
            });

            res.status(200).send(inviteArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const getInviteByEmail = async (req, res, next) => {
    try {
        const email = req.params.email;

        const inviteQuery = query(collection(db, 'invites'), where("invite_email", "==", email))
        const data = await getDocs(inviteQuery, limit(1));
        const inviteArray = [];

        if (data.empty) {
            res.status(400).send('No invites found');
        } else {
            data.forEach((doc) => {
                const invite = new Invite(
                    doc.id,
                    doc.data().school_name,
                    doc.data().school_id,
                    doc.data().invite_email,
                    doc.data().role,
                    doc.data().status,
                    doc.data().expires_on,
                );
                inviteArray.push(invite);
            });

            res.status(200).send(inviteArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateInvite = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const invite = doc(db, 'invites', id);
        await updateDoc(invite, data);
        res.status(200).send('Invite updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteInvite = async (req, res, next) => {
    try {
        const id = req.params.id;
        await deleteDoc(doc(db, 'invites', id));
        res.status(200).send('Invite deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};