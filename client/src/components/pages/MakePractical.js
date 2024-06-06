import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from "react";
import auth from "../../config/firebase.js";
import SideBar from '../elements/SideBar';
import Grid from '@mui/material/Unstable_Grid2';
import Header from '../elements/Header';

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

    const handleAddParticipant = async () => {

        try {
            const participant_res = await fetch(`http://localhost:3001/api/user/email/${curParticipant}`);
            const participant = await participant_res.json()

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

        console.log(participantIds)
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const creation_date = Date.now()
            const user_creator = user.uid
            let user_participants = []

            participants.map(async (participantEmail) => {
                const participant_res = await fetch(`http://localhost:3001/api/user/email/${participantEmail}`);
                const participant = await participant_res.json()
                user_participants.push(participant[0].id)
            })

            const instructor_res = await fetch(`http://localhost:3001/api/user/email/${instructor}`);
            const instructorData = await instructor_res.json()

            let user_instructor_id = instructorData[0].id
            let user_instructor_name = instructorData[0].real_name


            let newPracticalData = {
                practical_name: practicalName,
                creation_date: creation_date,
                video_link: videoLink,
                user_creator: user_creator,
                user_participants: user_participants,
                user_instructor_id: user_instructor_id,
                user_instructor_name: user_instructor_name,
                tasks: [],
                comments: [],
                chats: []
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

            await fetch(`http://localhost:3001/api/newPractical`, createNewPracticalOptions);

            navigate("/dashboard");


            setLoading(false);
        } catch (e) {
            console.log(e);
        }
    }

    return (

        <Box sx={{
            minHeight: "100%",
            minWidth: "100%"
        }}>

            <Grid container spacing={0}>
                <Grid xs={2}>
                    <SideBar />
                </Grid>
                <Grid xs={10}>
                    <Box sx={{
                        Height: "100%",
                        Width: "83.33%",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <Header />
                        <Box sx={{
                            minHeight: "100%",
                            minWidth: "83.33%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            pt: 3,
                        }}>


                            <Box sx={{

                                justifyContent: "center",
                                alignItems: "center",
                                my: 5,
                            }}>
                                <Box sx={{
                                    my: 4
                                }}>
                                    <Typography variant='h3'>
                                        Create a Practical
                                    </Typography>
                                </Box>

                                <form onSubmit={handleFormSubmit}>
                                    <TextField label="Name"
                                        onChange={e => setPracticalName(e.target.value)}
                                        required
                                        variant="outlined"
                                        color="secondary"
                                        sx={{ mb: 3 }}
                                        fullWidth
                                        value={practicalName} />

                                    <TextField label="Video Link"
                                        onChange={e => setVideoLink(e.target.value)}
                                        required
                                        variant="outlined"
                                        color="secondary"
                                        sx={{ mb: 3 }}
                                        fullWidth
                                        value={videoLink} />

                                    <Box sx={{
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

                                        {participants.map((participant) => (
                                            <Typography variant='text'>
                                                {participant}
                                            </Typography>
                                        ))}
                                    </Box>

                                    <TextField label="Instructor"
                                        onChange={e => setInstructor(e.target.value)}
                                        required
                                        variant="outlined"
                                        color="secondary"
                                        sx={{ mb: 3 }}
                                        fullWidth
                                        value={instructor} />

                                    <Box sx={{
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
                    </Box>
                </Grid>
            </Grid>
        </Box>




    )
}
