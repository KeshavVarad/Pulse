
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import InstructorPractical from "./InstructorPractical.js";
import StudentPractical from "./StudentPractical.js";
import { Box } from "@mui/material";

export default function Practical() {


    const { currentUser } = useAuth();
    const userId = currentUser.uid;
    const params = useParams();
    const practicalId = params.id;


    const [videoId, setVideoId] = useState("")
    const [userCreator, setUserCreator] = useState(null)
    const [userParticipants, setUserParticipants] = useState([])
    const [userInstructorId, setUserInstructorId] = useState()
    const [tasks, setTasks] = useState([])
    const [comments, setComments] = useState([])
    const [commentFeedbacks, setCommentFeedbacks] = useState([])
    const [commentEditable, setCommentEditable] = useState([])



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
            {(userId == userInstructorId) ? (
                <InstructorPractical />
            ) : (<StudentPractical />)}
        </Box>


    )
}
