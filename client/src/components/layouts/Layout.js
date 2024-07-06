import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import SideBar from '../elements/SideBar'
import { Box, Grid } from '@mui/material'
import Header from '../elements/Header'

export default function Layout({ children }) {

    const { currentUser } = useAuth()

    return (
        <Box sx={{
            display: "flex"
        }}>

            {currentUser ?
                (
                    <Box sx={{
                        width: "20%"
                    }}>

                        <SideBar />
                    </Box>
                ) :
                (null)}


            <Box sx={{
                height: "100%",
                width: "100%",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <Header />

                {children}

            </Box>
        </Box>


    )
}
