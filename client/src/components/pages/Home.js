import { Box } from '@mui/material'
import React from 'react'
import Header from '../elements/Header';

export default function Home() {
    return (
        <Box sx = 
        {{minHeight: "100%",
        minWidth: "100%",}}>
            <Header/>
        </Box>
    )
}
