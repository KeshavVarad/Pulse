import {
    Box, Container, Paper, Table, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
} from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import auth from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DeleteIcon from "@mui/icons-material/Delete";

const ShortcutManager = () => {
    const [shortcut, setShortcut] = useState("");
    const [phrase, setPhrase] = useState("");
    const [shortcuts, setShortcuts] = useState({});
    const { currentUser } = useAuth()



    const addShortcut = async () => {
        if (shortcut && phrase) {
            const newShortcuts = { ...shortcuts, [shortcut]: phrase };

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
                    body: JSON.stringify({ shortcuts: newShortcuts })

                }
                await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${userId}`, requestOptions);


            } catch (e) {
                console.log(e);
            }
            setShortcuts(newShortcuts);
            setShortcut("");
            setPhrase("");
        }
    };

    const deleteShortcut = async (key) => {
        const newShortcuts = { ...shortcuts };
        delete newShortcuts[key];
        setShortcuts(newShortcuts);

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
                body: JSON.stringify({ shortcuts: newShortcuts })

            }
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${userId}`, requestOptions);


        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        async function fetchShortcuts() {
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
                if (userData.shortcuts) {
                    setShortcuts(userData.shortcuts)
                }


            } catch (e) {
                console.log(e);
            }
        }

        fetchShortcuts()

    }, [currentUser])

    return (
        <Box p={3} sx={{ maxWidth: "600px", margin: "auto" }}>
            <Typography variant="h5" gutterBottom>
                Manage Comment Shortcuts
            </Typography>

            <Box display="flex" gap={2} alignItems="center" mb={2}>
                <TextField
                    label="Shortcut"
                    variant="outlined"
                    value={shortcut}
                    onChange={(e) => setShortcut(e.target.value)}
                    fullWidth
                />
                <TextField
                    label="Phrase"
                    variant="outlined"
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    fullWidth
                />
                <Button variant="contained" color="primary" onClick={addShortcut}>
                    Add
                </Button>
            </Box>

            <Paper elevation={3} sx={{ maxHeight: "300px", overflow: "auto" }}>
                <List>
                    {(Object.keys(shortcuts).length > 0) ?
                        (
                            <>
                                {Object.keys(shortcuts).map((key) => (
                                    <React.Fragment key={key}>
                                        <ListItem>
                                            <ListItemText
                                                primary={key}
                                                secondary={shortcuts[key]}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete"
                                                    onClick={() => deleteShortcut(key)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </>
                        ) :
                        <ListItem>
                            <ListItemText>
                                No Shortcuts
                            </ListItemText>
                        </ListItem>}

                </List>
            </Paper>
        </Box>
    );
};

export default function Account() {

    const { currentUser } = useAuth()


    const [realName, setRealName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [role, setRole] = useState("");

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
                setRole(userData.role)



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
                    <Typography variant="h3"> Profile </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    width: "60%",
                }}>
                    <Container>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableRow>
                                    <TableCell component="th"><Typography variant='h5' fontWeight='bold' >Name</Typography></TableCell>

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

                                                        width: "50%",

                                                    }}

                                                    value={setting}
                                                >

                                                </TextField>
                                            </TableCell>)
                                    }



                                </TableRow>
                                <TableRow>
                                    <TableCell component="th"><Typography variant='h5' fontWeight='bold'>Username</Typography></TableCell>

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

                                                        width: "50%"
                                                    }}

                                                    value={setting}
                                                >

                                                </TextField>
                                            </TableCell>)
                                    }
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th"><Typography variant='h5' fontWeight='bold'>Email</Typography></TableCell>
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

                                                        width: "50%"
                                                    }}

                                                    value={setting}
                                                >

                                                </TextField>
                                            </TableCell>)
                                    }

                                </TableRow>
                                <TableRow>
                                    <TableCell component="th"><Typography variant='h5' fontWeight='bold'>School</Typography></TableCell>
                                    <TableCell align="right">{schoolName}</TableCell>

                                </TableRow>
                                <TableRow>
                                    <TableCell component="th"><Typography variant='h5' fontWeight='bold'>Role</Typography></TableCell>
                                    <TableCell align="right">{role}</TableCell>

                                </TableRow>
                            </Table>
                        </TableContainer>
                    </Container>

                </Box>

                {
                    (role === "instructor") ?
                        (
                            <div>
                                <Box sx={{
                                    py: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    flexDirection: "column",
                                }}>
                                    <Typography variant="h3"> Shortcuts </Typography>
                                </Box>

                                <ShortcutManager />
                            </div>
                        ) :
                        null
                }


            </Box>
        </Box>
    )
}
