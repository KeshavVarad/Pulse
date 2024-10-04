import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <Container maxWidth="lg" sx={{ marginTop: '80px', padding: '2rem' }}>

            {/* Header Section */}
            <Paper elevation={5} sx={{ padding: '2rem', marginBottom: '3rem', backgroundColor: '#fff', borderRadius: '8px' }}>
                <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    Pulse: Feedback, Simplified
                </Typography>
                <Typography variant="h6" align="center" gutterBottom sx={{ color: '#555' }}>
                    Clear, Honest, and Efficient Feedback for Practical Medical Education.
                </Typography>
                <Button variant="contained" color="primary" sx={{ display: 'block', margin: '1.5rem auto', padding: '0.75rem 2.5rem' }} component={Link} to="/learn_more">
                    Get Started
                </Button>
                <Button variant="contained" color="primary" sx={{ display: 'block', margin: '1.5rem auto', padding: '0.75rem 2.5rem' }} component={Link} to="/user_guides">
                    See the User Guides
                </Button>
            </Paper>

            {/* Section 1: Efficient Platform for Instructors */}
            <Paper elevation={3} sx={{ padding: '2rem', marginBottom: '3rem', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    Give Feedback in Just a Few Clicks
                </Typography>
                <Typography variant="body1" sx={{ color: '#555', marginBottom: '1.5rem' }}>
                    Pulse enables instructors to provide feedback efficiently, with minimal effort. Streamlined workflows allow for fast, meaningful input without sacrificing quality.
                </Typography>
                {/* Instructor Feedback Demo */}
                <Box sx={{ height: '300px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={"/demoGifs/instructorFeedback.gif"} alt="Instructor Feedback Demo" style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px' }} />
                </Box>
            </Paper>

            {/* Section 2: AI-Enhanced Feedback for Students */}
            <Paper elevation={3} sx={{ padding: '2rem', marginBottom: '3rem', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    AI-Enhanced Feedback for Students
                </Typography>
                <Typography variant="body1" sx={{ color: '#555', marginBottom: '1.5rem' }}>
                    Pulse’s AI-powered assistant breaks down complex feedback, providing students with clear, actionable insights into their performance.
                </Typography>
                {/* AI Teaching Assistant Demo */}
                <Box sx={{ height: '300px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={"/demoGifs/aiTeachingAssistant.gif"} alt="AI Teaching Assistant Demo" style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px' }} />
                </Box>
            </Paper>

            {/* Section 3: Data-Driven Insights for Administrators */}
            <Paper elevation={3} sx={{ padding: '2rem', marginBottom: '3rem', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    Data-Driven Insights for Administrators
                </Typography>
                <Typography variant="body1" sx={{ color: '#555', marginBottom: '1.5rem' }}>
                    Administrators can make data-backed decisions to fine-tune curricula based on performance insights, helping optimize learning outcomes for cohorts.
                </Typography>
                {/* Analytics Dashboard Demo */}
                <Box sx={{ height: '300px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={"/demoGifs/analyticsDashboard.gif"} alt="Admin Analytics Dashboard Demo" style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px' }} />
                </Box>
            </Paper>

            {/* Footer */}
            <Paper elevation={5} sx={{ padding: '2rem', marginTop: '3rem', backgroundColor: '#fff', borderRadius: '8px' }}>
                <Typography variant="body2" align="center" sx={{ color: '#777' }}>
                    © 2024 Pulse. All rights reserved.
                </Typography>
            </Paper>
        </Container>
    );
};

export default Home;
