import React from 'react'
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AddchartIcon from '@mui/icons-material/Addchart';
import { Box, Icon } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { useAuth } from '../../contexts/AuthContext';
import auth from '../../config/firebase';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Link, useNavigate } from 'react-router-dom'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import Joyride from 'react-joyride';
import { useState, useEffect } from 'react';

const drawerWidth = 240;
export default function SideBar() {
    const { currentUser, logout, setError } = useAuth();

    const navigate = useNavigate();
    async function handleLogout() {
        try {
            setError("");
            await logout();
            navigate("/home");
        } catch {
            setError("Failed to logout");
        }
    }

    const [navTutorial, setNavTutorial] = useState(false)
    const [isSidebarMounted, setSidebarMounted] = useState(false);


    const handleNavJoyrideCallback = async (data) => {
        const { action, index, origin, status, type } = data;

        if (["finished", "skipped"].includes(status)) {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            if (currentUser) {
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
    }

    useEffect(() => {
        async function fetchUser() {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            if (currentUser) {
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
            }

        }

        if (currentUser) {
            fetchUser()
        }
    }, [currentUser])

    useEffect(() => {
        const sidebar_element = document.querySelector('.dashboard');
        if (sidebar_element) {
            setSidebarMounted(true);
        } else {
            setSidebarMounted(false);
        }

    }, [])

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

    return (
        <Drawer sx={{
            width: 120,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
                width: 2 / 12,
                boxSizing: 'border-box',
            },
        }}
            variant="permanent"
            anchor="left">

            {(isSidebarMounted) ?
                (
                    <Joyride steps={sidebar_tutorial_steps} continuous callback={handleNavJoyrideCallback} run={!navTutorial} styles={{ options: { zIndex: 1500 } }} />
                ) : null
            }

            <Toolbar>
                <MonitorHeartIcon fontSize='large' />
                <h3> Pulse</h3>
            </Toolbar>
            <Divider />

            <Box sx={{
                pt: 3,
                pl: 3,
            }}>
                Navigation
            </Box>

            <List className='navigation_options'>

                <ListItem key={"Dashboard"} disablePadding>
                    <div className='dashboard'>
                        <ListItemButton component={Link} to={"/dashboard"}
                            variant="contained" color="secondary">
                            <ListItemIcon><SpaceDashboardOutlinedIcon /></ListItemIcon>
                            <ListItemText primary={"Dashboard"} />
                        </ListItemButton>
                    </div>
                </ListItem>
                <ListItem key={"Make Practical"} disablePadding>
                    <div className='make-practical'>
                        <ListItemButton component={Link} to={"/makepractical"}
                            variant="contained" color="secondary">
                            <ListItemIcon><AddchartIcon /></ListItemIcon>
                            <ListItemText primary={"Make Practical"} />
                        </ListItemButton>
                    </div>
                </ListItem>
                <ListItem key={"Analytics"} disablePadding>
                    <div className='analytics'>
                        <ListItemButton component={Link} to={""}
                            variant="contained" color="secondary">
                            <ListItemIcon><InsightsIcon /></ListItemIcon>
                            <ListItemText primary={"Analytics"} />
                        </ListItemButton>
                    </div>
                </ListItem>

            </List>
            <Box sx={{
                pt: 3,
                pl: 3
            }}>
                Account
            </Box>
            {
                <List>
                    <ListItem key={"Account"} disablePadding>
                        <ListItemButton component={Link} to={""}
                            variant="contained" color="secondary">
                            <ListItemIcon><AccountCircleOutlinedIcon /></ListItemIcon>
                            <ListItemText primary={"Account"} />
                        </ListItemButton>
                    </ListItem>

                    <ListItem key={"Log Out"} disablePadding>
                        <ListItemButton onClick={handleLogout} variant="contained" color="secondary">
                            <ListItemIcon><LogoutOutlinedIcon /></ListItemIcon>
                            <ListItemText primary={"Log Out"} />
                        </ListItemButton>
                    </ListItem>
                </List>
            }
        </Drawer>
    )
}
