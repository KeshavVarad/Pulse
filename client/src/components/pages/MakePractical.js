import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Input, LinearProgress, Snackbar } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from "react";
import { auth } from "../../config/firebase.js";
import { v4 as uuidv4 } from 'uuid';
import DeleteIcon from '@mui/icons-material/Delete';
import Joyride from 'react-joyride';
import axios from "axios";

const UploadVideo = ({ setVideoLink, practicalId, schoolId, setVideoUploaded }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setError(null); // Reset error on new file selection
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a video file.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Get the signed upload URL from your backend

            const getUploadUrlResponse = await axios.post(`${process.env.REACT_APP_API_HOST}/api/getUploadUrl`, {
                fileName: file.name, // Name of the video file
                contentType: file.type, // MIME type of the video,
                practicalId: practicalId,
                schoolId: schoolId
            });

            const { url } = getUploadUrlResponse.data; // The signed URL

            // Step 2: Upload the file to Google Cloud Storage using the signed URL
            const uploadResponse = await axios.put(url, file, {
                headers: {
                    'Content-Type': file.type, // Ensure the content type is set correctly
                }
            });

            if (uploadResponse.status === 200) {

                // Step 3: You may want to derive the public URL of the uploaded file (depending on your setup)
                // Assuming the bucket is publicly accessible, the public URL would typically be:

                const videoUrl = `https://storage.googleapis.com/pulse-4d3a4.appspot.com/${schoolId}/${practicalId}/${file.name}`;

                setVideoLink(videoUrl); // Store the public URL or pass it to the parent component
            } else {
                throw new Error('Failed to upload video.');
            }

        } catch (err) {
            console.error('Upload error:', err.response ? err.response.data : err.message);
            setError('Error during video upload: ' + (err.response ? err.response.data.error : err.message));
        } finally {
            setLoading(false);
            setVideoUploaded(true);
        }
    };



    return (
        <Box sx={{ my: 1, display: "flex", flexDirection: "column", justifyItems: "center", alignItems: "center" }}>
            <Box sx={{ mb: 2 }}><Typography variant="h6">Upload Video</Typography>
            </Box>
            <Box sx={{ width: "70%" }}>
                <input
                    type="file"
                    accept="video/mp4, video/mov, video/quicktime, video/x-msvideo, video/webm, video/x-matroska, video/x-flv, video/x-ms-wmv, video/3gpp"
                    onChange={handleFileChange}
                />
            </Box>


            <Button
                variant="contained"
                size="small"
                onClick={handleUpload}
                disabled={loading}
                sx={{ mt: 2, width: "50%" }}
            >
                {loading ? 'Uploading...' : 'Upload'}
            </Button>
            {error && <Box sx={{ mt: 2 }}><Typography variant="h7" color="error">{error}</Typography></Box>}
        </Box>
    );
};



