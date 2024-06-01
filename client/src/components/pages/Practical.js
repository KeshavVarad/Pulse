
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";

import YouTube from "react-youtube"
import { Typography, Box, Button, TextField } from "@mui/material"
import e from "cors";

export default function Practical() {


    const params = useParams();
    const id = params.id

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

    const [newTask, setNewTask] = useState("")

    const handleNewTaskChange = async () => {
        console.log("new task: " + newTask)
    }

    useEffect(() => {
        async function fetchPractical() {

            const practical_res = await fetch(`http://localhost:3001/api/practical/${id}`);
            const practical = await practical_res.json()

            const videoParams = practical.video_link.split("/")
            setVideoId(videoParams[videoParams.length - 1])

            const tasks = practical.tasks
            setTasks(tasks)

            const commentIds = practical.comments
            const commentsData = []

            commentIds.map(async (commentId) => {
                const commentRes = await fetch(`http://localhost:3001/api/comment/${commentId}`);
                const commentData = await commentRes.json()
                commentsData.push(commentData)
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
            width: "100%",
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
                <YouTube videoId={videoId} />
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
                            display: "flex",
                            justifyContent: "space-between",
                            width: "75%"
                        }}>
                            <Typography variant="text">{task}</Typography>

                            <Box>

                                <Button variant="contained" color="primary">RED</Button>
                                <Button variant="contained" color="secondary">GREEN</Button>
                                <Button variant="contained">BLUE</Button>
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

                <Box sx={{
                    display: "flex",
                    width: "50%",
                    justifyContent: "space-between",
                    mx: 5
                }}>
                    <Typography variant="h5" fontWeight="bold">
                        Task
                    </Typography>

                    <Typography variant="h5" fontWeight="bold">
                        Rating
                    </Typography>

                    <Typography variant="h5" fontWeight="bold">
                        Time Stamp (seconds)
                    </Typography>

                </Box>
                {comments.map((comment) => (
                    <Box sx={{
                        display: "flex",
                        width: "50%",
                        justifyContent: "space-between",
                        mx: 5
                    }}>
                        <Typography variant="h5">
                            {comment.task}
                        </Typography>

                        <Typography variant="h5">
                            {comment.rating}
                        </Typography>

                        <Typography variant="h5">
                            {comment.timestamp}
                        </Typography>

                    </Box>
                ))}
            </Box>

        </Box>
    )
}
