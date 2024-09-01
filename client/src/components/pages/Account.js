import { Box, Container, Paper, Table, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import auth from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function Account() {

    const { currentUser } = useAuth()


    const [realName, setRealName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [schoolName, setSchoolName] = useState("");

    const [editableSetting, setEditableSetting] = useState("");
    const [setting, setSetting] = useState("");

    const handleEditButton = (setting) => {
        setEditableSetting(setting)

        if (setting === "real_name") {
            setSetting(realName)
        }

        if (setting === "username") {
            setSetting(username)
        }

        if (setting === "email") {
            setSetting(email)
        }
    }

    const handleChangeSetting = async () => {

        let updateData = {}
        if (editableSetting === "real_name") {
            updateData.real_name = setting
        }

        if (editableSetting === "email") {
            updateData.email = setting
        }

        if (editableSetting === "username") {
            updateData.username = setting
        }

        try {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());
            const userId = currentUser.uid

            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData)

            }

            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${userId}`, requestOptions);

            if (editableSetting === "real_name") {
                setRealName(setting)
            }

            if (editableSetting === "email") {
                setEmail(setting)
            }

            if (editableSetting === "username") {
                setUsername(setting)
            }

        } catch (e) {
            console.log(e);
        }
    }

    // handle what happens on key press
    const handleKeyPress = useCallback((event) => {
        if (event.key == "Enter" & editableSetting != "") {
            handleChangeSetting()
            setEditableSetting("")
            setSetting("")
        }


        if (event.key == "Escape" & editableSetting != "") {
            setEditableSetting("")
            setSetting("")
        }
    }, [setting, editableSetting]);

    useEffect(() => {
        // attach the event listener
        document.addEventListener('keydown', handleKeyPress);

        // remove the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress]);




    useEffect(() => {
        async function fetchUserData() {
            try {
                const auth_user = auth.currentUser;
                const token = auth_user && (await auth_user.getIdToken());

                const userId = currentUser.uid

                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }

                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
                const userData = await user_res.json()

                setRealName(userData.real_name)
                setEmail(userData.email)
                setSchoolName(userData.school_name)
                setUsername(userData.username)




            } catch (e) {
                console.log(e);
            }

        }

        if (currentUser) {
            fetchUserData()
        }


    }, [currentUser])



    return (
        <Box sx={{
            minHeight: "100%",
            minWidth: "100%",

        }}>
            <Box sx={{
                minHeight: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 8,
                flexDirection: "column",
            }}>
                <Box sx={{
                    py: 5
                }}>
                    <Typography variant="h2"> Profile </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    width: "100%",
                }}>
                    <Container>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableRow>
                                    <TableCell component="th" style={{
                                        minWidth: 10, fontWeight: 'bold', fontSize: 18
                                    }}>Name</TableCell>

                                    {
                                        (editableSetting !== "real_name") ?
                                            (<TableCell align="right" onClick={() => handleEditButton("real_name")}>{realName}</TableCell>) :
                                            (<TableCell align="right">
                                                <TextField
                                                    label="Real Name"
                                                    onChange={(e) => setSetting(e.target.value)}
                                                    variant="outlined"
                                                    color="secondary"
                                                    size="small"
                                                    sx={{

                                                        width: "60%"
                                                    }}

                                                    value={setting}
                                                >

                                                </TextField>
                                            </TableCell>)
                                    }



                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" style={{ minWidth: 10, fontWeight: 'bold', fontSize: 18 }}>Username</TableCell>

                                    {
                                        (editableSetting !== "username") ?
                                            (<TableCell align="right" onClick={() => handleEditButton("username")}>{username}</TableCell>) :
                                            (<TableCell align="right">
                                                <TextField
                                                    label="Username"
                                                    onChange={(e) => setSetting(e.target.value)}
                                                    variant="outlined"
                                                    color="secondary"
                                                    size="small"
                                                    sx={{

                                                        width: "60%"
                                                    }}

                                                    value={setting}
                                                >

                                                </TextField>
                                            </TableCell>)
                                    }
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" style={{ minWidth: 10, fontWeight: 'bold', fontSize: 18 }}>Email</TableCell>
                                    {
                                        (editableSetting !== "email") ?
                                            (<TableCell align="right" onClick={() => handleEditButton("email")}>{email}</TableCell>) :
                                            (<TableCell align="right">
                                                <TextField
                                                    label="Email"
                                                    onChange={(e) => setSetting(e.target.value)}
                                                    variant="outlined"
                                                    color="secondary"
                                                    size="small"
                                                    sx={{

                                                        width: "60%"
                                                    }}

                                                    value={setting}
                                                >

                                                </TextField>
                                            </TableCell>)
                                    }

                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" style={{ minWidth: 10, fontWeight: 'bold', fontSize: 18 }}>School</TableCell>
                                    <TableCell align="right">{schoolName}</TableCell>

                                </TableRow>
                            </Table>
                        </TableContainer>
                    </Container>

                </Box>

            </Box>
        </Box>
    )
}
