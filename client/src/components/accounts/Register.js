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
    const [username, setUsername] = useState("");
    const [real_name, setRealName] = useState("");
    const [school_name, setSchoolName] = useState("");

    const navigate = useNavigate();
    const { currentUser, register, setError } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            navigate("/dashboard");
        }
    }, [currentUser, navigate]);

    async function handleFormSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            setLoading(true);

            await register(email, password, username, real_name, "admin", school_name, null, null);
            navigate("/dashboard");
        } catch (e) {
            setError("Failed to register");
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
                    my: 2,
                    justifyItems: "center",


                }}>
                    <Typography variant='h3'>
                        Register School
                    </Typography>
                </Box>

                <form onSubmit={handleFormSubmit}>
                    <TextField label="School Name"
                        onChange={e => setSchoolName(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 2 }}
                        fullWidth
                        value={school_name} />
                    <TextField label="Admin Username"
                        onChange={e => setUsername(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 2 }}
                        fullWidth
                        value={username} />
                    <TextField label="Admin Full Name"
                        onChange={e => setRealName(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 2 }}
                        fullWidth
                        value={real_name} />
                    <TextField label="Admin Email"
                        onChange={e => setEmail(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        type="email"
                        sx={{ mb: 2 }}
                        fullWidth
                        value={email} />

                    <TextField label="Admin Password"
                        onChange={e => setPassword(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        type="password"
                        sx={{ mb: 2 }}
                        fullWidth
                        value={password} />

                    <TextField label="Confirm Password"
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        type="password"
                        sx={{ mb: 2 }}
                        fullWidth
                        value={confirmPassword}
                        error={password !== confirmPassword} />

                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <Button variant='contained' type='submit' disabled={loading} sx={{ mx: 1 }}>
                            Register
                        </Button>

                        <Button component={Link} to="/login" sx={{ mx: 1 }}>
                            Already have an account? Login
                        </Button>
                    </Box>


                </form>
            </Box>

        </Box>
    )
}
