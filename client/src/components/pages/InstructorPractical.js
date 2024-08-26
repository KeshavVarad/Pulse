
import { useParams } from "react-router-dom"
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import { useRef } from "react";
import auth from "../../config/firebase.js";
import { v4 as uuidv4 } from 'uuid';

import YouTube from "react-youtube"
import { Modal, List, ListItem, ListItemText, ButtonGroup, Grid, Typography, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete } from "@mui/material"
import DeleteIcon from '@mui/icons-material/Delete';
import InsertCommentIcon from '@mui/icons-material/InsertComment';
import SendIcon from '@mui/icons-material/Send';

export default function InstructorPractical() {

    const { currentUser } = useAuth();

    const userId = currentUser.uid;

    const params = useParams();
    const practicalId = params.id;

    const [practicalName, setPracticalName] = useState("");

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

    // Task state
    const [tasks, setTasks] = useState([])
    const [newTask, setNewTask] = useState("")

    // Comment state
    const [comments, setComments] = useState([])
    const [editableCommentIdx, setEditableCommentIdx] = useState(-1)
    const [commentEdit, setCommentEdit] = useState("")

    const [taskChatOpen, setTaskChatOpen] = useState(false)
    const [taskToDisplay, setTaskToDisplay] = useState()

    // Message state
    const [curMessage, setMessage] = useState("")

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
            timestamp: videoTimeStamp,
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
            let schoolDataTaskIndex = newSchoolTaskData[cohortInd].data[yearInd].data.findIndex(data => data.name == comments[idx].name)

            let rating_sum = 1 * practical.red_count + 3 * practical.yellow_count + 5 * practical.green_count

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


            const videoParams = practical.video_link.split("/")
            setVideoId(videoParams[videoParams.length - 1])

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
            color: "white"
        }
    };

    return (
        <Box sx={{
            minHeight: "100%",
            minWidth: "100%"
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
                    py: 5
                }}>
                    <Typography variant="h4"> {practicalName} </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    width: "100%"
                }}>
                    <Box sx={{

                    }}>
                        <YouTube videoId={videoId} onStateChange={handleVideoChange} opts={video_opts} ref={videoRef} onReady={(event) => { setPlayer(event.target); }} />
                    </Box>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",

                    }}>
                        <Typography variant="h5">
                            Make Ratings
                        </Typography>

                        {tasks.map(task => (
                            <Box sx={{
                                width: "80%",
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                pt: 1,

                            }}>
                                <Box sx={{
                                    px: 2, minWidth: 50
                                }}>
                                    <Typography variant="h7">{task.name}</Typography>
                                </Box>
                                <Box sx={{ px: 2 }}>
                                    <ButtonGroup variant="contained" aria-label="Basic button group" >
                                        <Button onClick={() => { handleRating(task, 1) }} variant="contained" color="primary" size="large">RED</Button>
                                        <Button onClick={() => { handleRating(task, 3) }} variant="contained" color="secondary">YELLOW</Button>
                                        <Button onClick={() => { handleRating(task, 5) }} variant="contained">GREEN</Button>
                                    </ButtonGroup>
                                </Box>

                                <Box>
                                    <Button onClick={() => handleTaskChatButton(task)}>
                                        <InsertCommentIcon />
                                    </Button>
                                </Box>


                            </Box>
                        ))}


                        <Box sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "60%",
                        }}>

                            <Autocomplete
                                sx={{
                                    width: "100%"
                                }}
                                id="free-solo-demo"
                                freeSolo
                                options={schoolTaskPool}
                                renderInput={(params) => (<TextField
                                    {...params}
                                    label="New Task"
                                    variant="outlined"
                                    color="secondary"
                                    sx={{
                                        mx: 2
                                    }}
                                    onChange={e => setNewTask(e.target.value)}
                                    fullWidth
                                    value={newTask} />)}
                            />



                            <Button variant="contained" onClick={handleNewTaskChange}>Add Task</Button>
                        </Box>

                    </Box>


                </Box>


                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    pt: 5,
                    width: "100%",
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
                                                    <ListItemText align="right" secondary={reply.createdBy + " " + new Date(reply.createdAt * 1000).toISOString().substring(14, 19)}></ListItemText>
                                                </Grid>
                                            </Grid>
                                        ) : (
                                            <Grid container sx={{ width: "100%" }}>
                                                <Grid item xs={12} >
                                                    <ListItemText align="left" primary={reply.message}></ListItemText>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <ListItemText align="left" secondary={reply.createdBy + " " + new Date(reply.createdAt * 1000).toISOString().substring(14, 19)}></ListItemText>
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
