import { Box } from '@mui/material'
import React from 'react'
import Header from '../elements/Header';
import Grid from '@mui/material/Unstable_Grid2';

export default function Home() {
    return (
        <Box sx = 
        {{minHeight: "100%",
        minWidth: "100%",}}>
            <Header/>


            <Grid container spacing={0}>
                <Grid xs={2}/>

                <Grid xs={5}>
                    <Box sx= {{minHeight:"100%", minWidth:"100%"}}>

                    </Box>
                </Grid>

                <Grid xs={2}/>


            </Grid>



        </Box>
    )
}
