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
import { Box } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { useAuth } from '../../contexts/AuthContext';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Link, useNavigate } from 'react-router-dom'



const drawerWidth = 240;
export default function NavBar() {
    const { currentUser, logout, setError } = useAuth();

    const navigate = useNavigate();
    async function handleLogout() {
        try {
            setError("");
            await logout();
            navigate("/login");
        } catch {
            setError("Failed to logout");
        }
    }
    return (
            <Drawer sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
                }}
                variant="permanent"
                anchor="left">
                    <Toolbar />
                    <Divider />
                    
                    <Box sx={{
                        pt:3,
                        pl: 3
                    }}>
                        Navigation
                    </Box>
                    
                    <List>
                    { ['Dashboard', 'Practicals', 'Make Practical', 'Analytics'].map((text, index) => (
                        <ListItem key={text} disablePadding>
                        <ListItemButton component={Link} to=
                        {
                            index === 0 ? "/dashboard" : index === 1? "": index === 2? "":""
                        }
                         variant="contained" color="secondary">
                            <ListItemIcon>
                            {index === 0 ? <SpaceDashboardOutlinedIcon /> : index === 1? <AssessmentOutlinedIcon />: index === 2? <AddchartIcon/>:<InsightsIcon/>}

                            </ListItemIcon>
                            <ListItemText primary={text} />
                        </ListItemButton>
                        </ListItem>
                    ))} 
                    </List>
                    <Box sx={{
                        pt:3,
                        pl: 3
                    }}>
                        Authentication
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
