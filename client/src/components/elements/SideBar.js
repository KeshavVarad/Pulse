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
import { Box, Fab, Icon, TextField, Button, Modal } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Link, useNavigate } from 'react-router-dom'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import Joyride from 'react-joyride';
import { useState, useEffect } from 'react';
import auth from "../../config/firebase.js";
import { useAuth } from '../../contexts/AuthContext.js';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BugReportIcon from '@mui/icons-material/BugReport';
import { CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from "axios"


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
    const [isAdmin, setIsAdmin] = useState(false)
    const [isStudent, setIsStudent] = useState(false)

    const [openModal, setOpenModal] = useState(false);
    const [bugDescription, setBugDescription] = useState('');
    const [bugCause, setBugCause] = useState('');
    const [bugSteps, setBugSteps] = useState('');
    const [bugCategory, setBugCategory] = useState('');

    const [submitting, setSubmitting] = useState(false);

    const handleBugReportSubmit = async () => {
        setSubmitting(true);

        const bugReport = {
            description: bugDescription,
            cause: bugCause,
            steps: bugSteps,
            category: bugCategory,
        };

        try {
            // Send the bug data to your backend
            await axios.post(`${process.env.REACT_APP_API_HOST}/api/report-bug`, bugReport);

            // Clear the form and close modal on success
            setBugDescription('');
            setBugCause('');
            setBugSteps('');
            setBugCategory('');
            setOpenModal(false);
            alert('Bug reported successfully.');
        } catch (error) {
            console.error('Error reporting bug:', error);
            alert('Failed to report bug.');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {

        async function checkUser() {
            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());

                const userId = user.uid;

                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                };

                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
                const user_data = await user_res.json()

                if (user_data.role === "admin" || user_data.role === "instructor") {
                    setIsAdmin(true);
                }

                if (user_data.role === "student") {
                    setIsStudent(true);
                }



            } catch (e) {
                console.log(e);
            }
        }

        checkUser()

    }, [])


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
                pt: 2,
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

                {isStudent ?
                    <ListItem key={"AI Teaching Assistant"} disablePadding>
                        <ListItemButton component={Link} to={"/aita"}
                            variant="contained" color="secondary">
                            <ListItemIcon><SmartToyIcon /></ListItemIcon>
                            <ListItemText primary={"AI Teaching Assistant"} />
                        </ListItemButton>
                    </ListItem> : <Box></Box>}

                {isAdmin ?
                    <ListItem key={"Make Practical"} disablePadding>
                        <ListItemButton component={Link} to={"/makepractical"}
                            variant="contained" color="secondary">
                            <ListItemIcon><AddchartIcon /></ListItemIcon>
                            <ListItemText primary={"Make Practical"} />
                        </ListItemButton>
                    </ListItem> : <Box></Box>}

                {isAdmin ?
                    <ListItem key={"Analytics"} disablePadding>
                        <ListItemButton component={Link} to={"/analytics"}
                            variant="contained" color="secondary">
                            <ListItemIcon><InsightsIcon /></ListItemIcon>
                            <ListItemText primary={"Analytics"} />
                        </ListItemButton>
                    </ListItem> : <Box></Box>}



            </List>
            <Box sx={{
                pt: 2,
                pl: 3
            }}>
                Account
            </Box>
            {
                <List>
                    <ListItem key={"Account"} disablePadding>
                        <ListItemButton component={Link} to={"/account"}
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

            {/* Floating Action Button for Bug Reporting */}
            <Fab
                color="primary"
                aria-label="report bug"
                sx={{
                    position: 'absolute',  // Change to 'absolute' for testing
                    bottom: 16,
                    right: 16,
                }}

                onClick={() => setOpenModal(true)}
            >
                <BugReportIcon />
            </Fab>

            {/* Bug Reporting Modal */}
            <Modal
                open={openModal}
                onClose={() => setOpenModal(false)}
                aria-labelledby="bug-report-modal"
                aria-describedby="report-bug-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                    minWidth: 400,
                }}>
                    <Typography variant="h5" id="bug-report-modal" sx={{ mb: 2 }}>
                        Report a Bug
                    </Typography>

                    {/* Describe the issue */}
                    <TextField
                        multiline
                        rows={3}
                        label="Describe the issue"
                        variant="outlined"
                        fullWidth
                        value={bugDescription}
                        onChange={(e) => setBugDescription(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    {/* What caused the bug */}
                    <TextField
                        multiline
                        rows={2}
                        label="What were you doing when the bug occurred?"
                        variant="outlined"
                        fullWidth
                        value={bugCause}
                        onChange={(e) => setBugCause(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    {/* Steps to recreate the issue */}
                    <TextField
                        multiline
                        rows={3}
                        label="Steps to recreate the issue"
                        variant="outlined"
                        fullWidth
                        value={bugSteps}
                        onChange={(e) => setBugSteps(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    {/* Bug category */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="bug-category-label">Bug Category</InputLabel>
                        <Select
                            labelId="bug-category-label"
                            value={bugCategory}
                            label="Bug Category"
                            onChange={(e) => setBugCategory(e.target.value)}
                        >
                            <MenuItem value="UI Issue">UI Issue</MenuItem>
                            <MenuItem value="Performance Issue">Performance Issue</MenuItem>
                            <MenuItem value="Crash/Error">Crash/Error</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Submit button */}
                    <Button
                        onClick={handleBugReportSubmit}
                        variant="contained"
                        disabled={submitting}
                        sx={{ mt: 2 }}
                    >
                        {submitting ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                </Box>
            </Modal>

        </Drawer>
    )
}
