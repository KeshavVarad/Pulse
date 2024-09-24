import React from 'react';
import { Container, Typography, Paper, Button } from '@mui/material';
import { Assessment, School, People, Chat, Build } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <Container maxWidth="lg" sx={{ marginTop: '80px', padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Header Section */}
            <Paper elevation={5} sx={{ padding: '2rem', marginBottom: '2rem', backgroundColor: '#fff', borderRadius: '8px' }}>
                <Typography variant="h2" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    Welcome to Pulse
                </Typography>
                <Typography variant="h6" align="center" gutterBottom sx={{ color: '#555' }}>
                    Empowering Medical Schools Through Feedback
                </Typography>
                <Typography variant="body1" align="center" gutterBottom sx={{ color: '#777', lineHeight: 1.5 }}>
                    Pulse provides a robust mechanism for gathering and analyzing feedback from practical demonstrations, allowing medical schools to enhance their curricula and improve student learning outcomes.
                </Typography>
                <Button variant="contained" color="primary" sx={{ display: 'block', margin: '1rem auto', padding: '0.75rem 2rem' }} component={Link} to="/learn-more">
                    Learn More
                </Button>
            </Paper>

            {/* Section 1: Data-Driven Curriculum Improvement */}
            <Paper elevation={2} sx={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#ffffff', borderRadius: '8px' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    <Assessment sx={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Data-Driven Curriculum Improvement
                </Typography>
                <Typography variant="body1" sx={{ color: '#555' }}>
                    Utilizing feedback to identify strengths and weaknesses in training programs, fostering continuous improvement in medical education.
                </Typography>
            </Paper>

            {/* Section 2: Enhancing Instructor Feedback */}
            <Paper elevation={2} sx={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#ffffff', borderRadius: '8px' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    <People sx={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Enhancing Instructor Feedback
                </Typography>
                <Typography variant="body1" sx={{ color: '#555' }}>
                    Empowering instructors to provide meaningful, data-backed feedback without compromising rapport with students.
                </Typography>
            </Paper>

            {/* Section 3: Effective Communication Skills */}
            <Paper elevation={2} sx={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#ffffff', borderRadius: '8px' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    <Chat sx={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Effective Communication Skills
                </Typography>
                <Typography variant="body1" sx={{ color: '#555' }}>
                    Facilitating constructive dialogue between students and instructors to improve overall learning experiences.
                </Typography>
            </Paper>

            {/* Section 4: Building Strong Educational Partnerships */}
            <Paper elevation={2} sx={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#ffffff', borderRadius: '8px' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    <Build sx={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Building Strong Educational Partnerships
                </Typography>
                <Typography variant="body1" sx={{ color: '#555' }}>
                    Collaborating with medical schools to enhance curriculum delivery and student engagement through actionable feedback.
                </Typography>
            </Paper>

            {/* Section 5: Technology-Enabled Feedback Systems */}
            <Paper elevation={2} sx={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#ffffff', borderRadius: '8px' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    <Assessment sx={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Technology-Enabled Feedback Systems
                </Typography>
                <Typography variant="body1" sx={{ color: '#555' }}>
                    Streamlining the feedback process using technology to ensure timely and constructive insights for curriculum improvement.
                </Typography>
            </Paper>

            {/* Footer */}
            <Paper elevation={5} sx={{ padding: '2rem', marginTop: '2rem', backgroundColor: '#fff', borderRadius: '8px' }}>
                <Typography variant="body2" align="center" sx={{ color: '#777' }}>
                    © 2024 Pulse. All rights reserved.
                </Typography>
            </Paper>
        </Container>
    );
};

export default Home;
