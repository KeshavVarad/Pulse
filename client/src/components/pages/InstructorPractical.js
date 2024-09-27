
import { useParams } from "react-router-dom"
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import { useRef } from "react";
import { auth } from "../../config/firebase.js";
import { v4 as uuidv4 } from 'uuid';

import YouTube from "react-youtube"
import { Modal, List, ListItem, ListItemText, Slider, ButtonGroup, Grid, Typography, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete } from "@mui/material"
import DeleteIcon from '@mui/icons-material/Delete';
import InsertCommentIcon from '@mui/icons-material/InsertComment';
import SendIcon from '@mui/icons-material/Send';
import GCloudVideoPlayer from "../elements/GCloudVideoPlayer.js";


export default function InstructorPractical() {

    const { currentUser } = useAuth();

    const userId = currentUser.uid;

    const params = useParams();
    const practicalId = params.id;

    const [practicalName, setPracticalName] = useState("");

    const [participants, setParticipants] = useState([]);

    const [schoolId, setSchoolId] = useState();
    const [studentYear, setStudentYear] = useState();
    const [schoolTaskData, setSchoolTaskData] = useState([]);
    const [cohortInd, setCohortInd] = useState(-1)
    const [yearInd, setYearInd] = useState(-1)
    const [schoolTaskPool, setSchoolTaskPool] = useState([]);


    // Video state
    const [videoId, setVideoId] = useState("")
    const videoRef = useRef(null);
    const [videoTimeStamp, setVideoTimeStamp] = useState(0)
    const [player, setPlayer] = useState(null);
    const [videoLink, setVideoLink] = useState("");

    // Task state
    const [tasks, setTasks] = useState([])
    const [newTask, setNewTask] = useState("")

    // Comment state
    const [comments, setComments] = useState([])
    const [editableCommentIdx, setEditableCommentIdx] = useState(-1)
    const [commentEdit, setCommentEdit] = useState("")
    const [shortcuts, setShortcuts] = useState({});

    const [taskChatOpen, setTaskChatOpen] = useState(false)
    const [taskToDisplay, setTaskToDisplay] = useState()

    // Message state
    const [curMessage, setMessage] = useState("")

    // GCloud specific state variables
    const [gcloudVideoTimeStamp, setGcloudVideoTimeStamp] = useState(0);
    const [gcloudPlayer, setGcloudPlayer] = useState(null);
    const gcloudVideoRef = useRef(null);

    const checkGCloudVideoTime = useCallback(() => {
        if (gcloudPlayer && gcloudPlayer.getCurrentTime) {
            const currentTime = gcloudPlayer.getCurrentTime();
            setGcloudVideoTimeStamp(currentTime);
        }
    }, [gcloudPlayer]);

    const handleGCloudVideoChange = (playedSeconds) => {
        setGcloudVideoTimeStamp(playedSeconds); // Set the current timestamp directly
    };


    useEffect(() => {
        let interval;
        if (gcloudPlayer) {
            interval = setInterval(checkGCloudVideoTime, 250); // Check every 250ms
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [gcloudPlayer]);

    const getVideoSourceType = (videoUrl) => {
        const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(youtube\.com|youtu\.be)/;
        const gcloudPattern = /https:\/\/storage\.googleapis\.com\/.+/;

        if (youtubePattern.test(videoUrl)) {
            return 'youtube';
        } else if (gcloudPattern.test(videoUrl)) {
            return 'gcloud';
        } else {
            return 'unknown';
        }
    };


    const createNotification = async (notificationData) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/newNotification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notificationData),
            });

            if (!response.ok) {
                throw new Error('Failed to create notification');
            }

            const result = await response.text();
            console.log(result); // You can handle success feedback here if needed
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    };


    // Task functions

    const handleNewTaskChange = async () => {

        if (newTask == "") {
            return
        }

        var newTasks = tasks.slice()
        newTasks.push({ name: newTask, replies: [], red_count: 0, yellow_count: 0, green_count: 0 })

        let schoolDataTaskIndex = schoolTaskData[cohortInd].data[yearInd].data.findIndex((d) => d.name == newTask)

        let schoolTaskPoolIndex = schoolTaskPool.findIndex((t) => t == newTask)

        if (schoolTaskPoolIndex == -1) {

            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());

                let newSchoolTaskPool = schoolTaskPool.slice()
                newSchoolTaskPool.push(newTask)

                setSchoolTaskPool(newSchoolTaskPool)
                const requestOptions = {
                    method: "PUT",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ task_pool: newSchoolTaskPool })

                };

                await fetch(`${process.env.REACT_APP_API_HOST}/api/updateSchool/${schoolId}`, requestOptions);
            } catch (e) {
                console.log(e);
            }


        }

        if (schoolDataTaskIndex == -1) {
            let newSchoolTaskData = schoolTaskData.slice()
            newSchoolTaskData[cohortInd].data[yearInd].data.push({
                name: newTask,
                red_count: 0,
                yellow_count: 0,
                green_count: 0,
                avg_rating: 0
            })
        }

        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tasks: newTasks })

            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updatePractical/${practicalId}`, requestOptions);

            setTasks(newTasks)
            setNewTask("")

        } catch (e) {
            console.log(e);
        }


    }

    // Video functions

    const checkVideoTime = useCallback(() => {
        if (player && player.getCurrentTime) {
            const currentTime = player.getCurrentTime();
            setVideoTimeStamp(currentTime);
        }
    }, [player, setVideoTimeStamp]);


    const handleVideoChange = async (e) => {
        const curTime = await e.target.getCurrentTime();

        setVideoTimeStamp(curTime)
    }

    // Comment functions

    const handleRating = async (task, rating) => {

        const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${practicalId}`);
        const practical = await practical_res.json()

        const commentId = uuidv4()

        const newComment = {
            id: commentId,
            task: task.name,
            rating: rating,
            timestamp: getVideoSourceType(videoLink) === "youtube" ? videoTimeStamp : gcloudVideoTimeStamp,
            feedback: "",
            replies: []
        }

        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const createNewCommentOptions = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newComment)

            };

            await fetch(`${process.env.REACT_APP_API_HOST}/api/newComment`, createNewCommentOptions);

            let newComments = practical.comments
            newComments.push(commentId)

            let newTasks = practical.tasks
            
            let newSchoolTaskData = schoolTaskData.slice()
            let taskIndex = newTasks.findIndex(t => t.name == task.name)
            let schoolDataTaskIndex = newSchoolTaskData[cohortInd].data[yearInd].data.findIndex(data => data.name == task.name)

            let practicalUpdateData = { comments: newComments }

            

            let rating_sum = 1 * practical.red_count + 3 * practical.yellow_count + 5 * practical.green_count
            
            if (rating == 1) {
                practicalUpdateData.red_count = practical.red_count + 1
                newTasks[taskIndex].red_count += 1
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].red_count += 1
                rating_sum += 1

            }

            if (rating == 3) {
                practicalUpdateData.yellow_count = practical.yellow_count + 1
                newTasks[taskIndex].yellow_count += 1
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].yellow_count += 1

                rating_sum += 3
            }

            if (rating == 5) {
                practicalUpdateData.green_count = practical.green_count + 1
                newTasks[taskIndex].green_count += 1
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].green_count += 1

                rating_sum += 5
            }
            newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].avg_rating = (
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].red_count +
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].yellow_count * 3 +
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].green_count * 5) / (
                    newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].red_count +
                    newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].yellow_count +
                    newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].green_count
                )



            practicalUpdateData.avg_rating = rating_sum / newComments.length

            practicalUpdateData.tasks = newTasks
            setTasks(newTasks)
            setSchoolTaskData(newSchoolTaskData)
            console.log(rating_sum)
            // BUG HERE ABOVE

            const updatePracticalRequestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(practicalUpdateData)

            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updatePractical/${practicalId}`, updatePracticalRequestOptions);

            const updateSchoolRequestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ task_data: schoolTaskData })
            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateSchool/${schoolId}`, updateSchoolRequestOptions);


            let newCommentsData = comments.slice()
            console.log(practicalUpdateData);
            newCommentsData.unshift(newComment)

            setComments(newCommentsData)


        } catch (e) {
            console.log(e);
        }
    }

    const handleEditButton = async (idx) => {
        setEditableCommentIdx(idx)
        setCommentEdit(comments[idx].feedback)

    }

    const handleSubmitButton = async (idx) => {

        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const commentId = comments[idx].id

            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ feedback: commentEdit })

            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateComment/${commentId}`, requestOptions);

            const getCommentRequestOptions = {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },

            };
            const updatedCommentRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`, getCommentRequestOptions);
            const updatedCommentData = await updatedCommentRes.json()

            let newComments = comments.slice()

            newComments[idx] = updatedCommentData

            setComments(newComments)

        } catch (e) {
            console.log(e);
        }

    }

    const handleDeleteComment = async (idx) => {
        const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${practicalId}`);
        const practical = await practical_res.json()

        let oldCommentIds = practical.comments
        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const commentId = comments[idx].id
            const comment_rating = comments[idx].rating

            var index = oldCommentIds.indexOf(commentId);
            if (index !== -1) {
                oldCommentIds.splice(index, 1);
            }

            const deleteCommentRequestOptions = {
                method: "DELETE",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/deleteComment/${commentId}`, deleteCommentRequestOptions);

            let practicalUpdateData = { comments: oldCommentIds }
            let newTasks = practical.tasks
            let newSchoolTaskData = schoolTaskData.slice()

            let taskIndex = newTasks.findIndex(t => t.name == comments[idx].task)

            let schoolDataTaskIndex = newSchoolTaskData[cohortInd].data[yearInd].data.findIndex(data => data.name == comments[idx].task)

            let rating_sum = 1 * practical.red_count + 3 * practical.yellow_count + 5 * practical.green_count

            console.log(cohortInd, yearInd, schoolDataTaskIndex)

            if (comment_rating == 1) {
                practicalUpdateData.red_count = practical.red_count - 1
                newTasks[taskIndex].red_count -= 1
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].red_count -= 1

                rating_sum -= 1
            }

            if (comment_rating == 3) {
                practicalUpdateData.yellow_count = practical.yellow_count - 1
                newTasks[taskIndex].yellow_count -= 1
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].yellow_count -= 1

                rating_sum -= 3
            }

            if (comment_rating == 5) {
                practicalUpdateData.green_count = practical.green_count - 1
                newTasks[taskIndex].green_count -= 1
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].green_count -= 1

                rating_sum -= 5
            }

            newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].avg_rating = (
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].red_count +
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].yellow_count * 3 +
                newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].green_count * 5) / (
                    newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].red_count +
                    newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].yellow_count +
                    newSchoolTaskData[cohortInd].data[yearInd].data[schoolDataTaskIndex].green_count
                )

            practicalUpdateData.tasks = newTasks
            practicalUpdateData.avg_rating = rating_sum / comments.length
            const updatePracticalRequestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(practicalUpdateData)
            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updatePractical/${practicalId}`, updatePracticalRequestOptions);

            const updateSchoolRequestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ task_data: schoolTaskData })
            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateSchool/${schoolId}`, updateSchoolRequestOptions);


            let newComments = comments.slice()
            console.log(practicalUpdateData)
            newComments.splice(idx, 1)

            setComments(newComments)
            setTasks(newTasks)

        } catch (e) {
            console.log(e);
        }
    }

    // handle what happens on key press
    const handleKeyPress = useCallback((event) => {
        if (event.key === " " || event.key === "Enter") {
            const words = commentEdit.split(" ");
            const lastWord = words[words.length - 1];

            // Replace shortcut with full phrase
            if (shortcuts[lastWord]) {
                words[words.length - 1] = shortcuts[lastWord];
                setCommentEdit(words.join(" "));
            }
        }

        if (event.key == "Enter" & editableCommentIdx != -1) {
            handleSubmitButton(editableCommentIdx)
            setEditableCommentIdx(-1)
            setCommentEdit("")
        }


        if (event.key == "Escape" & editableCommentIdx != -1) {
            setEditableCommentIdx(-1)
            setCommentEdit("")
        }
    }, [commentEdit, editableCommentIdx]);

    useEffect(() => {
        // attach the event listener
        document.addEventListener('keydown', handleKeyPress);

        // remove the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress]);

    useEffect(() => {
        async function fetchInstructorData() {
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

        fetchInstructorData()
    }, [currentUser])

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

                setSchoolTaskPool(school_data.task_pool)

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


    // Chat functions
    const now = new Date();

    // Function to format the time, day of the week, or date
    function formatCreatedAt(createdAt) {
        const oneDayInMillis = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const oneWeekInMillis = 7 * oneDayInMillis; // 7 days in milliseconds
        const createdAtDate = new Date(createdAt);

        const timeDifference = now - createdAtDate;

        if (timeDifference < oneDayInMillis) {
            // Format as HH:mm if within the last 24 hours
            return createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (timeDifference < oneWeekInMillis) {
            // Format as the name of the day if within the last week
            return createdAtDate.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
            // Format as MM/DD/YY if older than a week
            return createdAtDate.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
            });
        }
    }


    const handleTaskChatButton = (task) => {
        setTaskToDisplay(task)
        setTaskChatOpen(true)
    }

    const handleTaskChatClose = (task) => {
        setTaskToDisplay(null)
        setTaskChatOpen(false)
    }

    const handleMessageInput = async () => {
        if (curMessage == "") {
            return
        }


        let newTaskToDisplay = taskToDisplay
        let newTasks = tasks.slice()


        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const cur_user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${user.uid}`);
            const cur_user_data = await cur_user_res.json()

            const newReply = {
                message: curMessage,
                createdAt: Date.now(),
                createdBy: cur_user_data.real_name,
                creatorId: user.uid
            }

            newTaskToDisplay.replies.push(newReply)
            newTasks[tasks.indexOf(taskToDisplay)] = newTaskToDisplay


            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tasks: newTasks })

            };
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updatePractical/${practicalId}`, requestOptions);

            participants.map((participant) => {
                createNotification({
                    id: uuidv4(),
                    task: taskToDisplay.name,
                    user_id: participant,
                    message: `Instructor has posted a new comment in the ${taskToDisplay.name} discussion board for ${practicalName}.`,
                    timestamp: new Date().toISOString(), // Or however you want to handle timestamps
                    read_status: false,
                    practical_id: practicalId,
                })
            })

            setTaskToDisplay(newTaskToDisplay)
            setMessage("")



        } catch (e) {
            console.log(e);
        }


    }



    useEffect(() => {
        async function fetchPractical() {

            const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${practicalId}`);

            const practical = await practical_res.json()

            setPracticalName(practical.practical_name)
            setSchoolId(practical.school_id)
            setStudentYear(practical.cohort_year)
            setParticipants(practical.user_participants)


            const videoParams = practical.video_link.split("/")
            setVideoId(videoParams[videoParams.length - 1])
            setVideoLink(practical.video_link)

            const tasks = practical.tasks
            setTasks(tasks)

            const commentIds = practical.comments
            const commentsData = []

            commentIds.map(async (commentId, idx) => {
                const commentRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`);
                const commentData = await commentRes.json()
                commentsData.push(commentData)

            })

            commentsData.reverse()

            setComments(commentsData)

        }

        fetchPractical()
    }, [])

    useEffect(() => {
        let interval;
        if (player) {
            interval = setInterval(checkVideoTime, 250); // Check every second
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [player])

    const video_opts = {
        height: '468',
        width: '768',
        playerVars: {
            autoplay: 1,
            control: 0,
            disablekb: 0,
            fs: 0,
            color: "primary.main"
        }
    };

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
                py: 8,
                px: 4,
                flexDirection: "column",

            }}>
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 5,

                }}>
                    <Typography variant="h3"> {practicalName} </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    width: "100%",
                    alignContent: "center",
                    alignSelf: "center",
                    justifyContent: "center",

                }}>

                    <Box sx={{
                        display: "flex",
                        width: "100%",


                    }}>
                        <Box sx={{
                            display: "absolute",
                            width: "60%"

                        }}>
                            {(getVideoSourceType(videoLink) === "youtube") ?
                                (<YouTube videoId={videoId} onStateChange={handleVideoChange} opts={video_opts} ref={videoRef} onReady={(event) => { setPlayer(event.target); }} />) :
                                (<GCloudVideoPlayer
                                    videoLink={videoLink}
                                    onPlayerReady={setGcloudPlayer}
                                    onVideoChange={handleGCloudVideoChange}
                                    ref={gcloudVideoRef}
                                />)}

                        </Box>

                        <Box sx={{
                            display: "flex",
                            flexDirection: "column",
                            maxWidth: "40%",
                            minWidth: "40%",
                            justifyContent: "space-between",
                            alignItems: "center",
                            px:5,

                        }}>
                            <Typography variant="h4">
                                Make Comments
                            </Typography>

                            {tasks.map(task => (
                                <Box sx={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    pt: 1,

                                }}>
                                    <Box sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        width: "100%",
                                        justifyItems:"center",
                                        alignItems: "center",
                                        justifyContent:"center",
                                    }}>

                                        <Box sx={{
                                            width: "200px",
                                            height:"100%",
                                            pl:2,
                                        }}>
                                            <Typography variant="h7">{task.name}</Typography>
                                        </Box>

                                        <Box sx={{ minWidth: "210px", maxWidth: "210px", p:0}}>
                                            <ButtonGroup variant="contained" aria-label="Basic button group" >
                                                <Button onClick={() => { handleRating(task, 1) }} variant="contained" color="red"  disableElevation sx={{width:"70px"}}>Red</Button>
                                                <Button onClick={() => { handleRating(task, 3) }} variant="contained" color="yellow" disableElevation sx={{width:"70px"}}>Yellow</Button>
                                                <Button onClick={() => { handleRating(task, 5) }} variant="contained" color="green" disableElevation sx={{width:"70px"}}>Green</Button>
                                            </ButtonGroup>
                                        </Box>

                                        <Box sx={{ width: "30px", height:"100%"}}>
                                            <Button onClick={() => handleTaskChatButton(task)}>
                                                <InsertCommentIcon />
                                            </Button>
                                        </Box>
                                    </Box>

                                </Box>
                            ))}


                            <Box sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                            }}>

                                <Autocomplete
                                    sx={{
                                        width: "50%",
                                        size: "small"
                                    }}
                                    id="free-solo-demo"
                                    freeSolo
                                    options={schoolTaskPool}
                                    value={newTask}
                                    onInputChange={(event, newInputValue) => {
                                        setNewTask(newInputValue);
                                    }}
                                    renderInput={(params) => (<TextField
                                        {...params}
                                        label="New Task"
                                        variant="outlined"
                                        color="secondary"
                                        sx={{

                                        }}

                                        value={newTask} />)}
                                    size="small"
                                />



                                <Button variant="contained" size="large" onClick={handleNewTaskChange}>Add Task</Button>
                            </Box>

                        </Box>


                    </Box>
                </Box>


                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    pt: 5,
                    width: "90%",
                    justifyContent: 'center',
                    alignItems: "center"
                }}>
                    <Typography variant="h5">Comments</Typography>

                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Task</TableCell>
                                    <TableCell align="right">Rating</TableCell>
                                    <TableCell align="right">Time Stamp</TableCell>
                                    <TableCell align="right">Additional Feedback</TableCell>
                                    <TableCell align="right">Delete Feedback</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {comments.map((comment, idx) => (
                                    <TableRow
                                        key={comment.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {comment.task}
                                        </TableCell>
                                        <TableCell align="right">{comment.rating}</TableCell>
                                        <TableCell align="right">{new Date(comment.timestamp * 1000).toISOString().substring(14, 19)}</TableCell>
                                        {
                                            (idx != editableCommentIdx) ?
                                                (<TableCell align="right">
                                                    <Typography onClick={() => handleEditButton(idx)} >
                                                        {(comment.feedback == "") ? "NO COMMENT" : comment.feedback}
                                                    </Typography>
                                                </TableCell>) :
                                                (<TableCell align="right">
                                                    <TextField label="Feedback"
                                                        onChange={e => setCommentEdit(e.target.value)}
                                                        variant="outlined"
                                                        color="secondary"
                                                        size="small"
                                                        sx={{

                                                            width: "60%"
                                                        }}

                                                        value={commentEdit} />
                                                </TableCell>)
                                        }
                                        <TableCell align="right">
                                            <Button onClick={() => handleDeleteComment(idx)}>
                                                <DeleteIcon />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>





                </Box>

            </Box>


            <Modal
                open={taskChatOpen}
                onClose={handleTaskChatClose}
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
                    borderRadius:"10px",
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
                            {taskToDisplay ? taskToDisplay.name : "No Task"}
                        </Typography>
                        <Grid item sx={{
                            width: "100%",
                        }}>
                            <List sx={{
                                height: '70vh',
                                overflowY: 'auto',
                            }}>
                                {taskToDisplay ? taskToDisplay.replies.map((reply, idx) => {
                                    return (<ListItem key={idx}>
                                        {(reply.creatorId == userId) ? (
                                            <Grid container sx={{ width: "100%" }}>
                                                <Grid item xs={12} >
                                                    <ListItemText align="right" primary={reply.message}></ListItemText>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <ListItemText align="right" secondary={reply.createdBy + " " + formatCreatedAt(reply.createdAt)}></ListItemText>
                                                </Grid>
                                            </Grid>
                                        ) : (
                                            <Grid container sx={{ width: "100%" }}>
                                                <Grid item xs={12} >
                                                    <ListItemText align="left" primary={reply.message}></ListItemText>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <ListItemText align="left" secondary={reply.createdBy + " " + formatCreatedAt(reply.createdAt)}></ListItemText>
                                                </Grid>
                                            </Grid>
                                        )}

                                    </ListItem>)
                                }) : (<Typography>No Messages</Typography>)}
                            </List>
                        </Grid>

                        <Box sx={{
                            display: "flex",
                        }}>
                            <TextField label="New Message"
                                variant="outlined"
                                color="secondary"
                                sx={{
                                    mx: 2
                                }}
                                onChange={e => setMessage(e.target.value)}
                                fullWidth
                                value={curMessage} />


                            <Button variant="contained" onClick={handleMessageInput}>
                                <SendIcon />
                            </Button>
                        </Box>


                    </Box>

                </Box>
            </Modal >



        </Box >




    )
}
