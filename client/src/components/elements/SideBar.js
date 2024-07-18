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
                        <ListItemButton component={Link} to={"/dashboard"}
                            variant="contained" color="secondary">
                            <ListItemIcon><SpaceDashboardOutlinedIcon /></ListItemIcon>
                            <ListItemText primary={"Dashboard"} />
                        </ListItemButton>
                    </ListItem>
                    <ListItem key={"Make Practical"} disablePadding>
                        <ListItemButton component={Link} to={"/makepractical"}
                            variant="contained" color="secondary">
                            <ListItemIcon><AddchartIcon /></ListItemIcon>
                            <ListItemText primary={"Make Practical"} />
                        </ListItemButton>
                    </ListItem>
                    <ListItem key={"Analytics"} disablePadding>
                        <ListItemButton component={Link} to={""}
                            variant="contained" color="secondary">
                            <ListItemIcon><InsightsIcon /></ListItemIcon>
                            <ListItemText primary={"Analytics"} />
                        </ListItemButton>
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
