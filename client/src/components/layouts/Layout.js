import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import SideBar from '../elements/SideBar'
import { Box, Grid } from '@mui/material'
import Header from '../elements/Header'
import Joyride, { ACTIONS } from 'react-joyride'
import { useState, useEffect } from 'react'
import auth from '../../config/firebase'

export default function Layout({ children }) {

    const { currentUser } = useAuth()
    const [navTutorial, setNavTutorial] = useState(false)
    const [dashTutorial, setDashTutorial] = useState(false)
    const [makePracticalTutorial, setMakePracticalTutorial] = useState(false)

    const handleNavJoyrideCallback = async (data) => {
        const { action, index, origin, status, type } = data;

        if (action == "close" | action == "reset") {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            const userId = currentUser.uid

            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ navigation_tutorial: true })
            }
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${userId}`, requestOptions);
            setNavTutorial(true)
        }
    }

    const handleDashJoyrideCallback = async (data) => {
        const { action, index, origin, status, type } = data;

        if (action == "close" | action == "reset") {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            const userId = currentUser.uid

            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ dashboard_tutorial: true })
            }

            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${userId}`, requestOptions);
            setDashTutorial(true)
        }
    }

    const handleMakePracticalJoyrideCallback = async (data) => {
        const { action, index, origin, status, type } = data;

        if (action == "close" | action == "reset") {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            const userId = currentUser.uid

            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ make_practical_tutorial: true })
            }

            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${userId}`, requestOptions);
            setMakePracticalTutorial(true)
        }
    }


    useEffect(() => {
        async function fetchUser() {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            const userId = currentUser.uid

            const requestOptions = {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }

            const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
            const userData = await user_res.json()

            setNavTutorial(userData.navigation_tutorial)
            setDashTutorial(userData.dashboard_tutorial)
            setMakePracticalTutorial(userData.make_practical_tutorial)
        }

        if (currentUser) {
            fetchUser()
        }
    }, [currentUser])



    const sidebar_tutorial_steps = [
        {
            target: ".dashboard",
            content: "Get an overview of the practicals you are a part of.",
            placement: "right"
        },
        {
            target: ".make-practical",
            content: "Make a practical for your students.",
            placement: "right"
        },
        {
            target: ".analytics",
            content: "See how you've been doing over time.",
            placement: "right"
        },
    ]

    const dashboard_tutorial_steps = [
        {
            target: ".student_practicals",
            content: "These are the practicals you are participating in.",
            placement: "bottom"
        },
        {
            target: ".instructor_practicals",
            content: "These are the practicals you are teaching.",
            placement: "bottom"
        },
    ]

    const make_practical_tutorial_steps = [
        {
            target: ".new_practical_name",
            content: "A descriptive name for your practical.",
            placement: "right"
        },
        {
            target: ".new_practical_video_link",
            content: "The YouTube video link of the practical. NOTE: Make sure that it is the part of the link BEFORE the question mark.",
            placement: "right"
        },
        {
            target: ".new_practical_participants",
            content: "The emails of the students participating in your practical. As you add students, they will be displayed in a list underneath this box.",
            placement: "right"
        },
        {
            target: ".new_practical_instructor",
            content: "The email of the instructor for this practical.",
            placement: "right"
        },
        {
            target: ".new_practical_submit",
            content: "Press submit when you're done!",
            placement: "right"
        },
    ]



    return (
        <Box sx={{
            display: "flex"
        }}>
            <Joyride steps={sidebar_tutorial_steps} continuous callback={handleNavJoyrideCallback} run={!navTutorial} styles={{ options: { zIndex: 1500 } }} />
            <Joyride steps={dashboard_tutorial_steps} continuous callback={handleDashJoyrideCallback} run={!dashTutorial} styles={{ options: { zIndex: 1500 } }} />
            <Joyride steps={make_practical_tutorial_steps} continuous callback={handleMakePracticalJoyrideCallback} run={!makePracticalTutorial} styles={{ options: { zIndex: 1500 } }} />



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
