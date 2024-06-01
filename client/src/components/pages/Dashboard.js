import React from 'react'
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import NavBar from '../elements/SideBar';
import Header from '../elements/Header';
import SideBar from '../elements/SideBar';
import Grid from '@mui/material/Unstable_Grid2';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Divider, Icon, List, ListItem } from '@mui/material';
import Button from '@mui/material/Button';
import PersonIcon from '@mui/icons-material/Person';
import { useState, useEffect } from 'react';
import auth from "../../config/firebase.js";
import Link from "react"


export default function Dashboard() {

    const [rows, setRows] = useState([]);

    const [loading, setLoading] = useState(true);

    const [practicalIds, setPracticalIds] = useState([]);

    useEffect(() => {
        async function fetchPracticalIds() {
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

                const user_res = await fetch(`http://localhost:3001/api/user/${userId}`, requestOptions);
                const userData = await user_res.json()


                const practicalIds = userData.inPracticals

                setPracticalIds(practicalIds)
            } catch (e) {
                console.log(e);
            }
        }

        fetchPracticalIds()
    }, [])

    useEffect(() => {

        async function fetchDashboard() {

            try {

                const user = auth.currentUser;
                const token = user && (await user.getIdToken());



                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                };

                let newRows = []

                practicalIds.map(async (practicalId) => {
                    const practical_res = await fetch(`http://localhost:3001/api/practical/${practicalId}`);
                    const practicalData = await practical_res.json()


                    const instructor_res = await fetch(`http://localhost:3001/api/user/${practicalData.user_instructor}`, requestOptions);
                    const instructorData = await instructor_res.json()

                    let newRow = {
                        path: `/practicals/` + practicalId,
                        name: practicalData.practical_name,
                        instructor: instructorData.real_name,
                        date: practicalData.creation_date
                    }


                    newRows.push(newRow)


                })




                setRows(newRows)

                setLoading(false)
            } catch (e) {
                console.log(e)
            }

        }

        fetchDashboard()
    }, [practicalIds])

    // useEffect(() => { console.log(rows) }, [rows])
    console.log(practicalIds)


    // if (rows.length == 0) {
    //     return (
    //         <div>
    //             Loading...
    //         </div>
    //     )
    // }

    console.log(rows)


    return (




        <Box sx={{
            minHeight: "100%",
            minWidth: "100%"
        }}>

            <Grid container spacing={0}>
                <Grid xs={2}>
                    <SideBar />
                </Grid>
                <Grid xs={10}>
                    <Box sx={{
                        Height: "100%",
                        Width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <Header />
                        <Box sx={{
                            Height: "100%",
                            Width: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                            mt: 5,
                            mb: 5
                        }}>

                            <center><h1>Dashboard</h1></center>
                        </Box>

                        <Grid container spacing={0}>
                            <Grid xs={6}>
                                <Container maxWidth="sm" sx={{
                                    alignContent: "center",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}>
                                    <Box>
                                        <center><h2>Joined Practicals</h2></center>
                                    </Box>

                                    <TableContainer component={Paper}>
                                        <Table aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Practical Name</TableCell>
                                                    <TableCell align="right">Instructor</TableCell>
                                                    <TableCell align="right">Creation Date</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {rows.map((row, idx) => (
                                                    <TableRow
                                                        key={idx}
                                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                    >
                                                        <TableCell component="th" scope="row">
                                                            {/* <Link to={row.path}> */}
                                                            {row.name}
                                                            {/* </Link> */}

                                                        </TableCell>
                                                        <TableCell align="right">{row.instructor}</TableCell>
                                                        <TableCell align="right">{row.date}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>


                                </Container>

                            </Grid>
                            <Grid xs={6}>
                                <Container maxWidth="sm%">
                                    hi
                                </Container>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>



        </Box>
    )
}
