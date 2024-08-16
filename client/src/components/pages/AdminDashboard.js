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
import { v4 as uuidv4 } from "uuid"
import CloseIcon from '@mui/icons-material/Close';

export default function AdminDashboard() {

    const [schoolId, setSchoolId] = useState(null)
    const [schoolName, setSchoolName] = useState(null)

    const [studentInfo, setStudentInfo] = useState([])
    const [instructorInfo, setInstructorInfo] = useState([])
    const [adminInfo, setAdminInfo] = useState([])

    const [invitedStudentInfo, setInvitedStudentInfo] = useState([])
    const [invitedInstructorInfo, setInvitedInstructorInfo] = useState([])
    const [invitedAdminInfo, setInvitedAdminInfo] = useState([])
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

    const handleRemoveInviteButton = async (role, idx) => {
        let invite_id = null

        if (role === "student") {
            invite_id = invitedStudentInfo[idx].id
            let new_info = invitedStudentInfo.slice()

            new_info.splice(idx, 1)

            setInvitedStudentInfo(new_info)
        }

        if (role === "instructor") {
            invite_id = invitedInstructorInfo[idx].id

            let new_info = invitedInstructorInfo.slice()

            new_info.splice(idx, 1)

            setInvitedInstructorInfo(new_info)
        }

        if (role === "admin") {
            invite_id = invitedAdminInfo[idx].id

            let new_info = invitedAdminInfo.slice()

            new_info.splice(idx, 1)

            setInvitedAdminInfo(new_info)
        }

        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const deleteOptions = {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            };

            await fetch(`${process.env.REACT_APP_API_HOST}/api/deleteInvite/${invite_id}`, deleteOptions);

        } catch (e) {
            console.log(e)
        }
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

            const currentDate = new Date();

            // Add 7 days (a week) to the current date
            const nextWeek = new Date();
            nextWeek.setDate(currentDate.getDate() + 7);


            const newInvite = {
                id: uuidv4(),
                school_name: schoolName,
                school_id: schoolId,
                invite_email: email,
                role: registerType,
                status: "invited",
                expires_on: nextWeek
            }

            const createInviteOptions = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newInvite)
            }

            await fetch(`${process.env.REACT_APP_API_HOST}/api/newInvite`, createInviteOptions);

            if (registerType === "student") {
                let new_student_invites = invitedStudentInfo.slice()

                new_student_invites.push(newInvite)

                setInvitedStudentInfo(new_student_invites)
            }

            if (registerType === "instructor") {
                let new_instructor_invites = invitedInstructorInfo.slice()

                new_instructor_invites.push(newInvite)

                setInvitedInstructorInfo(new_instructor_invites)
            }

            if (registerType === "admin") {
                let new_admin_invites = invitedAdminInfo.slice()

                new_admin_invites.push(newInvite)

                setInvitedAdminInfo(new_admin_invites)
            }

            setEmail("")
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

                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
                const user_data = await user_res.json()

                const school_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/school/${user_data.school_id}`, requestOptions);
                const school_data = await school_res.json()

                const invite_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/invite/school/${school_data.school_name}`, requestOptions);

                let invite_data = []

                if (invite_res.status == 200) {
                    invite_data = await invite_res.json()
                }


                let student_invites = []
                let instructor_invites = []
                let admin_invites = []

                invite_data.map((invite) => {
                    if (invite.status === "accepted") {
                        return;
                    }

                    if (invite.role === "student") {
                        student_invites.push(invite)
                    }
                    else if (invite.role === "instructor") {
                        instructor_invites.push(invite)
                    }
                    else {
                        admin_invites.push(invite)
                    }
                })

                console.log(school_data.admins)


                setSchoolId(user_data.school_id)
                setSchoolName(user_data.school_name)

                setStudentInfo(school_data.students.slice())
                setInstructorInfo(school_data.instructors.slice())
                setAdminInfo(school_data.admins.slice())

                setInvitedStudentInfo(student_invites)
                setInvitedInstructorInfo(instructor_invites)
                setInvitedAdminInfo(admin_invites)


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
                                        <TableCell align="right">Cancel Invite</TableCell>
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

                                    {invitedStudentInfo.map((invite, idx) =>
                                    (<TableRow
                                        key={idx}
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0, color: "#555555" },
                                        }}
                                    >
                                        <TableCell component="th" scope="row">
                                            INVITE PENDING
                                        </TableCell>
                                        <TableCell align="right">{invite.invite_email}</TableCell>
                                        <TableCell align="right">
                                            <Button onClick={() => handleRemoveInviteButton("student", idx)}>
                                                <CloseIcon />
                                            </Button>
                                        </TableCell>
                                    </TableRow>)
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{
                            pt: 5
                        }}>
                            <Button variant="contained" onClick={handleAddStudentButton}>
                                Invite Student
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
                                        <TableCell>Cancel Invite</TableCell>
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
                                    {invitedInstructorInfo.map((invite, idx) =>
                                    (<TableRow
                                        key={idx}
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0, color: "#555555" },
                                        }}
                                    >
                                        <TableCell component="th" scope="row">
                                            INVITE PENDING
                                        </TableCell>
                                        <TableCell align="right">{invite.invite_email}</TableCell>
                                        <TableCell align="right">
                                            <Button onClick={() => handleRemoveInviteButton("instructor", idx)}>
                                                <CloseIcon />
                                            </Button>
                                        </TableCell>
                                    </TableRow>)
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{
                            pt: 5
                        }}>
                            <Button variant="contained" onClick={handleAddInstructorButton}>
                                Invite Instructor
                            </Button>
                        </Box>
                    </Container>


                    <Container className="admins" sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        <Box>
                            <center><h2>Admins</h2></center>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={{ minWidth: 10 }}>Admin Name</TableCell>
                                        <TableCell align="right">Email</TableCell>
                                        <TableCell>Cancel Invite</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {adminInfo.map((admin, idx) =>
                                    (<TableRow
                                        key={idx}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {admin.real_name}
                                        </TableCell>
                                        <TableCell align="right">{admin.email}</TableCell>
                                    </TableRow>)
                                    )}

                                    {invitedAdminInfo.map((invite, idx) =>
                                    (<TableRow
                                        key={idx}
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0, color: "#555555" },
                                        }}
                                    >
                                        <TableCell component="th" scope="row">
                                            INVITE PENDING
                                        </TableCell>
                                        <TableCell align="right">{invite.invite_email}</TableCell>
                                        <TableCell align="right">
                                            <Button onClick={() => handleRemoveInviteButton("student", idx)}>
                                                <CloseIcon />
                                            </Button>
                                        </TableCell>
                                    </TableRow>)
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{
                            pt: 5
                        }}>
                            <Button variant="contained" onClick={handleAddStudentButton}>
                                Invite Admin
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
                            Invite {registerType}
                        </Typography>

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

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <Button variant='contained' type='submit' disabled={loading} sx={{ mx: 1 }}>
                                    Invite
                                </Button>
                            </Box>


                        </form>
                    </Box>
                </Box>
            </Modal>
        </Box>
    )
}
