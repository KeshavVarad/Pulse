import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from "react";


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
            navigate("/profile");
        } catch (e) {
            setError("Failed to register");
        }

        setLoading(false);
    }

    return (
        <Box sx={{
            minHeight: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 12,
            px: 4,

        }}>

            <Box sx={{
                maxWidth: "md",
                my: 8
            }}>
                <Box>
                    <Typography variant='h3'>
                        Login to your account
                    </Typography>
                </Box>

                <form onSubmit={handleFormSubmit}>
                    <TextField label="Email"
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
                    }}>
                        <Button variant='contained' type='submit' disabled={loading}>
                            Login
                        </Button>

                        <Button component={Link} to="/register">
                            Don't have an account? Register
                        </Button>
                    </Box>

                </form>
            </Box>

        </Box>
    )
}
