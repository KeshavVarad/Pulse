import React from 'react'
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import NavBar from '../elements/SideBar';
import Header from '../elements/Header';
import SideBar from '../elements/SideBar';
import Grid from '@mui/material/Unstable_Grid2';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Divider, Icon, List, ListItem } from '@mui/material';
import Button from '@mui/material/Button';
import PersonIcon from '@mui/icons-material/Person';


export default function Dashboard() {


    
    const rows = [
        {name: 'duke cpr',
            participants: 6,
            instructor: 'John Doe',
            date: Date.now()
        }
    ];

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
                    <Box sx={{
                    Height:"100%",
                    Width:"100%",
                    justifyContent: "center",
                    alignItems: "center",
                    mt:5,
                    mb:5
                    }}>

                        <center><h1>Dashboard</h1></center>
                    </Box>

                    <Grid container spacing={0}>
                    <Grid xs={6}>
                        <Container maxWidth="sm" sx={{
                            alignContent: "center",
                            justifyContent: "center",
                            alignItems: "center",
                            }}>
                        <Box>
                            <center><h2>Joined Practicals</h2></center>
                        </Box>
                        <List>
                        {rows.map((row) => (
                            <ListItem sx={{
                                justifyContent: "center",
                                alignItems: "center",
                                height:120
                                }}>

                                    <Box height={120} width={400} borderRadius={2} bgcolor={'#1976d2'}>
                                        <Box height={120} width={200} bgcolor={'white'}>

                                        </Box>
                                    </Box>


     





                            </ListItem>
                                ))}
                        </List>
                        

                        </Container>
                        
                    </Grid>
                    <Grid xs={6}>
                        <Container maxWidth= "sm%">
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