export default function MakePractical() {

    const [practicalName, setPracticalName] = useState("");
    const [videoLink, setVideoLink] = useState("");

    const [participants, setParticipants] = useState([]);
    const [participantIds, setParticipantIds] = useState([]);
    const [curParticipant, setCurParticipant] = useState("");
    const [instructor, setInstructor] = useState("");
    const [isInstructor, setIsInstructor] = useState(true);
    const navigate = useNavigate();
    const { currentUser, setError } = useAuth();
    const [loading, setLoading] = useState(false);
    const [videoUploaded, setVideoUploaded] = useState(false);

    const [makePracticalTutorial, setMakePracticalTutorial] = useState(true);
    const [isMakePracticalMounted, setMakePracticalMounted] = useState(false);
    const [schoolStudents, setSchoolStudents] = useState([]);
    const [schoolInstructors, setSchoolInstructors] = useState([]);

    const [practicalId, setPracticalId] = useState();
    const [schoolId, setSchoolId] = useState();


    useEffect(() => {
        if (!practicalId) {
            setPracticalId(uuidv4())
        }
    }, [practicalId])


    const handleAddParticipant = async () => {

        if (schoolStudents.findIndex((student) => student.email == curParticipant) == -1) {
            return setError("Participant not in school.")
        }


        try {
            const participant_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/email/${curParticipant}`);
            const participants = await participant_res.json()
            const participant = participants[0]



            let curParticipantIds = participantIds.slice()
            curParticipantIds.push(participant.id)

            setParticipantIds(curParticipantIds)

        } catch (e) {
            return setError("Invalid participant entered.")
        }

        let curParticipants = participants.slice()

        curParticipants.push(curParticipant)

        setCurParticipant("")
        setParticipants(curParticipants)


    }

    async function handleFormSubmit(e) {
        e.preventDefault();


        if (schoolInstructors.findIndex((school_instructor) => school_instructor.email == instructor) == -1) {
            return setError("Instructor not in school.")
        }

        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const creation_date = Date.now()
            const user_creator = user.uid
            let user_participants = []

            let participant_year = null

            participants.map(async (participantEmail) => {
                const participant_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/email/${participantEmail}`);
                const participants_matching_email = await participant_res.json()
                const participant = participants_matching_email[0]

                participant_year = participant.grad_year
                user_participants.push(participant.id)


                let participantPracticals = participant.inPracticals

                participantPracticals.push(practicalId)

                const updateParticipantOptions = {
                    method: "PUT",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ inPracticals: participantPracticals })
                };

                await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${participant.id}`, updateParticipantOptions);
            })

            const instructor_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/email/${instructor}`);
            const instructorData = await instructor_res.json()

            let user_instructor_id = instructorData[0].id
            let user_instructor_name = instructorData[0].real_name

            let instructorPracticals = instructorData[0].teachPracticals

            instructorPracticals.push(practicalId)

            const updateInstructorOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ teachPracticals: instructorPracticals })
            };

            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${user_instructor_id}`, updateInstructorOptions);
            let newPracticalData = {
                id: practicalId,
                practical_name: practicalName,
                creation_date: creation_date,
                video_link: videoLink,
                user_creator: user_creator,
                user_participants: user_participants,
                user_instructor_id: user_instructor_id,
                user_instructor_name: user_instructor_name,
                tasks: [],
                comments: [],
                chats: [],
                red_count: 0,
                yellow_count: 0,
                green_count: 0,
                avg_rating: 0,
                school_id: instructorData[0].school_id,
                cohort_year: participant_year,
                transcript_link: "No Transcript"
            }

            const createNewPracticalOptions = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newPracticalData)

            };

            await fetch(`${process.env.REACT_APP_API_HOST}/api/newPractical`, createNewPracticalOptions);

            navigate("/dashboard");


            setLoading(false);
        } catch (e) {
            console.log(e);
        }
    }

    const handleRemoveParticipant = (idx) => {
        let cur_participant_emails = participants.slice()
        cur_participant_emails.splice(idx, 1)

        let cur_participant_ids = participantIds.slice()
        cur_participant_ids.splice(idx, 1)

        setParticipants(cur_participant_emails)
        setParticipantIds(cur_participant_ids)
    }

    const handleMakePracticalJoyrideCallback = async (data) => {
        const { action, index, origin, status, type } = data;

        if (["finished", "skipped"].includes(status)) {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            if (currentUser) {
                const userId = currentUser.uid

                const requestOptions = {
                    method: "PUT",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ make_practical_tutorial: true })
                }

                await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${userId}`, requestOptions);
                setMakePracticalTutorial(true)
            }

        }
    }


    useEffect(() => {
        async function fetchUser() {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            if (currentUser) {
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

                if (user_res.status == 404) {
                    setMakePracticalTutorial(true)
                }
                else {
                    const userData = await user_res.json()

                    setMakePracticalTutorial(userData.make_practical_tutorial)
                    setSchoolId(userData.school_id)

                    if (userData.role === "instructor") {
                        setInstructor(userData.email);
                        setIsInstructor(true);
                    }
                    else {
                        setIsInstructor(false);
                    }
                }



            }

        }

        if (currentUser) {
            fetchUser()
        }
    }, [currentUser])

    useEffect(() => {
        const make_practical_element = document.querySelector('.new_practical_name');
        if (make_practical_element) {
            setMakePracticalMounted(true);
        } else {
            setMakePracticalMounted(false);
        }

    }, [])

    useEffect(() => {
        async function fetchAdmin() {
            const auth_user = auth.currentUser;
            const token = auth_user && (await auth_user.getIdToken());

            if (currentUser) {
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
                const user_data = await user_res.json()

                const school_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/school/${user_data.school_id}`, requestOptions);
                const school_data = await school_res.json()

                let school_students = []
                let school_instructors = []

                school_data.students.map((student) => {
                    school_students.push(student)
                })
                school_data.instructors.map((instructor) => {
                    school_instructors.push(instructor)
                })

                setSchoolStudents(school_students)
                setSchoolInstructors(school_instructors)
            }

        }

        if (currentUser) {
            fetchAdmin()
        }
    }, [currentUser])

    const make_practical_tutorial_steps = [
        {
            target: ".new_practical_name",
            content: "A descriptive name for your practical.",
            placement: "right"
        },
        {
            target: ".new_practical_video_link",
            content: "The YouTube video link of the practical. NOTE: Make sure that it is the part of the link BEFORE the question mark.",
            placement: "right"
        },
        {
            target: ".new_practical_sparticipant",
            content: "The emails of the students participating in your practical. As you add students, they will be displayed in a list underneath this box.",
            placement: "right"
        },
        {
            target: ".new_practical_instructor",
            content: "The email of the instructor for this practical.",
            placement: "right"
        },
        {
            target: ".new_practical_submit",
            content: "Press submit when you're done!",
            placement: "right"
        },
    ]



    return (

        <Box sx={{
            minHeight: "100%",
            minWidth: "100%"
        }}>
            {(isMakePracticalMounted) ?
                (
                    <Joyride steps={make_practical_tutorial_steps} continuous callback={handleMakePracticalJoyrideCallback} run={!makePracticalTutorial} styles={{ options: { zIndex: 1500 } }} />
                ) : null
            }
            <Box sx={{
                minHeight: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 8,
                flexDirection: "column"
            }}>
                <Box sx={{
                    pt: 5,
                    pb: 3
                }}>
                    <Typography variant='h3'>
                        Create a Practical
                    </Typography>
                </Box>

                <form onSubmit={handleFormSubmit}>
                    <Box sx={{ mb: 3, border: '1px solid #ccc', borderRadius: 4, padding: 2, backgroundColor: '#F4F4F4' }}>
                        <UploadVideo setVideoLink={setVideoLink} practicalId={practicalId} schoolId={schoolId} setVideoUploaded={setVideoUploaded} />
                    </Box>
                    <TextField label="Name"
                        onChange={e => setPracticalName(e.target.value)}
                        required
                        className='new_practical_name'
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 2 }}
                        fullWidth
                        value={practicalName} />


                    <Box
                        className='new_practical_participants'
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                        <TextField label="Students"
                            onChange={e => setCurParticipant(e.target.value)}
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            value={curParticipant} />

                        <Button variant='contained' onClick={handleAddParticipant}>
                            Add Student
                        </Button>

                    </Box>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        mb: 2
                    }}>

                        {participants.map((participant, idx) => (
                            <Box
                                sx={{
                                    display: "flex",
                                    pt: 1,
                                    alignItems: "center"
                                }}>
                                <Typography variant='text'>
                                    {participant}
                                </Typography>
                                <Button onClick={() => handleRemoveParticipant(idx)}>
                                    <DeleteIcon />
                                </Button>
                            </Box>
                        ))}
                    </Box>

                    {!isInstructor ? <TextField
                        className='new_practical_instructor'
                        label="Instructor"
                        onChange={e => setInstructor(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 2 }}
                        fullWidth
                        value={instructor} /> : null}


                    <Box
                        className='new_practical_submit'
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                        <Button variant='contained' type='submit' disabled={loading || !videoUploaded} sx={{ mx: 1 }}>
                            Create Practical
                        </Button>
                    </Box>

                </form>
            </Box>

        </Box>





    )
}
