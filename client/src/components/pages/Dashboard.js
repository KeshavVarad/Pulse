import React from 'react'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import NavBar from '../elements/SideBar';
import Header from '../elements/Header';
import SideBar from '../elements/SideBar';
import Grid from '@mui/material/Unstable_Grid2';
const drawerWidth = 240;

export default function Dashboard() {
    return (
        
        <Box sx={{
            minHeight:"100%",
            minWidth:"100%"
        }}>

            <Grid container spacing={0}>
            <Grid xs={2}>
                <SideBar/>
            </Grid>
            <Grid xs={10}>
                <Box sx={{
                    Height:"100%",
                    Width:"100%",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <Header/>
                    <Grid container spacing={0}>
                    <Grid xs={6}>
                        <Container Width= "100%">
                        hi
                        </Container>
                        
                    </Grid>
                    <Grid xs={6}>
                        <Container Width= "100%">
                        hi
                        </Container>
                    </Grid>
                    </Grid>
                </Box>
            </Grid>
            </Grid>



        </Box>
    )
}
