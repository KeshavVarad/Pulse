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
import { auth } from "../../config/firebase.js";
import { useAuth } from '../../contexts/AuthContext.js';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BugReportIcon from '@mui/icons-material/BugReport';
import { CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from "axios"
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import BookIcon from '@mui/icons-material/Book';
import InfoIcon from '@mui/icons-material/Info';


const BugReportModal = ({ openModal, setOpenModal }) => {
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
            const response = await axios.post('/api/report-bug', bugReport);

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

    return (
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
    );
};

const FeatureSuggestionModal = ({ openModal, setOpenModal }) => {
    const [featureTitle, setFeatureTitle] = useState('');
    const [featureDescription, setFeatureDescription] = useState('');
    const [additionalComments, setAdditionalComments] = useState('');
    const [category, setCategory] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        'User Interface',
        'Performance',
        'Accessibility',
        'Integrations',
        'Other',
    ];

    const handleFeatureSubmit = async () => {
        setSubmitting(true);

        const featureSuggestion = {
            title: featureTitle,
            description: featureDescription,
            comments: additionalComments,
            category: category, // Include the selected category
        };

        try {
            // Send the feature suggestion data to your backend
            const response = await axios.post(`${process.env.REACT_APP_API_HOST}/api/suggest-feature`, featureSuggestion);

            // Clear the form and close the modal on success
            setFeatureTitle('');
            setFeatureDescription('');
            setAdditionalComments('');
            setCategory('');
            setOpenModal(false);
            alert('Feature suggestion submitted successfully.');
        } catch (error) {
            console.error('Error submitting feature suggestion:', error);
            alert('Failed to submit feature suggestion.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={openModal}
            onClose={() => setOpenModal(false)}
            aria-labelledby="feature-suggestion-modal"
            aria-describedby="suggest-feature-description"
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
                <Typography variant="h5" id="feature-suggestion-modal" sx={{ mb: 2 }}>
                    Suggest a Feature
                </Typography>

                {/* Title of the feature */}
                <TextField
                    label="Feature Title"
                    variant="outlined"
                    fullWidth
                    value={featureTitle}
                    onChange={(e) => setFeatureTitle(e.target.value)}
                    sx={{ mb: 2 }}
                />

                {/* Describe the feature */}
                <TextField
                    multiline
                    rows={3}
                    label="Describe the feature"
                    variant="outlined"
                    fullWidth
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    sx={{ mb: 2 }}
                />

                {/* Category selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="feature-category-label">Category</InputLabel>
                    <Select
                        labelId="feature-category-label"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        label="Category"
                    >
                        {categories.map((cat, index) => (
                            <MenuItem key={index} value={cat}>{cat}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Additional comments */}
                <TextField
                    multiline
                    rows={3}
                    label="Any additional comments?"
                    variant="outlined"
                    fullWidth
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    sx={{ mb: 2 }}
                />

                {/* Submit button */}
                <Button
                    onClick={handleFeatureSubmit}
                    variant="contained"
                    disabled={submitting}
                    sx={{ mt: 2 }}
                >
                    {submitting ? <CircularProgress size={24} /> : 'Submit'}
                </Button>
            </Box>
        </Modal>
    );
};


export default function SideBar() {
    const { currentUser, logout, setError } = useAuth();

    const navigate = useNavigate();
    async function handleLogout() {
        try {
            setError("");
            await logout();
            navigate("/");
        } catch {
            setError("Failed to logout");
        }
    }
    const [isAdmin, setIsAdmin] = useState(false)
    const [isStudent, setIsStudent] = useState(false)

    const [openBugModal, setBugOpenModal] = useState(false);
    const [openFeatureModal, setOpenFeatureModal] = useState(false);


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


                <ListItem key={"Analytics"} disablePadding>
                    <ListItemButton component={Link} to={"/analytics"}
                        variant="contained" color="secondary">
                        <ListItemIcon><InsightsIcon /></ListItemIcon>
                        <ListItemText primary={"Analytics"} />
                    </ListItemButton>
                </ListItem>

                <ListItem key={"User Guides"} disablePadding>
                    <ListItemButton component={Link} to={"/tutorials"}
                        variant="contained" color="secondary">
                        <ListItemIcon><InfoIcon /></ListItemIcon>
                        <ListItemText primary={"User Guides"} />
                    </ListItemButton>
                </ListItem>



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

                onClick={() => setBugOpenModal(true)}
            >
                <BugReportIcon />
            </Fab>

            <Fab
                color="primary"
                aria-label="suggest feature"
                sx={{
                    position: 'absolute',  // Change to 'absolute' for testing
                    bottom: 16,
                    left: 16,
                }}

                onClick={() => setOpenFeatureModal(true)}
            >
                <LightbulbOutlinedIcon />
            </Fab>

            {/* Bug Reporting Modal */}
            <BugReportModal openModal={openBugModal} setOpenModal={setBugOpenModal} />

            <FeatureSuggestionModal openModal={openFeatureModal} setOpenModal={setOpenFeatureModal} />

        </Drawer>
    )
}
