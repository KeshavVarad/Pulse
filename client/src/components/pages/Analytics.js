import { Card, CardContent, Box, Button, Container, Grid, List, Modal, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import auth from '../../config/firebase'
import InfoIcon from '@mui/icons-material/Info';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);


export default function Analytics() {

    const [schoolId, setSchoolId] = useState()
    const [taskData, setTaskData] = useState([])
    const [cohortAvgs, setCohortAvgs] = useState([])
    const [cohortYears, setCohortYears] = useState([])


    const [loading, setLoading] = useState(true)

    const [cohortGraphOpen, setCohortGraphOpen] = useState(false)
    const [selectedCohort, setSelectedCohort] = useState()
    const [selectedCohortInd, setSelectedCohortInd] = useState(-1)
    const [cohortPlotData, setCohortPlotData] = useState([])

    const testCohortPlotData = [[{
        labels: ["Integrity", "Teamwork", "Communication"],
        datasets: [
            {
                label: `Year 2024`,
                data: [2.5, 4, 1.5],
                backgroundColor: 'rgba(63, 81, 181, 0.2)',
                borderColor: 'rgba(63, 81, 181, 1)',
                borderWidth: 2,
            }
        ]
    }, {
        labels: ["Integrity", "Teamwork", "Communication"],
        datasets: [
            {
                label: `Year 2025`,
                data: [4.5, 3, 2],
                backgroundColor: 'rgba(63, 81, 181, 0.2)',
                borderColor: 'rgba(63, 81, 181, 1)',
                borderWidth: 2,
            }
        ]
    }]]

    const options = {
        scales: {
            r: {
                angleLines: { display: false },
                suggestedMin: 0,
                suggestedMax: 5,
            },
        },
    };


    const handleCohortGraphButton = (cohort_year, idx) => {
        setSelectedCohort(cohort_year)
        setSelectedCohortInd(idx)
        setCohortGraphOpen(true)
    }

    const handleCohortGraphClose = () => {
        setCohortGraphOpen(false)
        setSelectedCohortInd(-1)
        setSelectedCohort()
    }

    useEffect(() => {
        console.log(selectedCohortInd)
        console.log(cohortPlotData[selectedCohortInd])
    }, [selectedCohortInd])

    useEffect(() => {
        async function getUserData() {
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
                const user_data = await user_res.json()

                setSchoolId(user_data.school_id)

            } catch (e) {
                console.log(e);
            }
        }

        getUserData()

    }, [])

    useEffect(() => {

        async function fetchSchoolData() {
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

                setLoading(true)

                const school_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/school/${schoolId}`, requestOptions);
                const school_data = await school_res.json()

                let task_data = []

                school_data.task_data.map((data) => {
                    task_data.push(data)
                })

                let cohort_data = []
                let cohort_years = []
                school_data.task_data.map((cohort) => {

                    if (cohort.data) {
                        let total_tasks = 0
                        let score_sum = 0
                        cohort.data.map((year) => {
                            year.data.map((task) => {
                                score_sum += task.avg_rating
                                total_tasks += 1
                            })
                        })

                        cohort_data.push(score_sum / total_tasks)
                        cohort_years.push(cohort.cohort_year)
                    }

                })

                let cohorts_plot_data = []

                school_data.task_data.map((cohort) => {
                    let cohort_plot_data = []
                    if (cohort.data) {
                        cohort.data.map(year => {
                            let labels = []
                            let data = []

                            year.data.map(task => {
                                labels.push(task.name)
                                data.push(task.avg_rating)
                            })

                            cohort_plot_data.push({
                                labels: labels,
                                datasets: [
                                    {
                                        label: `Year ${year.year}`,
                                        data: data,
                                        backgroundColor: 'rgba(63, 81, 181, 0.2)',
                                        borderColor: 'rgba(63, 81, 181, 1)',
                                        borderWidth: 2,
                                    }
                                ]
                            })
                        })

                        cohorts_plot_data.push(cohort_plot_data)
                    }


                })

                setCohortPlotData(cohorts_plot_data)

                console.log(cohorts_plot_data)

                setCohortYears(cohort_years)
                setCohortAvgs(cohort_data)
                setTaskData(task_data)
                setLoading(false)


            } catch (e) {
                console.log(e)
            }
        }

        if (schoolId) {
            fetchSchoolData()
        }

    }, [schoolId])

    return (
        <Box sx={{
            minHeight: "100%",
            minWidth: "100%",
        }}>
            <Box sx={{
                minHeight: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 8,
                flexDirection: "column"
            }}>
                <Box sx={{
                    py: 5
                }}>
                    <Typography variant="h4"> Analytics Dashboard </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    width: "100%",
                }}>
                    <Container className="cohort_info" sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        <Box>
                            <center><h2>Cohort Information</h2></center>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={{ minWidth: 10 }}>Cohort Year</TableCell>
                                        <TableCell align="right">Average Score</TableCell>
                                        <TableCell align="right">More Info</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cohortAvgs.map((cohort_avg, idx) => (
                                        <TableRow
                                            key={idx}
                                        >
                                            <TableCell component="th" scope="row">
                                                {cohortYears[idx]}
                                            </TableCell>
                                            <TableCell align="right">
                                                {Math.round((cohort_avg + Number.EPSILON) * 100) / 100}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button onClick={() => handleCohortGraphButton(cohortYears[idx], idx)}>
                                                    <InfoIcon />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>

                            </Table>
                        </TableContainer>

                    </Container>

                </Box>
            </Box>

            <Modal
                open={cohortGraphOpen}
                onClose={handleCohortGraphClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 800,
                    bgcolor: "background.paper",
                    border: "2px solid #000",
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            {selectedCohort ? "Cohort " + selectedCohort : "No Cohort Selected"}
                        </Typography>


                        <Box sx={{
                            display: "flex"
                        }}>
                            {
                                cohortPlotData[selectedCohortInd] ? cohortPlotData[selectedCohortInd].map(cohort_data => (
                                    <Card sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        width: "100%",
                                    }}>
                                        <CardContent>
                                            <Typography variant="h5" component="div" gutterBottom>
                                                {cohort_data.datasets.label}
                                            </Typography>
                                            <Radar data={cohort_data} options={options} />
                                        </CardContent>
                                    </Card>
                                )) : (<Box>No Data</Box>)
                            }

                        </Box>




                    </Box>

                </Box>
            </Modal >
        </Box>
    )
}
