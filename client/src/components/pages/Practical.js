
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";

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


export default function Practical() {


    const params = useParams();
    const practicalId = params.id

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
    const [userInstructors, setUserInstructors] = useState([])
    const [tasks, setTasks] = useState([])
    const [comments, setComments] = useState([])
    const [commentFeedbacks, setCommentFeedbacks] = useState([])
    const [commentEditable, setCommentEditable] = useState([])
    const [videoTimeStamp, setVideoTimeStamp] = useState(0)

    const [newTask, setNewTask] = useState("")

    const handleNewTaskChange = async () => {

        if (newTask == "") {
            return
        }

        var newTasks = tasks
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
            const res = await fetch(`http://localhost:3001/api/updatePractical/${practicalId}`, requestOptions);
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

            const createNewCommenOptions = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newComment)

            };

            const res = await fetch(`http://localhost:3001/api/newComment`, createNewCommenOptions);

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
            const updateRes = await fetch(`http://localhost:3001/api/updatePractical/${practicalId}`, requestOptions);
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
            const updateRes = await fetch(`http://localhost:3001/api/updateComment/${commentId}`, requestOptions);
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
            const deleteRes = await fetch(`http://localhost:3001/api/deleteComment/${commentId}`, deleteCommentRequestOptions);

            const updatePracticalRequestOptions = {
                method: "PUT",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ comments: oldCommentIds })
            };
            const updateRes = await fetch(`http://localhost:3001/api/updatePractical/${practicalId}`, updatePracticalRequestOptions);
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
                                
                                <Box sx={{
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
                                            pt:1,
                                            
                                        }}>
                                            <Box sx={{px:2}}>
                                            <Typography variant="h7">{task}</Typography>
                                            </Box>
                                            <Box sx = {{px:2}}>
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
                                <Typography variant="h3">Comments</Typography>

                                <TableContainer component={Paper}>
                                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Task</TableCell>
                                                <TableCell align="right">Rating</TableCell>
                                                <TableCell align="right">Time Stamp</TableCell>
                                                <TableCell align="right">Additional Feedback</TableCell>
                                                <TableCell align="right">Edit Feedback</TableCell>
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
                    </Box>
                </Grid>
            </Grid>
        </Box>




    )
}
