import React from 'react'
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useState, useEffect } from 'react';
import auth from "../../config/firebase.js";
import { useAuth } from '../../contexts/AuthContext.js';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button, Typography } from '@mui/material';
import PracticalSettingsModal from '../elements/PracticalSettingsModal.js';
import Joyride from 'react-joyride';
import UserDashboard from './UserDashboard.js';
import AdminDashboard from './AdminDashboard.js';


export default function Dashboard() {

    const { currentUser } = useAuth()

    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {

        async function checkUser() {
            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());

                console.log(user)

                const userId = user.uid;

                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                };

                const admin_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/admin/${userId}`, requestOptions);

                if (admin_res.status == 200) {
                    setIsAdmin(true);
                }

                setLoading(false);

            } catch (e) {
                console.log(e);
            }
        }

        checkUser()

    }, [])

    if (loading) {
        return
    }

    if (!loading) {
        return (
            <div>
                {isAdmin ? <AdminDashboard /> : <UserDashboard />}
            </div>
        )
    }

}
