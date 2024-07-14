import React, { useEffect, useState, useCallback } from 'react'

import { useAuth } from '../../contexts/AuthContext.js';
import { Button, Modal, Box, Typography, TextField } from '@mui/material'
import auth from "../../config/firebase.js";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';

export default function PracticalSettingsModal({ openState, handleClose, practicalId }) {

    const [practicalName, setPracticalName] = useState("");
    const [participantEmails, setParticipantEmails] = useState([]);
    const [participantIds, setParticipantIds] = useState([]);
    const [instructorName, setInstructorName] = useState("");
    const [videoLink, setVideoLink] = useState("");
    const [curParticipant, setCurParticipant] = useState("");
    const [removedParticpantIds, setRemovedParticipantIds] = useState([]);
    const [addedParticipantIds, setAddedParticipantIds] = useState([]);


    const { setError } = useAuth()

    const handleDeleteButton = async () => {
        const user = auth.currentUser;
        const token = user && (await user.getIdToken());

        const deletePracticalOptions = {
            method: "DELETE",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
        await fetch(`${process.env.REACT_APP_API_HOST}/api/deletePractical/${practicalId}`, deletePracticalOptions)

        participantIds.map(async (participantId) => {

            const getParticipantOptions = {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }

            const deleted_participant_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${participantId}`, getParticipantOptions);
            const deleted_participant_data = await deleted_participant_res.json()

            let curInPracticals = deleted_participant_data.inPracticals
            curInPracticals.splice(curInPracticals.indexOf(practicalId), 1)

            const updateParticipantOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ inPracticals: curInPracticals })
            }

            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${participantId}`, updateParticipantOptions);

        })

        handleClose()
    }

    const handleRemoveParticipant = async (idx) => {
        const cur_participant_id = participantIds[idx]
        let cur_removed_participants = removedParticpantIds.slice()

        cur_removed_participants.push(cur_participant_id)

        setRemovedParticipantIds(cur_removed_participants)
    }

    const handleRestoreParticipant = async (idx) => {
        const cur_participant_id = participantIds[idx]
        let cur_removed_participants = removedParticpantIds.slice()

        cur_removed_participants.splice(cur_removed_participants.indexOf(cur_participant_id), 1)

        setRemovedParticipantIds(cur_removed_participants)
    }

    const handleUpdatePracticalButton = async () => {
        const user = auth.currentUser;
        const token = user && (await user.getIdToken());

        const new_participant_ids = participantIds.slice().filter((id) => !removedParticpantIds.includes(id))
        const updatePracticalOptions = {
            method: "PUT",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user_participants: new_participant_ids })
        }

        await fetch(`${process.env.REACT_APP_API_HOST}/api/updatePractical/${practicalId}`, updatePracticalOptions);


        removedParticpantIds.map(async (participantId) => {

            const getParticipantOptions = {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }

            const deleted_participant_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${participantId}`, getParticipantOptions);
            const deleted_participant_data = await deleted_participant_res.json()

            let curInPracticals = deleted_participant_data.inPracticals
            curInPracticals.splice(curInPracticals.indexOf(practicalId), 1)

            const updateParticipantOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ inPracticals: curInPracticals })
            }

            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${participantId}`, updateParticipantOptions);

        })

        addedParticipantIds.map(async (participantId) => {

            const getParticipantOptions = {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }

            const added_participant_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${participantId}`, getParticipantOptions);
            const added_participant_data = await added_participant_res.json()

            let curInPracticals = added_participant_data.inPracticals.slice()

            curInPracticals.push(practicalId)

            const updateParticipantOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ inPracticals: curInPracticals })
            }

            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${participantId}`, updateParticipantOptions);

        })

        setParticipantEmails(participantEmails.slice().filter((email, idx) => !removedParticpantIds.includes(participantIds[idx])))
        setParticipantIds(new_participant_ids)
        setRemovedParticipantIds([])
        setAddedParticipantIds([])
    }

    const handleAddParticipantButton = async () => {
        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const get_participant_options = {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            };
            const participant_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/email/${curParticipant}`, get_participant_options);
            const participants = await participant_res.json()

            const participant = participants[0]


            let curParticipantIds = participantIds.slice()
            curParticipantIds.push(participant.id)

            setParticipantIds(curParticipantIds)

            let curAddedParticipantIds = addedParticipantIds.slice()
            curAddedParticipantIds.push(participant.id)
            setAddedParticipantIds(curAddedParticipantIds)

            let cur_participant_emails = participantEmails.slice()

            cur_participant_emails.push(curParticipant)
            setParticipantEmails(cur_participant_emails)
            setCurParticipant("")

        } catch (e) {
            setCurParticipant("")
            return setError("Invalid participant entered: " + e)
        }
    }

    // handle what happens on key press
    const handleKeyPress = useCallback((event) => {
        if (event.key == "Enter") {
            if (curParticipant.length > 0) {
                handleAddParticipantButton()
            }
        }
    }, [curParticipant]);

    useEffect(() => {
        // attach the event listener
        document.addEventListener('keydown', handleKeyPress);

        // remove the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress]);


    useEffect(() => {
        async function fetchPracticalData() {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const fetchPracticalOptions = {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            };


            const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${practicalId}`, fetchPracticalOptions);


            const practical = await practical_res.json()

            setPracticalName(practical.practical_name)
            setInstructorName(practical.user_instructor_name)
            setVideoLink(practical.video_link)

            let participant_emails = []
            let participant_ids = []


            practical.user_participants.map(async (participantId) => {

                const fetchParticipantOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                };


                const participant_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${participantId}`, fetchParticipantOptions);
                const participant = await participant_res.json()
                participant_emails.push(participant.email)
                participant_ids.push(participant.id)
                setParticipantEmails(participant_emails)
                setParticipantIds(participant_ids)

            })


        }
        if (practicalId) {
            fetchPracticalData()

        }
    }, [practicalId])

    return (
        <Modal
            open={openState}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
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
                    <Typography id="modal-modal-title" variant="h4" component="h2">
                        {practicalName}
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Instructor: {instructorName}
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Participants
                    </Typography>

                    {participantEmails.map((email, idx) => (
                        <Box key={idx} sx={{ display: "flex", mt: 2, justifyContent: "center", alignItems: "center" }}>
                            <Typography variant='text' key={idx}>
                                {email}
                            </Typography>
                            {
                                removedParticpantIds.includes(participantIds[idx]) ?
                                    (
                                        <Button
                                            variant="contained"
                                            sx={{ mx: 2 }}
                                            onClick={() => handleRestoreParticipant(idx)}
                                        >
                                            <RestoreIcon />
                                        </Button>
                                    ) :
                                    (
                                        <Button
                                            variant="contained"
                                            color="error"
                                            sx={{ mx: 2 }}
                                            onClick={() => handleRemoveParticipant(idx)}
                                        >
                                            <DeleteIcon />
                                        </Button>
                                    )
                            }
                        </Box>
                    ))}

                    <Box sx={{
                        display: "flex"
                    }}>

                        <TextField label="Add Participant"
                            onChange={e => setCurParticipant(e.target.value)}
                            variant="outlined"
                            color="secondary"
                            value={curParticipant}
                            sx={{ mt: 2 }} />

                        <Button onClick={handleAddParticipantButton} variant="contianed">
                            <AddIcon />
                        </Button>
                    </Box>

                    <Box sx={{
                        display: "flex"
                    }}>
                        <Button
                            variant="contained"
                            onClick={handleUpdatePracticalButton}
                            sx={{
                                mt: 10
                            }}>
                            Update Practical
                        </Button>

                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteButton}
                            sx={{
                                mt: 10
                            }}>
                            Delete Practical
                        </Button>
                    </Box>



                </Box>

            </Box>
        </Modal >

    )
}
