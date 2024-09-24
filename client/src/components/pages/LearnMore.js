import React from 'react';
import { Container, Typography, Paper, Grid } from '@mui/material';
import { CloudUpload, Assignment, PlayArrow, Comment, Chat, Feedback, ShowChart } from '@mui/icons-material';

const LearnMore = () => {
    return (
        <Container maxWidth="lg" sx={{ marginTop: '80px', padding: '2rem' }}>
            <Typography variant="h2" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                Learn More About Pulse
            </Typography>
            <Typography variant="h6" align="center" gutterBottom sx={{ color: '#555' }}>
                Revolutionizing Medical Education Through Effective Feedback
            </Typography>

            <Grid container spacing={2} sx={{ marginTop: '2rem' }}>
                {/* Instructors Section */}
                <Grid item xs={12}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>For Instructors</Typography>
                </Grid>
                {[
                    { icon: <CloudUpload />, text: 'Upload Practicals', desc: 'Easily upload recorded practical sessions for review.' },
                    { icon: <Assignment />, text: 'Create Assessment Tasks', desc: 'Design and assign tasks focused on key competencies like Communication, Integrity, and Teamwork.' },
                    { icon: <PlayArrow />, text: 'Real-Time Feedback During Videos', desc: 'Click Red, Yellow, or Green while watching practical videos to note student performance in real-time.' },
                    { icon: <Comment />, text: 'Add Comments for Clarity', desc: 'Provide detailed feedback with additional comments for each performance note.' },
                    { icon: <Chat />, text: 'Discuss Feedback', desc: 'Engage in constructive discussions with students regarding their performance.' },
                ].map((feature, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                        <Paper elevation={2} sx={{ padding: '1rem', textAlign: 'center' }}>
                            {feature.icon}
                            <Typography variant="h6">{feature.text}</Typography>
                            <Typography variant="body2">{feature.desc}</Typography>
                        </Paper>
                    </Grid>
                ))}

                {/* Students Section */}
                <Grid item xs={12}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', marginTop: '2rem' }}>For Students</Typography>
                </Grid>
                {[
                    { icon: <Feedback />, text: 'View Feedback in Real-Time', desc: 'Access feedback while watching their recorded practical sessions for immediate insights.' },
                    { icon: <ShowChart />, text: 'Performance Tracking Over Time', desc: 'Monitor progress on key tasks across various practicals to identify strengths and areas for improvement.' },
                    { icon: <Chat />, text: 'AI Teaching Assistant', desc: 'Ask an AI Teaching Assistant for further clarification on feedback received to enhance understanding.' },
                ].map((feature, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                        <Paper elevation={2} sx={{ padding: '1rem', textAlign: 'center' }}>
                            {feature.icon}
                            <Typography variant="h6">{feature.text}</Typography>
                            <Typography variant="body2">{feature.desc}</Typography>
                        </Paper>
                    </Grid>
                ))}

                {/* Administration Section */}
                <Grid item xs={12}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', marginTop: '2rem' }}>For Administration</Typography>
                </Grid>
                {[
                    { icon: <ShowChart />, text: 'Cohort Performance Analysis', desc: 'Analyze task performance trends across different student cohorts over the years to make informed curriculum decisions.' },
                    { icon: <ShowChart />, text: 'Curriculum Improvement Insights', desc: 'Utilize performance data to guide enhancements to the medical curriculum.' },
                ].map((feature, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                        <Paper elevation={2} sx={{ padding: '1rem', textAlign: 'center' }}>
                            {feature.icon}
                            <Typography variant="h6">{feature.text}</Typography>
                            <Typography variant="body2">{feature.desc}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default LearnMore;
