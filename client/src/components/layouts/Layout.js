import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import SideBar from '../elements/SideBar'
import { Box, Grid } from '@mui/material'
import Header from '../elements/Header'
import Joyride from 'react-joyride'
import { useState, useEffect } from 'react'

export default function Layout({ children }) {

    const { currentUser } = useAuth()


    const tutorial_steps = [
        {
            target: ".dashboard",
            content: "Get an overview of the practicals you have available to you.",
            placement: "right"
        },
        {
            target: ".make-practical",
            content: "Make a practical for your students.",
            placement: "right"
        },
        {
            target: ".analytics",
            content: "See how your class is doing.",
            placement: "right"
        },
    ]
    const [joyrideRun, setJoyrideRun] = useState(false);
    useEffect(() => {
        console.log(document.querySelector('.dashboard .MuiButtonBase-root'));
        const timer = setTimeout(() => {
            setJoyrideRun(true);
        }, 1000); // 1-second delay

        return () => clearTimeout(timer);
    }, []);


    return (
        <Box sx={{
            display: "flex"
        }}>
            <Joyride steps={tutorial_steps} continuous run={joyrideRun} callback={(data) => console.log(data)} styles={{ options: { zIndex: 1500 } }} />




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
