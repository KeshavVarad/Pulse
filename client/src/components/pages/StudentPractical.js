
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import { useRef, useCallback, useMemo } from "react";
import React from "react";
import YouTube from "react-youtube"
import { auth } from "../../config/firebase.js";
import SendIcon from '@mui/icons-material/Send';
import InsertCommentIcon from "@mui/icons-material/InsertComment"

import { v4 as uuidv4 } from 'uuid';
import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Button, TextField, Grid, Modal, List, ListItem, ListItemText, Tooltip, TableContainer, Table, TableBody, TableCell, TableRow, TableHead, ButtonGroupContext } from "@mui/material";
import { BarChart } from '@mui/x-charts/BarChart';
import StudentDisplayComments from "../elements/StudentDisplayComments.js"
import { grey } from "@mui/material/colors";

import GCloudVideoPlayer from "../elements/GCloudVideoPlayer.js";


export default function StudentPractical() {

    const { currentUser } = useAuth();

    const userId = currentUser.uid;

    const params = useParams();
    const practicalId = params.id;

    const [player, setPlayer] = useState(null);
    const [videoId, setVideoId] = useState("");
    const [comments, setComments] = useState([]);
    const [avgRating, setAvgRating] = useState(0);

    const [commentChatOpen, setCommentChatOpen] = useState(false);
    const [commentToDisplay, setCommentToDisplay] = useState();

    const [curMessage, setMessage] = useState("");

    const [currentCommentIndex, setCurrentCommentIndex] = useState(comments.length > 0 ? 0 : -1);
    const [currentTaskDiscussion, setCurrentTaskDiscussion] = useState(null);

    const [practical_name, setPracticalName] = useState("");
    const [instructorId, setInstructorId] = useState("");
    const [participants, setParticipants] = useState([]);

    const videoRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);

    const [tasks, setTasks] = useState([])


    const [taskNames, setTaskNames] = useState([])
    const [displayTask, setDisplayTask] = useState({ name: "", red_count: 0, yellow_count: 0, green_count: 0 })
    const [redCount, setRedCount] = useState(0)
    const [yellowCount, setYellowCount] = useState(0)
    const [greenCount, setGreenCount] = useState(0)

    // GCloud specific state variables
    const [gcloudVideoTimeStamp, setGcloudVideoTimeStamp] = useState(0);
    const [gcloudPlayer, setGcloudPlayer] = useState(null);
    const gcloudVideoRef = useRef(null);
    const [videoLink, setVideoLink] = useState("");

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


    const handleChangeDisplayTask = (e) => {

        var selected_task = e.target.value
        setCurrentTaskDiscussion(selected_task)
        setDisplayTask(selected_task)


        setRedCount(selected_task.red_count)
        setYellowCount(selected_task.yellow_count)
        setGreenCount(selected_task.green_count)
    }



    const updateCurrentComment = (currentTime) => {
        if (comments.length === 0) return;

        const relevantCommentIndex = comments.findIndex(comment => comment.timestamp > currentTime);
        setCurrentCommentIndex(relevantCommentIndex === -1 ? comments.length - 1 : Math.max(0, relevantCommentIndex - 1));
    };


    const checkVideoTime = useCallback(() => {
        if (player && player.getCurrentTime) {
            const time = player.getCurrentTime();
            setCurrentTime(time);
        }
    }, [player]);


    const handleCommentChatButton = (comment) => {
        setCommentToDisplay(comment)
        setCommentChatOpen(true)
    }

    const handleCommentChatClose = () => {
        setCommentToDisplay(null)
        setCommentChatOpen(false)
    }

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

    const handleMessageInput = async () => {
        if (curMessage == "") {
            return
        }


        let newTaskToDisplay = currentTaskDiscussion
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
            newTasks[tasks.indexOf(currentTaskDiscussion)] = newTaskToDisplay


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
                if (participant == currentUser.uid) {
                    return
                }
                createNotification({
                    id: uuidv4(),
                    task: currentTaskDiscussion.name,
                    user_id: participant,
                    message: `${cur_user_data.real_name} has posted a new comment in the ${currentTaskDiscussion.name} discussion board for ${practical_name}.`,
                    timestamp: new Date().toISOString(), // Or however you want to handle timestamps
                    read_status: false,
                    practical_id: practicalId,
                })
            })

            createNotification({
                id: uuidv4(),
                task: currentTaskDiscussion.name,
                user_id: instructorId,
                message: `${cur_user_data.real_name} has posted a new comment in the ${currentTaskDiscussion.name} discussion board for ${practical_name}.`,
                timestamp: new Date().toISOString(), // Or however you want to handle timestamps
                read_status: false,
                practical_id: practicalId,
            })

            setCurrentTaskDiscussion(newTaskToDisplay)
            setMessage("")



        } catch (e) {
            console.log(e);
        }


    }

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



    const CommentMarker = React.memo(({ comment, videoLength, onSeek, index }) => {
        const getColorForRating = (rating) => {
            switch (rating) {
                case 1: return 'red.main';
                case 3: return 'yellow.main';
                case 5: return 'green.main';
                default: return '#888888';
            }
        };

        const handleClick = () => {

            onSeek(comment.timestamp - 5);
            setCurrentCommentIndex(index);

            var selected_task = tasks.find(task => task.name === comments[index].task)
            setCurrentTaskDiscussion(selected_task)
            setDisplayTask(selected_task)


            setRedCount(selected_task.red_count)
            setYellowCount(selected_task.yellow_count)
            setGreenCount(selected_task.green_count)
        }

        return (

            <Box
                sx={{
                    position: "absolute",
                    left: `${(comment.timestamp / videoLength) * 100}%`,
                    width: '10px',
                    height: '100%',
                    backgroundColor: getColorForRating(comment.rating),
                    transform: 'translate(-50%)',
                    cursor: 'pointer',
                    '&:hover': {
                        height: '100%',
                        width: "20px",
                    },
                    zIndex: 2,
                    borderRadius: "5px",
                    opacity: 0.9,
                }}
                onClick={handleClick}
            />

        );
    });

    const CommentTimeline = ({ comments, videoLength, currentTime, onSeek, tasks }) => {
        const memoizedComments = useMemo(() => comments, [comments]);
        return (

            <Box sx={{ minWidth: "95%", position: 'relative' }}>

                <TableContainer>
                    <Table sx={{ minWidth: "100%" }} aria-label="simple table">
                        <TableHead>

                        </TableHead>
                        <TableBody>
                            {tasks.map((task) => (
                                <TableRow sx={{
                                }}>
                                    <TableCell sx={{
                                        maxWidth: "150px"
                                    }}>
                                        <Typography variant="h7" sx={{
                                            textOverflow: "ellipsis",
                                            maxWidth: "60px"
                                        }}>{task.name}</Typography>

                                    </TableCell>
                                    <TableCell sx={{
                                        width: "100%",
                                        p: 0
                                    }}>
                                        <Box
                                            key={task.name}
                                            sx={{
                                                position: "relative",
                                                width: "100%",
                                                height: "50px",
                                                backgroundColor: "primary.grey",
                                                p: 0,
                                                left: 0,
                                            }}>
                                            {memoizedComments
                                                .filter(comment => comment.task === task.name)
                                                .map((comment, index) => (
                                                    <CommentMarker
                                                        key={index}
                                                        comment={comment}
                                                        videoLength={videoLength}
                                                        onSeek={onSeek}
                                                        index={comments.indexOf(comment)}
                                                    />
                                                ))}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    left: `${(currentTime / videoLength) * 50}%`,
                                                    top: 0,
                                                    width: `${(currentTime / videoLength) * 100}%`,
                                                    height: '100%',
                                                    backgroundColor: 'primary.light',
                                                    transform: 'translateX(-50%)',
                                                    zIndex: 1,
                                                }}
                                            />

                                        </Box>


                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>


            // <Box
            //     sx={{
            //         position: 'absolute',
            //         left: `${(currentTime / videoLength) * 50}%`,
            //         top: 0,
            //         width: `${(currentTime / videoLength) * 100}%`,
            //         height: '100%',
            //         backgroundColor: 'primary.light',
            //         transform: 'translateX(-50%)',
            //         zIndex: 0,
            //     }}
            // />

        );
    };


    const moveToNextComment = () => {
        const nextIndex = Math.min(currentCommentIndex + 1, comments.length - 1);
        setCurrentCommentIndex(nextIndex);

    };

    const moveToPreviousComment = () => {
        const prevIndex = Math.max(currentCommentIndex - 1, 0);
        setCurrentCommentIndex(prevIndex);

    };



    useEffect(() => {
        async function fetchPractical() {

            const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${practicalId}`);

            const practical = await practical_res.json()

            setAvgRating(practical.avg_rating)
            setTasks(practical.tasks)
            setParticipants(practical.user_participants)
            setInstructorId(practical.user_instructor_id)
            setVideoLink(practical.video_link)

            let newTaskNames = []

            practical.tasks.map((t) => {
                newTaskNames.push(t.name)
            })

            setTaskNames(newTaskNames)



            const videoParams = practical.video_link.split("/")
            setVideoId(videoParams[videoParams.length - 1])

            setPracticalName(practical.practical_name)
            const commentIds = practical.comments
            const commentsData = []

            commentIds.map(async (commentId, idx) => {
                const commentRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`);
                const commentData = await commentRes.json()
                commentsData.push(commentData)
                commentsData.sort((a, b) => a.timestamp - b.timestamp);

                setComments(commentsData)

            })

            if (comments.length > 0) {
                setCurrentCommentIndex(0)
            }


            // setComments(commentsData)
        }

        fetchPractical()


        let interval;
        if (player) {
            interval = setInterval(checkVideoTime, 500); // Check every second
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };

    }, [player, gcloudPlayer])

    const video_opts = {
        height: '468',
        width: '768',
        playerVars: {
            autoplay: 1,
            controls: 1,
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
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 5
                }}>
                    <Typography variant="h3"> {practical_name} </Typography>
                    <Typography variant="h5"> Average Rating: {Math.round((avgRating + Number.EPSILON) * 100) / 100} </Typography>

                </Box>


                <Box sx={{
                    display: "flex",
                    width: "100%",
                    alignContent: "center",
                    alignSelf: "center",
                    justifyContent: "center"
                }}>
                    <Box sx={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "space-between"

                    }}>
                        {(getVideoSourceType(videoLink) === "youtube") ?
                            (<YouTube videoId={videoId} opts={video_opts} ref={videoRef} onReady={(event) => { setPlayer(event.target); }} />) :
                            (<GCloudVideoPlayer
                                videoLink={videoLink}
                                onPlayerReady={setGcloudPlayer}
                                onVideoChange={handleGCloudVideoChange}
                                ref={gcloudVideoRef}
                            />)}

                        <Box sx={{
                            width: "100%",
                            height: "98%",
                            alignContent: "center",
                            justifyContent: "center"
                        }}>

                            <StudentDisplayComments
                                comments={comments}
                                currentIndex={currentCommentIndex}
                                onNext={moveToNextComment}
                                onPrevious={moveToPreviousComment}
                                onCommentChat={handleCommentChatButton}
                            />

                        </Box>
                    </Box>


                </Box>


                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    justifyContent: 'center',
                    alignItems: "center"
                }}>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        py: 5,
                        width: "100%",
                        justifyContent: 'center',
                        alignItems: "center"
                    }}>
                        <Typography variant="h4"  >Timeline</Typography>
                    </Box>

                    <CommentTimeline
                        comments={comments}
                        videoLength={(getVideoSourceType(videoLink) === "youtube") ? (player ? player.getDuration() : 0) : (gcloudPlayer ? gcloudPlayer.getDuration() : 0)}
                        currentTime={(getVideoSourceType(videoLink) === "youtube") ? currentTime : gcloudVideoTimeStamp}
                        onSeek={(getVideoSourceType(videoLink) === "youtube") ? ((timestamp) => player && player.seekTo(timestamp)) : ((timestamp) => gcloudPlayer && gcloudPlayer.seekTo(timestamp))}
                        tasks={tasks}
                    />





                    {/* <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        width: '100%'
                    }}>

                        <Box sx={{
                            minWidth: "5%",
                            height: "100%",
                            flexDirection: "column",
                        }}>
                            {tasks.map((task, taskIndex) => (
                                <Box
                                    key={task.name}
                                    sx={{
                                        left: 0,
                                        width: '100%',
                                        height: '30px',
                                        pt: "10px",
                                    }}>
                                    <Typography variant="h7">{task.name}</Typography>
                                </Box>
                            ))
                            }

                        </Box>


                    </Box> */}

                    <Box sx={{
                        display: "flex",
                        width: "20%",
                        height: "100%",
                        alignContent: "center",
                        alignItems: "center",
                        py: 4,
                    }}>

                        <FormControl fullWidth>
                            <InputLabel id="demo-simple-select-label">Task</InputLabel>
                            <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={displayTask}
                                label="Task"
                                onChange={handleChangeDisplayTask}
                            >
                                {tasks.map((t, idx) => {
                                    return (<MenuItem key={idx} value={t}>{t.name}</MenuItem>)
                                })}
                            </Select>
                        </FormControl>
                    </Box>




                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        width: "100%"
                    }}>

                        <Box sx={{
                            display: "flex",
                            width: "50%",
                            flexDirection: "column",
                            pt: 3

                        }}>
                            <center><Typography variant="h4">Statistics</Typography></center>


                            <Box sx={{
                                display: "flex",
                                minWidth: "100%",

                            }}>
                                <BarChart
                                    xAxis={[{ scaleType: 'band', data: ["Red", "Yellow", "Green"], colorMap: { type: "ordinal", colors: ['#f94144', "#FFE14D", "#84C453"] } }]}
                                    series={[{ data: [redCount, yellowCount, greenCount] }]}
                                    width={600}
                                    height={300} />

                            </Box>
                        </Box>

                        <Box sx={{
                            display: "flex",
                            width: "50%",
                            justifyItems: "center",
                            pt: 3,
                            flexDirection: "column"
                        }}>
                            <center>
                                {currentTaskDiscussion ?
                                    <Typography variant="h4">{currentTaskDiscussion.name} Discussion</Typography> :
                                    <Typography variant="h4">No Task Selected</Typography>
                                }
                            </center>

                            {currentTaskDiscussion ?
                                <Box sx={{
                                    p: 4,
                                }}>
                                    <Box sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        width: "100%",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "primary.grey",
                                        borderRadius: 2,
                                    }}>
                                        <Grid item sx={{
                                            width: "100%",
                                        }}>
                                            <List sx={{
                                                height: '20vh',
                                                overflowY: 'auto',
                                            }}>
                                                {currentTaskDiscussion ? currentTaskDiscussion.replies.map((reply, idx) => {
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

                                        {currentTaskDiscussion ?
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
                                            </Box> :
                                            null}



                                    </Box>

                                </Box> :
                                <Box></Box>

                            }

                        </Box>

                    </Box>
                </Box>
            </Box>
        </Box >

    )
}
