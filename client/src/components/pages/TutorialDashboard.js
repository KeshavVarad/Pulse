import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { Link } from 'react-router-dom';

const TutorialDashboard = () => {
    const [tutorials, setTutorials] = useState([]);

    useEffect(() => {
        const fetchTutorials = async () => {
            const roles = ['admin', 'instructor', 'student'];
            const allTutorials = [];

            for (const role of roles) {
                const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/user_guides/${role}`);
                if (response.ok) {
                    const folders = await response.json();

                    // Create tutorial data structure
                    folders.forEach(tutorial => {
                        allTutorials.push({ role, tutorial });
                    });
                }
            }

            setTutorials(allTutorials);
        };

        fetchTutorials();
    }, []);

    return (
        <Container sx={{
            pt: 10
        }}>
            <Typography variant="h3" gutterBottom>
                User Guides Dashboard
            </Typography>
            <Grid container spacing={3}>
                {tutorials.map(({ role, tutorial }, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                            <CardActionArea component={Link} to={`/user_guides/${role}/${tutorial}`}>
                                <CardContent>
                                    <Typography variant="h5">{tutorial}</Typography>
                                    <Typography variant="subtitle1" color="textSecondary">
                                        {role.charAt(0).toUpperCase() + role.slice(1)} Tutorial
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default TutorialDashboard;
