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
//import { Link } from 'react-router-dom';
import Link from '@mui/material/Link';
import { format } from 'date-fns';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button, Typography } from '@mui/material';
import PracticalSettingsModal from '../elements/PracticalSettingsModal.js';
import Joyride from 'react-joyride';

export default function UserDashboard() {
    const { currentUser } = useAuth()

    const [joinedPracticals, setJoinedPracticals] = useState([]);
    const [ownedPracticals, setOwnedPracticals] = useState([]);
    const [practicalSettingsOpen, setPracticalSettingsOpen] = useState(false);
    const [practicalSettingsId, setPracticalSettingsId] = useState(null);

    const [dashTutorial, setDashTutorial] = useState(false)
    const [isDashboardMounted, setDashboardMounted] = useState(false);
    const [isInstructor, setIsInstructor] = useState(false)
    const handleDashJoyrideCallback = async (data) => {
        const { action, index, origin, status, type } = data;

        if (["finished", "skipped"].includes(status)) {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            if (currentUser) {
                const userId = currentUser.uid

                const requestOptions = {
                    method: "PUT",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ dashboard_tutorial: true })
                }

                await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${userId}`, requestOptions);
                setDashTutorial(true)
            }

        }
    }


    const handleSettingsButton = (idx) => {
        setPracticalSettingsOpen(true);
        setPracticalSettingsId(ownedPracticals[idx].id)
    }

    const handleSettingsClose = () => {
        setPracticalSettingsOpen(false);
        setPracticalSettingsId(null);
    }


    useEffect(() => {
        async function fetchPracticals() {
            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());

                const userId = user.uid;

               


                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                };

                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);

                let userData = null
                if (user_res.status == 200) {
                    userData = await user_res.json()
                }
                else {
                    userData = null
                }

                

                if (userData.role === "instructor") {
                    setIsInstructor(true);
                }



                let practicalData = []

                if (userData) {
                    const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/student/${userData.id}`, requestOptions);
                    practicalData = await practical_res.json()
                }

                const displayData = []

                practicalData.map((practical) => {

                    displayData.push({
                        id: practical.id,
                        practical_name: practical.practical_name,
                        user_instructor_name: practical.user_instructor_name,
                        creation_date: format(practical.creation_date, 'MMMM do yyyy, h:mm:ss a'),
                        path: "/practical/" + practical.id
                    })
                })

                setJoinedPracticals(displayData)
            } catch (e) {
                console.log(e);
            }
        }

        fetchPracticals()
    }, [])

    useEffect(() => {
        async function fetchPracticals() {
            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());

                const userId = user.uid;

                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                };

                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);

                let userData = null
                if (user_res.status == 200) {
                    userData = await user_res.json()
                }
                else {
                    userData = null
                }

                let practicalData = []

                if (userData) {
                    const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/instructor/${userData.id}`, requestOptions);
                    practicalData = await practical_res.json()
                }


                const displayData = []

                practicalData.map((practical) => {

                    displayData.push({
                        id: practical.id,
                        practical_name: practical.practical_name,
                        user_instructor_name: practical.user_instructor_name,
                        creation_date: format(practical.creation_date, 'MMMM do yyyy, h:mm:ss a'),
                        path: "/practical/" + practical.id
                    })
                })
                setOwnedPracticals(displayData)
            } catch (e) {
                console.log(e);
            }
        }

        fetchPracticals()
    }, [])

    useEffect(() => {
        async function fetchUser() {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            if (currentUser) {
                const userId = currentUser.uid

                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }

                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
                const userData = await user_res.json()

                setDashTutorial(userData.dashboard_tutorial)
            }

        }

        if (currentUser) {
            fetchUser()
        }
    }, [currentUser])

    useEffect(() => {

        const dashboard_element = document.querySelector('.student_practicals');
        if (dashboard_element) {
            setDashboardMounted(true);
        } else {
            setDashboardMounted(false);
        }


    }, [])

    const dashboard_tutorial_steps = [
        {
            target: ".student_practicals",
            content: "These are the practicals you are participating in.",
            placement: "bottom"
        },
        {
            target: ".instructor_practicals",
            content: "These are the practicals you are teaching.",
            placement: "bottom"
        },
    ]

    return (
        <Box sx={{
            minHeight: "100%",
            minWidth: "100%",

        }}>

            {(isDashboardMounted) ?
                (
                    <Joyride steps={dashboard_tutorial_steps} continuous callback={handleDashJoyrideCallback} run={!dashTutorial} styles={{ options: { zIndex: 1500 } }} />
                ) : null
            }
            <Box sx={{
                minHeight: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 8,
                flexDirection: "column",
            }}>
                <Box sx={{
                    py: 5
                }}>
                    <Typography variant="h2"> Dashboard </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    width: "100%",
                }}>

                    {isInstructor?(
                        <Container className="instructor_practicals" >


                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={{ minWidth: 10 }}>Practical Name</TableCell>
                                        <TableCell align="right">Instructor</TableCell>
                                        <TableCell align="right">Creation Date</TableCell>
                                        <TableCell align="right">Settings</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ownedPracticals.map((practical, idx) => (
                                        <TableRow
                                            key={idx}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                <Link href={practical.path} underline = "hover" variant="h4">
                                                    {practical.practical_name}
                                                </Link>
                                                

                                            </TableCell>
                                            <TableCell align="right">{practical.user_instructor_name}</TableCell>
                                            <TableCell align="right">{practical.creation_date}</TableCell>
                                            <TableCell align="right" sx={{ p: 1 }}>
                                                <Button sx={{}} onClick={() => handleSettingsButton(idx)}>
                                                    <SettingsIcon />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Container>



                    ):(
                        <Container className="student_practicals" sx={{
                        }}>

    
                            <TableContainer component={Paper}>
                                <Table aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell style={{ minWidth: 10 }}>Practical Name</TableCell>
                                            <TableCell align="right">Instructor</TableCell>
                                            <TableCell align="right">Creation Date</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {joinedPracticals.map((practical, idx) => (
                                            <TableRow
                                                key={idx}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                                <TableCell component="th" scope="row">
                                                    <Link href={practical.path}>
                                                        {practical.practical_name}
                                                    </Link>
    
                                                </TableCell>
                                                <TableCell align="right">{practical.user_instructor_name}</TableCell>
                                                <TableCell align="right">{practical.creation_date}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Container>


                    )}






                    


                    
                </Box>


                <PracticalSettingsModal openState={practicalSettingsOpen} handleClose={handleSettingsClose} practicalId={practicalSettingsId} />
            </Box>
        </Box>
    )
}
