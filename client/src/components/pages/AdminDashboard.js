import React, { useEffect, useState } from 'react'
import {
    Box,
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableContainer,
    Paper,
    TableHead,
    Button,
    Modal,
    TextField
} from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import auth from '../../config/firebase'

export default function AdminDashboard() {

    const [studentInfo, setStudentInfo] = useState([])
    const [instructorInfo, setInstructorInfo] = useState([])
    const [registerOpen, setRegisterOpen] = useState(false)

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");
    const [real_name, setRealName] = useState("");
    const [registerType, setRegisterType] = useState("")

    const { currentUser, register, setError } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleRegisterClose = () => {
        setRegisterOpen(false)
        setRegisterType("")
    }

    const handleAddStudentButton = () => {
        setRegisterOpen(true)
        setRegisterType("student")
    }

    const handleAddInstructorButton = () => {
        setRegisterOpen(true)
        setRegisterType("instructor")
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            setLoading(true);
            await register(email, password, username, real_name, false, registerType, adminPassword, user.email);

            let new_student_info = studentInfo.slice()
            if (registerType == "student") {
                new_student_info.push({ username, real_name, email })
            }
            let new_instructor_info = instructorInfo.slice()
            if (registerType == "instructor") {
                new_instructor_info.push({ username, real_name, email })
            }

            const updateOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ students: new_student_info, instructors: new_instructor_info })
            }
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateAdmin/${user.uid}`, updateOptions);

            setStudentInfo(new_student_info)
            setInstructorInfo(new_instructor_info)

            setRegisterOpen(false)
            setRegisterType("")


        } catch (e) {
            setError("Failed to register");
        }

        setLoading(false);
    }

    useEffect(() => {
        async function fetchUsers() {

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

                const admin_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/admin/${userId}`, requestOptions);
                const admin_data = await admin_res.json()


                setStudentInfo(admin_data.students.slice())

                setInstructorInfo(admin_data.instructors.slice())

            } catch (e) {
                console.log(e);
            }
        }

        fetchUsers()
    }, [])

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
                flexDirection: "column"
            }}>
                <Box sx={{
                    py: 5
                }}>
                    <Typography variant="h4"> Dashboard </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    width: "100%",
                }}>

                    <Container className="students" sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        <Box>
                            <center><h2>Students</h2></center>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={{ minWidth: 10 }}>Student Name</TableCell>
                                        <TableCell align="right">Email</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {studentInfo.map((student, idx) =>
                                    (<TableRow
                                        key={idx}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {student.real_name}
                                        </TableCell>
                                        <TableCell align="right">{student.email}</TableCell>
                                    </TableRow>)
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{
                            pt: 5
                        }}>
                            <Button variant="contained" onClick={handleAddStudentButton}>
                                Add Student
                            </Button>
                        </Box>

                    </Container>

                    <Container className="instructors" sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        <Box>
                            <center><h2>Instructors</h2></center>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={{ minWidth: 10 }}>Instructor Name</TableCell>
                                        <TableCell align="right">Email</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {instructorInfo.map((instructor, idx) =>
                                    (<TableRow
                                        key={idx}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">

                                            {instructor.real_name}


                                        </TableCell>
                                        <TableCell align="right">{instructor.email}</TableCell>
                                    </TableRow>)
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{
                            pt: 5
                        }}>
                            <Button variant="contained" onClick={handleAddInstructorButton}>
                                Add Instructor
                            </Button>
                        </Box>
                    </Container>

                </Box>
            </Box>

            <Modal
                open={registerOpen}
                onClose={handleRegisterClose}
            >
                <Box sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 800,
                    bgcolor: "background.paper",
                    border: "2px solid #000",
                    boxShadow: 24,
                    p: 4,
                }}>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Register {registerType}
                        </Typography>

                        <form onSubmit={handleFormSubmit}>
                            <TextField label="Username"
                                onChange={e => setUsername(e.target.value)}
                                required
                                variant="outlined"
                                color="secondary"
                                sx={{ mb: 3 }}
                                fullWidth
                                value={username} />
                            <TextField label="Full Name"
                                onChange={e => setRealName(e.target.value)}
                                required
                                variant="outlined"
                                color="secondary"
                                sx={{ mb: 3 }}
                                fullWidth
                                value={real_name} />
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

                            <TextField label="Admin Password"
                                onChange={e => setAdminPassword(e.target.value)}
                                required
                                variant="outlined"
                                color="secondary"
                                type="password"
                                sx={{ mb: 3 }}
                                fullWidth
                                value={adminPassword} />

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <Button variant='contained' type='submit' disabled={loading} sx={{ mx: 1 }}>
                                    Register
                                </Button>
                            </Box>


                        </form>
                    </Box>
                </Box>
            </Modal>
        </Box>
    )
}
