import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActionArea, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { GridViewTwoTone, Person } from '@mui/icons-material';
import Divider from '@mui/material/Divider';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded';
import PersonIcon from '@mui/icons-material/Person';

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
            console.log(allTutorials)
        };

        fetchTutorials();
    }, []);

    return (
        <Box sx={{
            pt: 8,
            justifyContent:"center",
            display:"flex",
            flexDirection:"column",
            justifyItems:"center",
            alignContent:"center",
            alignContent:"center",
            width:"100%",
        }}>
            <Box sx={{
                mt:5,
                mb:7,
                width:"100%",
                justifyContent:"center",
                justifyItems:"center",
                display:"flex",
            }}>
            <Typography variant="h3">
                User Guides
            </Typography>
            </Box>
            
            <Divider/>


            
            <Grid container spacing={2} sx={{my:3}}>
                <Grid item xs={4} sx={{}}>
                <Card>
                <CardActionArea component={Link} to={`/tutorials/admin`} sx={{textTransform: 'none', '&:hover': {
                    textDecoration: 'underline', // Adds underline on hover
                    }

                }}>
                    <CardContent sx={{
                        
                        height:"200px",
                        display:"flex",
                        flexDirection:"column",
                        alignContent:"center",
                        justifyContent:"center",
                    }}>

                    <SchoolRoundedIcon size='large' color="primary.main"/>
                    <Typography variant="h4">
                        Administrators
                    </Typography>
                    </CardContent>


                </CardActionArea>
                </Card>
                </Grid>
                <Grid item xs={4}>
                <Card>
                <CardActionArea component={Link} to={`/tutorials/instructor`} sx={{textTransform: 'none', '&:hover': {
                    textDecoration: 'underline', // Adds underline on hover
                    }

                }}>
                    <CardContent sx={{
                        
                        height:"200px",
                        display:"flex",
                        flexDirection:"column",
                        alignContent:"center",
                        justifyContent:"center",
                    }}>

                    <HistoryEduRoundedIcon size='large' color="primary.main"/>
                    <Typography variant="h4">
                        Instructors
                    </Typography>
                    </CardContent>


                </CardActionArea>
                </Card>
                </Grid>
                <Grid item xs={4}>
                <Card>
                <CardActionArea component={Link} to={`/tutorials/student`} sx={{textTransform: 'none', '&:hover': {
                    textDecoration: 'underline', // Adds underline on hover
                    }

                }}>
                    <CardContent sx={{
                        
                        height:"200px",
                        display:"flex",
                        flexDirection:"column",
                        alignContent:"center",
                        justifyContent:"center",
                    }}>

                    <PersonIcon size='large' color="primary.main"/>
                    <Typography variant="h4">
                        Students
                    </Typography>
                    </CardContent>


                </CardActionArea>
                </Card>
                </Grid>



            </Grid>
        </Box>
    );
};

export default TutorialDashboard;
