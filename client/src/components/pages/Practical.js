
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.js";

import YouTube from "react-youtube"
import { Typography, Box, Button, TextField } from "@mui/material"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import auth from "../../config/firebase.js";
import { v4 as uuidv4 } from 'uuid';
import Container from '@mui/material/Container';
import NavBar from '../elements/SideBar';
import Header from '../elements/Header';
import SideBar from '../elements/SideBar';
import Grid from '@mui/material/Unstable_Grid2';
import EditIcon from '@mui/icons-material/Edit';
import Edit from "@mui/icons-material/Edit";
import DoneIcon from '@mui/icons-material/Done';
import DeleteIcon from '@mui/icons-material/Delete';
import ButtonGroup from "@mui/material/ButtonGroup";
import InsertCommentIcon from '@mui/icons-material/InsertComment';
import Modal from "@mui/material/Modal";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import SendIcon from '@mui/icons-material/Send';


export default function Practical() {

    const { currentUser } = useAuth();

    const userId = currentUser.uid;

    const params = useParams();
    const practicalId = params.id;

    /*

    (this.video_link = video_link),
            (this.user_creator = user_creator),
            (this.user_participants = user_participants),
            (this.user_instructors = user_instructors),
            (this.comments = comments),
            (this.chats = chats);
            */


    const [videoId, setVideoId] = useState("")
    const [userCreator, setUserCreator] = useState(null)
    const [userParticipants, setUserParticipants] = useState([])
    const [userInstructorId, setUserInstructorId] = useState()
    const [tasks, setTasks] = useState([])
    const [comments, setComments] = useState([])
    const [commentFeedbacks, setCommentFeedbacks] = useState([])
    const [commentEditable, setCommentEditable] = useState([])
    const [videoTimeStamp, setVideoTimeStamp] = useState(0)

    const [newTask, setNewTask] = useState("")

    const [commentChatOpen, setCommentChatOpen] = useState(false)
    const [commentToDisplay, setCommentToDisplay] = useState()

    const [curMessage, setMessage] = useState("")

    const handleNewTaskChange = async () => {

        if (newTask == "") {
            return
        }

        var newTasks = tasks.slice()
        newTasks.push(newTask)
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
            await fetch(`http://localhost:3001/api/updatePractical/${practicalId}`, requestOptions);

            setTasks(newTasks)
            setNewTask("")

        } catch (e) {
            console.log(e);
        }


    }

    const handleRating = async (task, rating) => {

        const practical_res = await fetch(`http://localhost:3001/api/practical/${practicalId}`);
        const practical = await practical_res.json()

        const commentId = uuidv4()

        const newComment = {
            id: commentId,
            task: task,
            rating: rating,
            timestamp: videoTimeStamp,
            feedback: "NA",
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

            const res = await fetch(`http://localhost:3001/api/newComment`, createNewCommentOptions);

            let newComments = practical.comments
            newComments.push(commentId)

            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ comments: newComments })

            };
            await fetch(`http://localhost:3001/api/updatePractical/${practicalId}`, requestOptions);

            let newCommentsData = comments.slice()

            newCommentsData.push(newComment)

            setComments(newCommentsData)


        } catch (e) {
            console.log(e);
        }
    }

    const handleVideoChange = async (e) => {
        const curTime = await e.target.getCurrentTime();


        setVideoTimeStamp(curTime)
    }

    const handleCommentFeedbackChange = async (e, idx) => {
        let newFeedbacks = commentFeedbacks.slice()

        newFeedbacks[idx] = e.target.value

        setCommentFeedbacks(newFeedbacks)
    }

    const handleEditButton = async (idx) => {
        let newCommentEditable = commentEditable.slice()
        let newFeedbacks = commentFeedbacks.slice()

        newCommentEditable[idx] = true
        newFeedbacks[idx] = comments[idx].feedback

        setCommentEditable(newCommentEditable)
        setCommentFeedbacks(newFeedbacks)

    }

    const handleSubmitButton = async (idx) => {
        let newCommentEditable = commentEditable.slice()

        newCommentEditable[idx] = false

        setCommentEditable(newCommentEditable)

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
                body: JSON.stringify({ feedback: commentFeedbacks[idx] })

            };
            await fetch(`http://localhost:3001/api/updateComment/${commentId}`, requestOptions);

            const getCommentRequestOptions = {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },

            };
            const updatedCommentRes = await fetch(`http://localhost:3001/api/comment/${commentId}`, getCommentRequestOptions);
            const updatedCommentData = await updatedCommentRes.json()

            let newComments = comments.slice()

            newComments[idx] = updatedCommentData

            setComments(newComments)

        } catch (e) {
            console.log(e);
        }

    }

    const handleDeleteComment = async (idx) => {
        const practical_res = await fetch(`http://localhost:3001/api/practical/${practicalId}`);
        const practical = await practical_res.json()

        let oldCommentIds = practical.comments
        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const commentId = comments[idx].id

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
            await fetch(`http://localhost:3001/api/deleteComment/${commentId}`, deleteCommentRequestOptions);

            const updatePracticalRequestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ comments: oldCommentIds })
            };
            await fetch(`http://localhost:3001/api/updatePractical/${practicalId}`, updatePracticalRequestOptions);

            let newComments = comments.slice()

            newComments.splice(idx, 1)

            setComments(newComments)

        } catch (e) {
            console.log(e);
        }
    }

    const handleCommentChatButton = (comment) => {
        setCommentToDisplay(comment)
        setCommentChatOpen(true)
    }

    const handleCommentChatClose = () => {
        setCommentToDisplay(null)
        setCommentChatOpen(false)
    }

    const handleMessageInput = async () => {
        if (curMessage == "") {
            return
        }


        let newCommentToDisplay = commentToDisplay


        try {
            const user = auth.currentUser;
            const token = user && (await user.getIdToken());

            const cur_user_res = await fetch(`http://localhost:3001/api/user/${user.uid}`);
            const cur_user_data = await cur_user_res.json()



            const newReply = {
                message: curMessage,
                createdAt: Date.now(),
                createdBy: cur_user_data.real_name,
                creatorId: user.uid
            }

            newCommentToDisplay.replies.push(newReply)

            const requestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ replies: newCommentToDisplay.replies })

            };
            await fetch(`http://localhost:3001/api/updateComment/${newCommentToDisplay.id}`, requestOptions);

            setCommentToDisplay(newCommentToDisplay)
            setMessage("")



        } catch (e) {
            console.log(e);
        }


    }

    useEffect(() => {
        async function fetchPractical() {

            const practical_res = await fetch(`http://localhost:3001/api/practical/${practicalId}`);

            const practical = await practical_res.json()

            const videoParams = practical.video_link.split("/")
            setVideoId(videoParams[videoParams.length - 1])

            const tasks = practical.tasks
            setTasks(tasks)

            const commentIds = practical.comments
            const commentsData = []
            let newCommentFeedbacks = commentFeedbacks
            let newCommentEditable = commentEditable

            commentIds.map(async (commentId, idx) => {
                const commentRes = await fetch(`http://localhost:3001/api/comment/${commentId}`);
                const commentData = await commentRes.json()
                commentsData.push(commentData)

                if (idx > newCommentFeedbacks.length) {
                    newCommentFeedbacks.push(commentData.feedback)
                    newCommentEditable.push(false)
                }

            })

            setComments(commentsData)

            const user_creator_id = practical.user_creator
            const creator_res = await fetch(`http://localhost:3001/api/user/${user_creator_id}`);
            const userCreator = await creator_res.json()
            setUserCreator(userCreator)

            const user_instructor_id = practical.user_instructor_id

            setUserInstructorId(user_instructor_id)

        }

        fetchPractical()
    }, [])

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
                        Width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <Header />
                        <Box sx={{
                            minHeight: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 12,
                            px: 4,
                            flexDirection: "column",
                        }}>
                            <Box sx={{
                                pb: 5
                            }}>
                                <Typography variant="h3"> Practical </Typography>
                            </Box>

                            <Box sx={{
                                display: "flex",
                                width: "100%"
                            }}>
                                <Box sx={{

                                    py: 5
                                }}>
                                    <YouTube videoId={videoId} onStateChange={handleVideoChange} />
                                </Box>

                                {(userId == userInstructorId) ?
                                    (<Box sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        width: "100%",
                                        justifyContent: "space-between",
                                        alignItems: "center",

                                    }}>
                                        <Typography variant="h4">
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
                                                <Box sx={{ px: 2 }}>
                                                    <Typography variant="h7">{task}</Typography>
                                                </Box>
                                                <Box sx={{ px: 2 }}>
                                                    <ButtonGroup variant="contained" aria-label="Basic button group" >
                                                        <Button onClick={() => { handleRating(task, -1) }} variant="contained" color="primary" size="large">RED</Button>
                                                        <Button onClick={() => { handleRating(task, 0) }} variant="contained" color="secondary">YELLOW</Button>
                                                        <Button onClick={() => { handleRating(task, 1) }} variant="contained">GREEN</Button>
                                                    </ButtonGroup>
                                                </Box>


                                            </Box>
                                        ))}


                                        <Box sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            width: "60%",
                                        }}>
                                            <TextField label="New Task"
                                                variant="outlined"
                                                color="secondary"
                                                sx={{
                                                    mx: 2
                                                }}
                                                onChange={e => setNewTask(e.target.value)}
                                                fullWidth
                                                value={newTask} />


                                            <Button variant="contained" onClick={handleNewTaskChange}>Add Task</Button>
                                        </Box>

                                    </Box>) : null}


                            </Box>


                            <Box sx={{
                                display: "flex",
                                flexDirection: "column",
                                pt: 5,
                                width: "100%",
                                justifyContent: 'center',
                                alignItems: "center"
                            }}>
                                <Typography variant="h3">Comments</Typography>

                                {(userId == userInstructorId) ? (
                                    <TableContainer component={Paper}>
                                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Task</TableCell>
                                                    <TableCell align="right">Rating</TableCell>
                                                    <TableCell align="right">Time Stamp</TableCell>
                                                    <TableCell align="right">Additional Feedback</TableCell>
                                                    <TableCell align="right">Edit Feedback</TableCell>
                                                    <TableCell align="right">Discussion</TableCell>
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
                                                            !commentEditable[idx] ?
                                                                (<TableCell align="right">
                                                                    {comment.feedback}
                                                                </TableCell>) :
                                                                (<TableCell align="right">
                                                                    <TextField label="Feedback"
                                                                        onChange={e => handleCommentFeedbackChange(e, idx)}
                                                                        variant="outlined"
                                                                        color="secondary"
                                                                        sx={{ mb: 3 }}
                                                                        fullWidth
                                                                        value={commentFeedbacks[idx]} />
                                                                </TableCell>)
                                                        }
                                                        <TableCell align="right">
                                                            {
                                                                !commentEditable[idx] ?
                                                                    (<Button onClick={() => handleEditButton(idx)}>
                                                                        <EditIcon />
                                                                    </Button>) :
                                                                    (<Button onClick={() => handleSubmitButton(idx)}>
                                                                        <DoneIcon />
                                                                    </Button>)
                                                            }

                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Button onClick={() => handleCommentChatButton(comment)}>
                                                                <InsertCommentIcon />
                                                            </Button>
                                                        </TableCell>
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

                                ) : (
                                    <TableContainer component={Paper}>
                                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Task</TableCell>
                                                    <TableCell align="right">Rating</TableCell>
                                                    <TableCell align="right">Time Stamp</TableCell>
                                                    <TableCell align="right">Additional Feedback</TableCell>
                                                    <TableCell align="right">Discussion</TableCell>
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
                                                        <TableCell align="right">
                                                            {comment.feedback}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Button onClick={() => handleCommentChatButton(comment)}>
                                                                <InsertCommentIcon />
                                                            </Button>
                                                        </TableCell>

                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}




                            </Box>

                        </Box>
                    </Box>
                </Grid>


            </Grid>


            <Modal
                open={commentChatOpen}
                onClose={handleCommentChatClose}
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
                            {commentToDisplay ? commentToDisplay.task : "No Comment"}
                        </Typography>
                        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                            Instructor Feedback: {commentToDisplay ? commentToDisplay.feedback : "No Feedback"}
                        </Typography>
                        <Grid item sx={{
                            width: "100%",
                        }}>
                            <List sx={{
                                height: '70vh',
                                overflowY: 'auto',
                            }}>
                                {commentToDisplay ? commentToDisplay.replies.map((reply, idx) => {
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
                                                    <ListItemText align="left" secondary={new Date(reply.createdAt * 1000).toISOString().substring(14, 19)}></ListItemText>
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
