
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

            const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${practicalId}`);

            const practical = await practical_res.json()

            const videoParams = practical.video_link.split("/")
            setVideoId(videoParams[videoParams.length - 1])

            const tasks = practical.tasks
            setTasks(tasks)

            const commentIds = practical.comments

            const commentsData = await Promise.all(
                commentIds.map(async (commentId) => {
                    try {
                        const commentRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`);
                        if (!commentRes.ok) {
                            throw new Error(`HTTP error! status: ${commentRes.status}`);
                        }
                        return await commentRes.json();
                    } catch (error) {
                        console.warn(`Failed to fetch comment with ID ${commentId}:`, error);
                        return null; // Return null for invalid comments
                    }
                })
            );

            // Filter out invalid (null) comments
            const validComments = commentsData.filter((comment) => comment !== null);

            // Sort valid comments by timestamp
            validComments.sort((a, b) => a.timestamp - b.timestamp);

            // Update state with the fully fetched and sorted comments
            setComments(validComments);

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
