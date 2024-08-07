import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from "react";
import auth from "../../config/firebase.js";
import { v4 as uuidv4 } from 'uuid';
import DeleteIcon from '@mui/icons-material/Delete';
import Joyride from 'react-joyride';

export default function MakePractical() {

    const [practicalName, setPracticalName] = useState("");
    const [videoLink, setVideoLink] = useState("");
    const [participants, setParticipants] = useState([]);
    const [participantIds, setParticipantIds] = useState([]);

    const [curParticipant, setCurParticipant] = useState("");

    const [instructor, setInstructor] = useState("");


    const navigate = useNavigate();
    const { currentUser, login, setError } = useAuth();
    const [loading, setLoading] = useState(false);

    const [makePracticalTutorial, setMakePracticalTutorial] = useState(false)
    const [isMakePracticalMounted, setMakePracticalMounted] = useState(false);


    const handleAddParticipant = async () => {

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

        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const practicalId = uuidv4()

            const creation_date = Date.now()
            const user_creator = user.uid
            let user_participants = []

            participants.map(async (participantEmail) => {
                const participant_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/email/${participantEmail}`);
                const participants_matching_email = await participant_res.json()
                const participant = participants_matching_email[0]
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
                const userData = await user_res.json()

                setMakePracticalTutorial(userData.make_practical_tutorial)
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
            target: ".new_practical_participants",
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
                    py: 5
                }}>
                    <Typography variant='h4'>
                        Create a Practical
                    </Typography>
                </Box>

                <form onSubmit={handleFormSubmit}>
                    <TextField label="Name"
                        onChange={e => setPracticalName(e.target.value)}
                        required
                        className='new_practical_name'
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 3 }}
                        fullWidth
                        value={practicalName} />

                    <TextField label="Video Link"
                        onChange={e => setVideoLink(e.target.value)}
                        required
                        className='new_practical_video_link'
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 3 }}
                        fullWidth
                        value={videoLink} />

                    <Box
                        className='new_practical_participants'
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                        <TextField label="Participant"
                            onChange={e => setCurParticipant(e.target.value)}
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            value={curParticipant} />

                        <Button variant='contained' onClick={handleAddParticipant}>
                            Add Participant
                        </Button>

                    </Box>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        mb: 3
                    }}>

                        {participants.map((participant, idx) => (
                            <Box
                                sx={{
                                    display: "flex",
                                    pt: 2,
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

                    <TextField
                        className='new_practical_instructor'
                        label="Instructor"
                        onChange={e => setInstructor(e.target.value)}
                        required
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 3 }}
                        fullWidth
                        value={instructor} />

                    <Box
                        className='new_practical_submit'
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                        <Button variant='contained' type='submit' disabled={loading} sx={{ mx: 1 }}>
                            Create Practical
                        </Button>
                    </Box>

                </form>
            </Box>

        </Box>





    )
}
