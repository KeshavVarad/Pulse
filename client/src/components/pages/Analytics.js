import { Box, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { auth } from '../../config/firebase'
import { Chart as ChartJS, CategoryScale, LinearScale, Title, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from "react-chartjs-2";
import { Switch, Select, MenuItem, FormControl, InputLabel, Chip, Checkbox, ListItemText } from "@mui/material";
import GenerateInsights from '../elements/GenerateInsights';

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


const PracticalChart = ({ practicalData }) => {
    const taskNames = Array.from(new Set(practicalData.flatMap((p) => p.tasks.map((t) => t.name))));

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

    useEffect(() => {
        if (taskNames.length > 0) {
            setSelectedTasks(taskNames)
            prepareChartData(taskNames);
        }
        // Only run this effect when taskNames changes
    }, [taskNames.length]);

    return (
        <div>

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

export default function Analytics() {

    const [schoolId, setSchoolId] = useState()
    const [taskData, setTaskData] = useState([])

    const [isDemo, setDemo] = useState(false);

    const [isAdmin, setIsAdmin] = useState(true);

    const [practicalPerformanceData, setPracticalPerformanceData] = useState([]);


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

                if (user_data.role === "admin") {
                    setIsAdmin(true);
                }
                else {
                    setIsAdmin(false);
                }

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

                const school_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/school/${schoolId}`, requestOptions);
                const school_data = await school_res.json()

                let task_data = []

                school_data.task_data.map((data) => {
                    task_data.push(data)
                })
                setTaskData(task_data)


            } catch (e) {
                console.log(e)
            }
        }

        if (schoolId) {
            fetchSchoolData()
        }

    }, [schoolId])

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
                    const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${userData.role}/${userData.id}`, requestOptions);
                    practicalData = await practical_res.json()
                }

                setPracticalPerformanceData(practicalData)
            } catch (e) {
                console.log(e);
            }
        }
        if (!isAdmin) {
            fetchPracticals()
        }
    }, [isAdmin])

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

                {isAdmin ?
                    (<>
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
                        </Box></>) :
                    (<Box sx={{
                        width: "75%",
                        height: "100%",
                        py: 0
                    }}>
                        <PracticalChart practicalData={practicalPerformanceData} />
                    </Box>)}

                {!isAdmin ? (<GenerateInsights />) : null}


            </Box>

        </Box>
    )
}
