import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../../config/firebase';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import {
    Paper,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Box,
    Grid,
    Divider,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

const GenerateInsights = () => {
    const { currentUser } = useAuth();

    const [insights, setInsights] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [role, setRole] = useState("");
    const [userPerfData, setUserPerfData] = useState();

    useEffect(() => {
        async function fetchUserData() {
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

                // Fetch user data to check if they are an instructor
                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
                const userData = await user_res.json();

                let cleaned_practical_data = [];

                setRole(userData.role)

                // Check if user is an instructor
                if (userData.role === "instructor") {
                    // Fetch instructor's practicals
                    const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/instructor/${user.uid}`, requestOptions);
                    const instructorPracticals = await practical_res.json();

                    // Process each practical and organize by student
                    for (let practical of instructorPracticals) {
                        const participants = practical.user_participants;
                        let studentsData = {};

                        // Fetch each student's details
                        for (let studentId of participants) {
                            const student_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${studentId}`, requestOptions);
                            const studentData = await student_res.json();

                            // Clean tasks
                            let cleaned_tasks = practical.tasks.map((task) => ({
                                name: task.name,
                                red_count: task.red_count,
                                yellow_count: task.yellow_count,
                                green_count: task.green_count,
                                comments: [],
                            }));

                            // Fetch and organize comments for each task
                            for (let commentId of practical.comments) {
                                const comment_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`, requestOptions);
                                const commentData = await comment_res.json();

                                if (commentData.feedback !== "") {
                                    let task_index = cleaned_tasks.findIndex((task) => task.name === commentData.task);
                                    if (task_index !== -1) {
                                        cleaned_tasks[task_index].comments.push({
                                            rating: commentData.rating,
                                            feedback: commentData.feedback,
                                        });
                                    }
                                }
                            }

                            // Add cleaned tasks under each student
                            studentsData[studentData.real_name] = {
                                name: studentData.real_name,
                                tasks: cleaned_tasks,
                            };
                        }

                        // Clean practical data for each student
                        let cleanPractical = {
                            practical_name: practical.practical_name,
                            creation_date: format(practical.creation_date, 'MMMM do yyyy, h:mm:ss a'),
                            students: studentsData,  // Organize by student names
                        };

                        cleaned_practical_data.push(cleanPractical);
                    }
                } else {
                    // If the user is not an instructor (fetch practicals for a student)
                    const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/student/${user.uid}`, requestOptions);
                    const practicalData = await practical_res.json();

                    // Clean practicals for student
                    practicalData.map((practical) => {
                        let cleaned_tasks = practical.tasks.map((task) => ({
                            name: task.name,
                            red_count: task.red_count,
                            yellow_count: task.yellow_count,
                            green_count: task.green_count,
                            comments: [],
                        }));

                        practical.comments.map(async (commentId) => {
                            const comment_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`, requestOptions);
                            const commentData = await comment_res.json();

                            if (commentData.feedback === "") return;

                            let task_index = cleaned_tasks.findIndex((task) => task.name === commentData.task);
                            if (task_index !== -1) {
                                cleaned_tasks[task_index].comments.push({
                                    rating: commentData.rating,
                                    feedback: commentData.feedback,
                                });
                            }
                        });

                        let cleanPractical = {
                            name: practical.practical_name,
                            creation_date: format(practical.creation_date, 'MMMM do yyyy, h:mm:ss a'),
                            avg_rating: practical.avg_rating,
                            tasks: cleaned_tasks,
                        };

                        cleaned_practical_data.push(cleanPractical);
                    });
                }

                // Construct cleaned data to be set in state
                const cleanedData = {
                    name: userData.real_name,
                    role: userData.role,
                    cohort_year: userData.grad_year,
                    practicals: cleaned_practical_data,
                };

                setUserPerfData(cleanedData);
            } catch (e) {
                console.log(e);
            }
        }

        if (currentUser) {
            fetchUserData();
        }
    }, [currentUser]);

    const handleGenerateInsights = async (role) => {
        if (!userPerfData) return;

        setLoading(true);
        setError(null);

        let prompt = "";

        if (role === "student") {
            prompt = `What specific strategies can I implement to improve in the following areas based on my performance data: ${JSON.stringify(userPerfData)}?`;
        }

        if (role === "instructor") {
            prompt = `What trends can be identified in my students' performance data, and how can I address any concerning patterns? Data: ${JSON.stringify(userPerfData)}`;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_HOST}/api/chat`, {
                messages: [
                    { role: 'system', content: "You are a helpful assistant." },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 250
            });

            const aiMessageText = response.data.choices[0].message.content;
            setInsights(aiMessageText);
        } catch (error) {
            console.error("Error calling API:", error);
            setError("Failed to generate insights. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container spacing={3} padding={3}>
            <Grid item xs={12}>
                <Paper elevation={3} sx={{ padding: 3, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Insights on User Performance
                    </Typography>
                    {loading && <CircularProgress />}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {insights && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6">Generated Insights:</Typography>
                            <ReactMarkdown>{insights}</ReactMarkdown>
                        </Box>
                    )}
                    {!loading && !insights && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleGenerateInsights(role)}
                            sx={{ mt: 2 }}
                        >
                            Generate Insights
                        </Button>
                    )}
                    <Divider sx={{ my: 2 }} />
                </Paper>
            </Grid>
        </Grid>
    );
};

export default GenerateInsights;
