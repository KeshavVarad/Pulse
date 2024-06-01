
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";

import YouTube from "react-youtube"
import { Typography, Box } from "@mui/material"

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

    useEffect(() => {
        async function fetchPractical() {

            const practical_res = await fetch(`http://localhost:3001/api/practical/${id}`);
            const practical = await practical_res.json()

            const videoParams = practical.video_link.split("/")
            setVideoId(videoParams[videoParams.length - 1])

            const user_creator_id = practical.user_creator
            const creator_res = await fetch(`http://localhost:3001/api/user/${user_creator_id}`);
            const userCreator = await creator_res.json()
            setUserCreator(userCreator)
        }

        fetchPractical()
    }, [])

    console.log(videoId)

    return (
        <Box sx={{
            minHeight: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 12,
            px: 4,
            flexDirection: "column"
        }}>
            <Box sx={{
                my: 5,
                width: "100%"
            }}>
                <Typography variant="h3"> Practical </Typography>
            </Box>

            <Box sx={{
                display: "flex",
            }}>
                <YouTube videoId={videoId} />
                <Box sx={{
                    backgroundColor: "red"
                }}>
                    <Typography>
                        Grading
                    </Typography>
                </Box>
            </Box>

        </Box>
    )
}
