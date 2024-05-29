import React from 'react'
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material"
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
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
        <div>
            <AppBar position='static'>
                <Toolbar>
                    <Box sx={{
                        width: "100%",
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        p: 1,
                        m: 1
                    }}>

                        <Typography variant='h5'>
                            Pulse
                        </Typography>


                        {
                            !currentUser ? (
                                <Box sx={{
                                    width: "15%",
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                }}>
                                    <Button component={Link} to="/login" variant="contained" color="secondary">
                                        Login
                                    </Button>

                                    <Button component={Link} to="/register" variant="contained" color="secondary">
                                        Sign Up
                                    </Button>
                                </Box>



                            ) : (<Box sx={{
                                width: "15%",
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}>
                                <Button onClick={handleLogout} variant="contained" color="secondary">
                                    Logout
                                </Button>
                            </Box>)
                        }



                    </Box>
                </Toolbar>
            </AppBar>
        </div>
    )
}
