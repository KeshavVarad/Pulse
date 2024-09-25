import { Card, CardContent, Box, Button, Container, Grid, List, Modal, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { auth } from '../../config/firebase'
import InfoIcon from '@mui/icons-material/Info';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, Title, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from "react-chartjs-2";
import { Switch, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText } from "@mui/material";


ChartJS.register(RadialLinearScale, CategoryScale, LinearScale, Title, PointElement, LineElement, Filler, Tooltip, Legend);

const LineChartComponent = ({ data, isDemo }) => {

    if (isDemo) {
        data = [
            {
                cohort_year: 2027,
                data: [
                    {
                        year: 2021,
                        data: [
                            { name: "Patient-centeredness", avg_rating: 3.2 },
                            { name: "Effectiveness", avg_rating: 4.1 },
                            { name: "Efficiency", avg_rating: 3.8 },
                            { name: "Safety", avg_rating: 4.0 },
                        ],
                    },
                    {
                        year: 2022,
                        data: [
                            { name: "Patient-centeredness", avg_rating: 3.5 },
                            { name: "Effectiveness", avg_rating: 4.3 },
                            { name: "Efficiency", avg_rating: 3.9 },
                            { name: "Safety", avg_rating: 4.2 },
                        ],
                    },
                    {
                        year: 2023,
                        data: [
                            { name: "Patient-centeredness", avg_rating: 3.8 },
                            { name: "Effectiveness", avg_rating: 4.5 },
                            { name: "Efficiency", avg_rating: 4.1 },
                            { name: "Safety", avg_rating: 4.3 },
                        ],
                    },
                    {
                        year: 2024,
                        data: [
                            { name: "Patient-centeredness", avg_rating: 4.0 },
                            { name: "Effectiveness", avg_rating: 4.7 },
                            { name: "Efficiency", avg_rating: 4.2 },
                            { name: "Safety", avg_rating: 4.4 },
                        ],
                    },
                ],
            },
            {
                cohort_year: 2028,
                data: [
                    {
                        year: 2021,
                        data: [
                            { name: "Patient-centeredness", avg_rating: 3.0 },
                            { name: "Effectiveness", avg_rating: 3.9 },
                            { name: "Efficiency", avg_rating: 3.5 },
                            { name: "Safety", avg_rating: 3.7 },
                        ],
                    },
                    {
                        year: 2022,
                        data: [
                            { name: "Patient-centeredness", avg_rating: 3.3 },
                            { name: "Effectiveness", avg_rating: 4.0 },
                            { name: "Efficiency", avg_rating: 3.7 },
                            { name: "Safety", avg_rating: 3.8 },
                        ],
                    },
                    {
                        year: 2023,
                        data: [
                            { name: "Patient-centeredness", avg_rating: 3.5 },
                            { name: "Effectiveness", avg_rating: 4.1 },
                            { name: "Efficiency", avg_rating: 3.8 },
                            { name: "Safety", avg_rating: 3.9 },
                        ],
                    },
                    {
                        year: 2024,
                        data: [
                            { name: "Patient-centeredness", avg_rating: 3.7 },
                            { name: "Effectiveness", avg_rating: 4.3 },
                            { name: "Efficiency", avg_rating: 3.9 },
                            { name: "Safety", avg_rating: 4.0 },
                        ],
                    },
                ],
            },
        ];
    }

    const [selectedTasks, setSelectedTasks] = useState([]);
    const [selectedCohortYears, setSelectedCohortYears] = useState([]);

    const [chartData, setChartData] = useState({
        labels: [], // No labels initially
        datasets: [] // No datasets initially
    });


    useEffect(() => {
        if (data.length > 0) {
            // Prepare chart data for selected tasks
            const datasets = selectedCohortYears.flatMap((cohortYear) => {
                const cohort = data.find((cohort) => cohort.cohort_year === cohortYear);
                if (!cohort) return []; // Skip if cohort is not found

                return selectedTasks.map((task, index) => {
                    const taskRatings = cohort.data.map((yearData) =>
                        yearData.data.find((t) => t.name === task)?.avg_rating || 0
                    );

                    return {
                        label: `${task} - Cohort ${cohortYear}`,
                        data: taskRatings,
                        fill: false,
                        backgroundColor: ["rgb(255, 99, 132)", "rgb(77, 255, 156)"][index % 2],
                        borderColor: ["rgba(255, 99, 132, 0.2)", "rgba(77, 255, 156, 0.73)"][index % 2],
                    };
                });
            });

            const chartLabels = selectedCohortYears.length > 0
                ? data
                    .filter(cohort => selectedCohortYears.includes(cohort.cohort_year))
                    .flatMap(cohort => cohort.data.map(yearData => yearData.year))
                : ['No Data'];

            const chart_data = {
                labels: [...new Set(chartLabels)], // Unique years for the x-axis
                datasets: datasets.length ? datasets : [], // Ensure datasets exist
            };

            setChartData(chart_data)
        }


    }, [selectedTasks, selectedCohortYears])

    if (data.length == 0) {
        return <Box>No Data</Box>
    }



    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: "right", // Customize legend position
                align: "start",
                labels: {
                    usePointStyle: true,
                },
            },
        },
    };

    return (
        <Box>
            {/* Title */}
            <Typography variant="h6" gutterBottom>
                Average Task Ratings Over Time
            </Typography>

            {/* Cohort Year Select */}
            <FormControl fullWidth>
                <InputLabel
                    id="cohort-year-select-label"
                    shrink={selectedCohortYears.length > 0}
                >
                    Select Cohort Year(s)
                </InputLabel>
                <Select
                    labelId="cohort-year-select-label"
                    multiple
                    value={selectedCohortYears}
                    onChange={(e) => setSelectedCohortYears(e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                >
                    {data.map((cohort) => (
                        <MenuItem key={cohort.cohort_year} value={cohort.cohort_year}>
                            <Checkbox checked={selectedCohortYears.indexOf(cohort.cohort_year) > -1} />
                            <ListItemText primary={cohort.cohort_year} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Task Select */}
            <FormControl fullWidth margin="normal">
                <InputLabel
                    id="task-select-label"
                    shrink={selectedTasks.length > 0}
                >
                    Select Tasks
                </InputLabel>
                <Select
                    labelId="task-select-label"
                    multiple
                    value={selectedTasks}
                    onChange={(e) => setSelectedTasks(e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                >
                    {data[0]?.data[0]?.data.map((task) => (
                        <MenuItem key={task.name} value={task.name}>
                            <Checkbox checked={selectedTasks.indexOf(task.name) > -1} />
                            <ListItemText primary={task.name} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Line Chart */}
            <Box sx={{ mt: 4 }}>
                <Line data={chartData} options={chartOptions} />
            </Box>
        </Box>


    )

}


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

    const [isDemo, setDemo] = useState(false);


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

    const handleDemoSwitch = () => {
        setDemo(!isDemo);
    }

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
                setTaskData(task_data)

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
                    <Typography variant="h3"> Analytics Dashboard </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    py: 5
                }}>
                    <Typography variant='h5'>Demo Switch</Typography>

                    <Switch
                        checked={isDemo}
                        onChange={handleDemoSwitch}
                        color="primary"
                    />
                </Box>

                <Box sx={{
                    width: "75%",
                    height: "100%",
                    py: 5
                }}>
                    <LineChartComponent data={taskData} isDemo={isDemo} />
                </Box>
            </Box>

        </Box>
    )
}
