import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../../config/firebase';
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
    const [realName, setRealName] = useState();

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

                const userRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
                const userData = await userRes.json();
                setRole(userData.role);
                setRealName(userData.real_name);
            } catch (e) {
                console.error(e);
            }
        }
        if (currentUser) {
            fetchUserData();
        }
    }, [currentUser]);

    const handleGenerateInsights = async () => {
        setLoading(true);
        setError(null);

        let prompt = "";

        if (role === "student") {
            prompt = `My name is ${realName}. Based on my past performance feedback, what specific strategies can I implement to improve?`;
        } else if (role === "instructor") {
            prompt = "Based on my students' performance feedback, what trends can be identified and how can I address concerning patterns?";
        } else {
            prompt = "Generate insights on performance feedback.";
        }

        try {
            const payload = {
                messages: [
                    { role: 'system', content: "You are a helpful educational insights assistant." },
                    { role: 'user', content: prompt }
                ],
                userId: currentUser.uid,
                role: role,
                max_tokens: 250,
            };

            const response = await axios.post(`${process.env.REACT_APP_API_HOST}/api/insights`, payload);

            // The new backend format returns an object with:
            // - response: the assistant's latest message,
            // - chatHistory: the updated conversation history,
            // - threadId: the conversation id.
            const aiMessageText = response.data.response.content;
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
                            onClick={handleGenerateInsights}
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
