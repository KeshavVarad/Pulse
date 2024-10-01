import React, { useEffect, useState, useCallback } from 'react'

import { useAuth } from '../../contexts/AuthContext.js';
import { Button, Modal, Box, Typography, TextField } from '@mui/material'
import { auth } from "../../config/firebase.js";
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
    const [schoolId, setSchoolId] = useState();
    const [studentYear, setStudentYear] = useState();
    const [schoolTaskData, setSchoolTaskData] = useState([]);
    const [cohortInd, setCohortInd] = useState(-1)
    const [yearInd, setYearInd] = useState(-1)


    const { setError } = useAuth()

    const handleDeleteButton = async () => {
        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            // Fetch practical data (including comments)
            const practicalRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${practicalId}`);
            const practical = await practicalRes.json();
            const practicalComments = practical.comments;

            // Delete the practical
            const deletePracticalOptions = {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/deletePractical/${practicalId}`, deletePracticalOptions);

            // Update participants' practical list
            participantIds.map(async (participantId) => {
                const getParticipantOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                };

                const deletedParticipantRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${participantId}`, getParticipantOptions);
                const deletedParticipantData = await deletedParticipantRes.json();

                let curInPracticals = deletedParticipantData.inPracticals;
                curInPracticals.splice(curInPracticals.indexOf(practicalId), 1);

                const updateParticipantOptions = {
                    method: "PUT",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ inPracticals: curInPracticals }),
                };

                await fetch(`${process.env.REACT_APP_API_HOST}/api/updateUser/${participantId}`, updateParticipantOptions);
            });

            // Update the school task data
            let newSchoolTaskData = schoolTaskData.slice();

            practical.tasks.forEach(task => {
                // Find the task in the school task data
                let schoolDataTaskIndex = newSchoolTaskData[cohortInd].data[yearInd].data.findIndex(data => data.name === task.name);

                if (schoolDataTaskIndex !== -1) {
                    let schoolDataTask = newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex];

                    // Update the school data counts based on the comments of the practical being deleted
                    let redCount = 0, yellowCount = 0, greenCount = 0;

                    practicalComments.forEach(comment => {
                        if (comment.task === task.name) {
                            if (comment.rating === 1) redCount++;
                            if (comment.rating === 3) yellowCount++;
                            if (comment.rating === 5) greenCount++;
                        }
                    });

                    // Subtract the counts for this practical's comments
                    schoolDataTask.red_count -= redCount;
                    schoolDataTask.yellow_count -= yellowCount;
                    schoolDataTask.green_count -= greenCount;

                    // Recalculate the average rating for the task
                    let totalPracticalCount = schoolDataTask.red_count + schoolDataTask.yellow_count + schoolDataTask.green_count;
                    schoolDataTask.avg_rating = totalPracticalCount > 0
                        ? ((schoolDataTask.green_count * 5) + (schoolDataTask.yellow_count * 3) + (schoolDataTask.red_count * 1)) / totalPracticalCount
                        : 0;

                    // Remove the task if all counts are zero
                    if (schoolDataTask.red_count === 0 && schoolDataTask.yellow_count === 0 && schoolDataTask.green_count === 0) {
                        newSchoolTaskData[cohortInd].data[yearInd].data.splice(schoolDataTaskIndex, 1);
                    }
                }
            });

            // Update the school data on the server
            const schoolUpdateOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ task_data: newSchoolTaskData }),
            };

            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateSchool/${schoolId}`, schoolUpdateOptions);

            // Close the delete modal or action
            handleClose();
            window.location.reload();

        } catch (error) {
            console.error("Error in handleDeleteButton:", error);
        }
    };


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

        handleClose()
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
        async function fetchSchoolData() {

            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());

                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                };

                const school_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/school/${schoolId}`, requestOptions);
                const school_data = await school_res.json()

                const school_task_data = school_data.task_data

                let schoolDataCohortIndex = school_task_data.findIndex((data) => data.cohort_year == studentYear)

                if (schoolDataCohortIndex == -1) {
                    school_task_data.push({
                        cohort_year: studentYear,
                        data: []
                    })
                    schoolDataCohortIndex = school_task_data.length - 1
                }
                setCohortInd(schoolDataCohortIndex)

                const currentYear = new Date().getFullYear().toString();
                let schoolDataYearIndex = school_task_data[schoolDataCohortIndex].data.findIndex((d) => d.year == currentYear)

                if (schoolDataYearIndex == -1) {
                    school_task_data[schoolDataCohortIndex].data.push({
                        year: currentYear,
                        data: []
                    })
                    schoolDataYearIndex = school_task_data[schoolDataCohortIndex].data.length - 1
                }

                setYearInd(schoolDataYearIndex)

                setSchoolTaskData(school_task_data)

            }
            catch (e) {
                console.log(e);
            }

        }

        if (schoolId) {
            fetchSchoolData()
        }
    }, [schoolId])


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
            setSchoolId(practical.school_id)
            setStudentYear(practical.cohort_year)

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
                width: 600,
                bgcolor: "background.paper",
                boxShadow: 24,
                p: 4,
                borderRadius: "10px"
            }}>
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <Typography id="modal-modal-title" variant="h4" fontWeight={400}>
                        {practicalName}
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Students:
                    </Typography>

                    {participantEmails.map((email, idx) => (
                        <Box key={idx} sx={{ display: "flex", mt: 1, justifyContent: "center", alignItems: "center" }}>
                            <Typography variant='h7' key={idx}>
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
                        display: "flex",
                        height: "10",
                        mt: 2,
                    }}>

                        <TextField label="Add Student"
                            onChange={e => setCurParticipant(e.target.value)}
                            variant="filled"

                            color="secondary"
                            value={curParticipant}
                            sx={{ height: "100%" }}
                            size='small' />

                        <Button onClick={handleAddParticipantButton} variant="contianed" size="small">
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
                                mt: 5
                            }}>
                            Update Practical
                        </Button>

                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteButton}
                            sx={{
                                mt: 5
                            }}>
                            Delete Practical
                        </Button>
                    </Box>



                </Box>

            </Box>
        </Modal >

    )
}
