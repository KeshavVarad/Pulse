import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, ButtonGroup } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from "react";

export default function RegisterUser() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");
    const [real_name, setRealName] = useState("");
    const [gradYear, setGradYear] = useState(null);

    const navigate = useNavigate();
    const { currentUser, register, setError } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isInstructor, setIsInstructor] = useState(true)
    const [role, setRole] = useState("student");
    const handleButtonClick = (e) => {
        setRole(e);
    };

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

            const invite_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/invite/email/${email}`); // TODO: Have to figure out how to make this an unprotected route.

            let invite_data = null

            if (invite_res.status == 200) {
                const invite_data_array = await invite_res.json()
                invite_data = invite_data_array[0]
            }
            else {
                return setError("Invalid invite.")
            }

            if (invite_data.status != "invited") {
                return setError("Invalid invite.")
            }

            const inviteExpireDate = Date(invite_data.expires_on)
            const currentDate = Date.now()

            if (currentDate > inviteExpireDate) {
                return setError("Your invite expired.")
            }
            if (invite_data.role == "student") {
                if (role !== "student") {
                    return setError("Your email was invited as a Student, please sign up as a Student or contact your Administrator")
                }
            }

            if (invite_data.role == "instructor") {
                if (role !== "instructor") {
                    return setError("Your email was invited as an Instructor, please sign up as an Instructor or contact your Administrator")
                }
            }

            if (invite_data.role == "admin") {
                if (role !== "admin") {
                    return setError("Your email was invited as an Admin, please sign up as an Admin or contact your Administrator")
                }
            }

            await register(email, password, username, real_name, invite_data.role, invite_data.school_name, invite_data.school_id, invite_data.id, gradYear);
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
                mt: 4,
                width: '32%',

            }}>
                <Box sx={{
                    my: 2,
                    justifyItems: "center",
                    alignItems: "center",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%"
                }}>
                    <Typography variant='h2'>
                        Register Account
                    </Typography>
                    <Box sx={{ my: 1 }}>
                        <Typography varient='h4'>
                            Sign up as an...
                        </Typography>
                    </Box>


                    <Box sx={{
                        justifyItems: "center",
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "column",
                        minWidth: "100%"
                    }}>

                        <ButtonGroup
                            minWidth="100%"
                            disableElevation
                            disableRipple
                        >
                            <Button onClick={() => handleButtonClick("instructor")} variant={
                                (role === "instructor") ? "contained" : "outlined"
                            } sx={{ width: "150px" }}>Instructor</Button>



                            <Button onClick={() => handleButtonClick("student")} variant={
                                (role === "student") ? "contained" : "outlined"
                            } sx={{ width: "150px" }}>Student</Button>

                            <Button onClick={() => handleButtonClick("admin")} variant={
                                (role === "admin") ? "contained" : "outlined"
                            } sx={{ width: "150px" }}>Admin</Button>


                        </ButtonGroup>


                    </Box>


                </Box>


                <form onSubmit={handleFormSubmit}>
                    <TextField label="Username"
                        onChange={e => setUsername(e.target.value)}
                        required
                        variant="standard"
                        color="secondary"
                        sx={{ mb: 1.2 }}
                        fullWidth
                        value={username}
                    />
                    <TextField label="Full Name"
                        onChange={e => setRealName(e.target.value)}
                        required
                        variant="standard"
                        color="secondary"
                        sx={{ mb: 1.2 }}
                        fullWidth
                        value={real_name} />
                    {(role === "student") ? (<TextField label="Graduation Year"
                        onChange={e => setGradYear(e.target.value)}
                        required
                        variant="standard"
                        color="secondary"
                        sx={{ mb: 1.2 }}
                        fullWidth
                        value={gradYear} />) : (<Box></Box>)}

                    <TextField label="School Email"
                        onChange={e => setEmail(e.target.value)}
                        required
                        variant="standard"
                        color="secondary"
                        type="email"
                        sx={{ mb: 1.2 }}
                        fullWidth
                        value={email} />

                    <TextField label="Password"
                        onChange={e => setPassword(e.target.value)}
                        required
                        variant="standard"
                        color="secondary"
                        type="password"
                        sx={{ mb: 1.2 }}
                        fullWidth
                        value={password} />

                    <TextField label="Confirm Password"
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        variant="standard"
                        color="secondary"
                        type="password"
                        sx={{ mb: 1.2 }}
                        fullWidth
                        value={confirmPassword}
                        error={password !== confirmPassword} />

                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        my: 2
                    }}>
                        <Button variant='contained' type='submit' disabled={loading} sx={{ mx: 1 }}>
                            Register
                        </Button>

                        <Button component={Link} to="/login" sx={{ mx: 1, textTransform: 'none' }}>
                            Already have an Account? Login
                        </Button>
                    </Box>


                </form>
            </Box>

        </Box>
    )
}
