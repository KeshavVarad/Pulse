import React from 'react'
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material"
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext';
import theme from "../../theme";
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

export default function Header() {
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

    return (
        <div>
            <AppBar position='static'>
                <Toolbar>
                    {
                        !currentUser ? (
                            <MonitorHeartIcon fontSize='large' />
                        ) : (<Box></Box>)
                    }
                    {
                        !currentUser ? (
                            <h1> Pulse</h1>
                        ) : (<Box></Box>)
                    }

                    <Box sx={{
                        width: "100%",
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'right',
                        alignContent: 'right',
                        alignItems: 'right',
                        p: 1,
                        m: 1
                    }}>
                        {
                            !currentUser ? (
                                <Box sx={{
                                    width: "13%",
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',

                                }}>
                                    {<Button component={Link} to="/login" variant="contained" color="primary">
                                        Login
                                    </Button>}

                                    <Button component={Link} to="/register" variant="contained">
                                        Sign Up
                                    </Button>
                                </Box>) : (<Box>
                                    <Button onClick={handleLogout} variant="contained" color="primary">
                                        Logout
                                    </Button>
                                </Box>)}

                    </Box>
                </Toolbar>
            </AppBar>
        </div>
    )
}
