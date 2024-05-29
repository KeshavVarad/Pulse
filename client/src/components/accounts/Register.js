import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from "react";

export default function Register() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();
    const { currentUser, register, setError } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    async function handleFormSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            setLoading(true);
            await register(email, password);
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
                        Register Your Account
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

                    <TextField label="Confirm Password"
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        type="password"
                        sx={{ mb: 3 }}
                        fullWidth
                        value={confirmPassword}
                        error={password !== confirmPassword} />

                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                    }}>
                        <Button variant='contained' type='submit' disabled={loading}>
                            Register
                        </Button>

                        <Button component={Link} to="/login">
                            Already have an account? Login
                        </Button>
                    </Box>


                </form>
            </Box>

        </Box>
    )
}
