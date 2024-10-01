import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActionArea, Box, Button, Divider } from '@mui/material';
import { Link } from 'react-router-dom';

function formatString(str) {
    const smallWords = ['a', 'an', 'the', 'and', 'or', 'but', 'on', 'in', 'with'];
  
    return str
      .replace(/_/g, ' ') // Replace all underscores with spaces
      .split(' ')          // Split the string into an array of words
      .map((word, index) => {
        // Capitalize the first word or any word not in the smallWords list
        if (index === 0 || !smallWords.includes(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        } else {
          return word; // Keep small words lowercase
        }
      })
      .join(' ');          // Join the array back into a string
  }

const TutorialInstructor = () => {
    const [tutorials, setTutorials] = useState([]);

    useEffect(() => {
        const fetchTutorials = async () => {
            
            const allTutorials = [];


            const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/user_guides/${"instructor"}`);
            if (response.ok) {
                const folders = await response.json();

                folders.forEach(tutorial => {
                    allTutorials.push({tutorial});
                });
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
            width:"100%",
        }}>

            <Button component={Link} to={`/user_guides/`} sx={{textTransform: 'none', 
                '&:hover': {
                    textDecoration: 'underline', // Adds underline on hover
                    },
                position:"absolute",
                top:80,
                }}>
                Back to User Guides
            </Button>



            <Box sx={{
                width:"100%",
                mt:5,
                mb:7,
                justifyContent:"center",
                justifyItems:"center",
                display:"flex"
            }}>
            <Typography variant="h3">
                Instructor User Guides
            </Typography>
            </Box>
            <Divider/>

            <Grid container spacing={3}sx={{my:3}}>
                {tutorials.map(({tutorial}, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card>
                            <CardActionArea component={Link} to={`/user_guides/instructor/${tutorial}/`}>
                                <CardContent>
                                    <Typography variant="h5">{formatString(tutorial)}</Typography>
                                    <Typography variant="subtitle1" color="textSecondary">
                                        Instructor Tutorial
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default TutorialInstructor;
