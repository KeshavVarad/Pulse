import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from "react";
import theme from "../../theme";


export default function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();
    const { currentUser, login, setError } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);


    async function handleFormSubmit(e) {
        e.preventDefault();

        try {
            setLoading(true);
            await login(email, password);
            navigate("/dashboard");
        } catch (e) {
            setError("Failed to login");
        }

        setLoading(false);
    }

    return (
        <Box sx={{
            minHeight: "100%",
            minWidth: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pt: 10,
        }}>

            <Box sx={{

                justifyContent: "center",
                alignItems: "center",
                mt: 5,
                width: '32%',
            }}>
                <Box sx={{
                    mt: 2,
                    mb:4
                }}>
                    <center><Typography variant='h2'>
                        Login to your Account
                    </Typography></center>
                </Box>

                <form onSubmit={handleFormSubmit}>
                    <TextField label="School Email"
                        onChange={e => setEmail(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        type="email"
                        sx={{ mb: 3 }}
                        fullWidth
                        value={email} />

                    <TextField label="Password"
                        onChange={e => setPassword(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        type="password"
                        sx={{ mb: 3 }}
                        fullWidth
                        value={password} />

                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <Button variant='contained' type='submit' disabled={loading} sx={{ mx: 1 }}>
                            Login
                        </Button>

                        <Button component={Link} to="/register_school" sx={{ mx: 1, textTransform:'none'}}>
                            Don't have an account? Register
                        </Button>
                    </Box>

                </form>
            </Box>

        </Box>
    )
}
