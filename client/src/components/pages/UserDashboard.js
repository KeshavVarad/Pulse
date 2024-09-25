import React, { useRef } from 'react'
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { FormControl, InputLabel, Select, Chip, MenuItem } from "@mui/material"
import { useState, useEffect } from 'react';
import { auth } from "../../config/firebase.js";
import { useAuth } from '../../contexts/AuthContext.js';
//import { Link } from 'react-router-dom';
import Link from '@mui/material/Link';
import { format } from 'date-fns';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button, Typography } from '@mui/material';
import PracticalSettingsModal from '../elements/PracticalSettingsModal.js';
import Joyride from 'react-joyride';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import 'chart.js/auto';

const PracticalChart = ({ practicalData }) => {
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [chartData, setChartData] = useState({
        labels: [], // No labels initially
        datasets: [] // No datasets initially
    });


    // Calculate the performance score
    const calculatePerformance = (task) => {
        if (task.red_count + task.yellow_count + task.green_count == 0) {
            return -1
        }
        return (task.red_count + 3 * task.yellow_count + 5 * task.green_count) / (task.red_count + task.yellow_count + task.green_count);
    };

    const prepareChartData = (tasksToDisplay) => {
        const datasets = [];

        tasksToDisplay.forEach((taskName) => {
            const taskData = practicalData
                .map((practical) => {
                    const task = practical.tasks.find((t) => t.name === taskName);
                    if (task) {
                        if (calculatePerformance(task) === -1) {
                            return null;
                        }

                        // Round the date to the nearest day
                        const roundedDate = new Date(practical.creation_date);
                        roundedDate.setHours(0, 0, 0, 0); // Zero out the time part

                        return {
                            x: roundedDate, // Using rounded Date object for x-axis
                            y: calculatePerformance(task),
                        };
                    }
                    return null;
                })
                .filter((entry) => entry !== null)
                .sort((a, b) => a.x - b.x);

            // Aggregate points with the same day (x value)
            const aggregatedTaskData = taskData.reduce((acc, curr) => {
                const last = acc[acc.length - 1];
                if (last && last.x.getTime() === curr.x.getTime()) {
                    // If the current point has the same x (day) as the last one, average the y values
                    last.y = (last.y + curr.y) / 2;
                } else {
                    acc.push(curr);
                }
                return acc;
            }, []);

            datasets.push({
                label: taskName,
                data: aggregatedTaskData,
                fill: false,
                borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
                tension: 0.1,
            });
        });

        setChartData({
            datasets: datasets,
        });
    };


    // Handle task selection
    const handleTaskSelection = (event) => {
        const value = event.target.value;
        setSelectedTasks(value);
        prepareChartData(value);
    };

    // Extract unique task names for dropdown options
    const taskNames = Array.from(new Set(practicalData.flatMap((p) => p.tasks.map((t) => t.name))));

    return (
        <div>
            <FormControl sx={{ m: 1, minWidth: 300 }}>
                <InputLabel>Select Tasks</InputLabel>
                <Select
                    multiple
                    value={selectedTasks}
                    onChange={handleTaskSelection}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} label={value} />
                            ))}
                        </Box>
                    )}
                >
                    {taskNames.map((taskName) => (
                        <MenuItem key={taskName} value={taskName}>
                            {taskName}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Chart component */}
            <Line
                data={chartData}
                options={{
                    responsive: true,
                    scales: {
                        x: {
                            type: 'time', // Time-based x-axis
                            title: {
                                display: true,
                                text: 'Date',
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Performance',
                            },
                        },
                    },
                }}
            />
        </div>
    );
};
export default function UserDashboard() {
    const { currentUser } = useAuth()

    const [joinedPracticals, setJoinedPracticals] = useState([]);
    const [ownedPracticals, setOwnedPracticals] = useState([]);
    const [practicalSettingsOpen, setPracticalSettingsOpen] = useState(false);
    const [practicalSettingsId, setPracticalSettingsId] = useState(null);

    const [dashTutorial, setDashTutorial] = useState(true)
    const [isDashboardMounted, setDashboardMounted] = useState(false);
    const [isInstructor, setIsInstructor] = useState(false)

    const [practicalPerformanceData, setPracticalPerformanceData] = useState([]);


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

                if (!isInstructor) {
                    setPracticalPerformanceData(practicalData)
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

                if (userData.role === "instructor") {
                    setPracticalPerformanceData(practicalData)
                    console.log(practicalData)
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
    }, [isInstructor])

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
                    <Typography variant="h3"> Dashboard </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    width: "100%",
                }}>

                    {isInstructor ? (
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
                                                    <Link href={practical.path} underline="hover" variant="h7" fontWeight={500}>
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



                    ) : (
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
                                                    <Link href={practical.path} underline="hover" variant="h7" fontWeight={500}>
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
