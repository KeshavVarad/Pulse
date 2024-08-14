
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import { useRef, useCallback, useMemo } from "react";
import React from "react";
import YouTube from "react-youtube"
import auth from "../../config/firebase.js";
import SendIcon from '@mui/icons-material/Send';
import InsertCommentIcon from "@mui/icons-material/InsertComment"

import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Button, TextField, Grid, Modal, List, ListItem, ListItemText, Tooltip } from "@mui/material";
import { BarChart } from '@mui/x-charts/BarChart';
import StudentDisplayComments from "../elements/StudentDisplayComments.js"
import { grey } from "@mui/material/colors";

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

    const videoRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);

    const [tasks, setTasks] = useState([])


    const [taskNames, setTaskNames] = useState([])
    const [displayTask, setDisplayTask] = useState({ name: "", red_count: 0, yellow_count: 0, green_count: 0 })
    const [redCount, setRedCount] = useState(0)
    const [yellowCount, setYellowCount] = useState(0)
    const [greenCount, setGreenCount] = useState(0)


    const handleChangeDisplayTask = (e) => {
        
        var selected_task = e.target.value
        setCurrentTaskDiscussion( selected_task)
        setDisplayTask(selected_task)
       

        setRedCount( selected_task.red_count)
        setYellowCount( selected_task.yellow_count)
        setGreenCount( selected_task.green_count)
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

            setCurrentTaskDiscussion(newTaskToDisplay)
            setMessage("")



        } catch (e) {
            console.log(e);
        }


    }



    const CommentMarker = React.memo(({ comment, videoLength, onSeek, index }) => {
        const getColorForRating = (rating) => {
            switch (rating) {
                case 1: return '#ff4d4d';
                case 3: return '#ffd700';
                case 5: return '#66cc66';
                default: return '#888888';
            }
        };

        const handleClick = () => {

            onSeek(comment.timestamp - 5);
            setCurrentCommentIndex(index);

            var selected_task = tasks.find(task => task.name === comments[index].task)
            setCurrentTaskDiscussion( selected_task)
            setDisplayTask(selected_task)
        

            setRedCount( selected_task.red_count)
            setYellowCount( selected_task.yellow_count)
            setGreenCount( selected_task.green_count)
        }

        return (
            <Tooltip title={`${comment.task} (Rating: ${comment.rating})`} arrow>
                <Box
                    sx={{
                        position: 'absolute',
                        left: `${(comment.timestamp / videoLength) * 100}%`,
                        width: '15px',
                        height: '100%',
                        backgroundColor: getColorForRating(comment.rating),
                        transform: 'translate(-50%)',
                        cursor: 'pointer',
                        '&:hover': {
                            height: '100%',
                            width: "25px",
                        },
                        zIndex: 2,
                        borderRadius: "5px",
                    }}
                    onClick={handleClick}
                />
            </Tooltip>
        );
    });

    const CommentTimeline = ({ comments, videoLength, currentTime, onSeek, tasks }) => {
        const memoizedComments = useMemo(() => comments, [comments]);

        return (

            <Box sx={{ position: 'relative', width: '90%', height: `${(tasks.length * 40)}px`, backgroundColor: "#d3d3d3", overflow: 'hidden', borderRadius: "15px" }}>
                {tasks.map((task, taskIndex) => (
                    <Box
                        key={task.name}
                        sx={{
                            position: 'absolute',
                            top: `${(taskIndex * 40) + 5}px`,
                            left: 0,
                            width: '100%',
                            height: '30px',
                        }}>



                        <Box>




                        </Box>
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


                    </Box>

                ))}

                <Box
                    sx={{
                        position: 'absolute',
                        left: `${(currentTime / videoLength) * 50}%`,
                        top: 0,
                        width: `${(currentTime / videoLength) * 100}%`,
                        height: '100%',
                        backgroundColor: '#2196f3',
                        transform: 'translateX(-50%)',
                        zIndex: 0,
                    }}
                />

            </Box>
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

    }, [player])

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
                    <Typography variant="h4"> {practical_name} </Typography>
                    <Typography variant="h6"> Average Rating: {Math.round((avgRating + Number.EPSILON) * 100) / 100} </Typography>

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
                        width: "90%",
                        justifyContent: "space-between"

                    }}>
                        <YouTube videoId={videoId} opts={video_opts} ref={videoRef} onReady={(event) => { setPlayer(event.target); }} />



                        <Box sx={{
                            width: "100%",
                            //bgcolor: 'primary.main',
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
                        py: 3,
                        width: "100%",
                        justifyContent: 'center',
                        alignItems: "center"
                    }}>
                        <Typography variant="h5"  >Timeline</Typography>
                    </Box>
                    <Box sx ={{
                        display:"flex",
                        flexDirection: "row",
                        width : '100%'
                    }}>

                    <Box sx={{
                        minWidth:"5%",
                        height:"100%",
                        flexDirection: "column",
                    }}>
                        {tasks.map((task, taskIndex) => (
                            <Box
                            key={task.name}
                            sx={{
                                left: 0,
                                width: '100%',
                                height: '30px',
                                pt:"10px",
                            }}>
                                <Typography variant="h7">{task.name}</Typography>
                            </Box>
                        ))  
                        }
                        
                    </Box>

                    <CommentTimeline
                        comments={comments}
                        videoLength={player ? player.getDuration() : 0}
                        currentTime={currentTime}
                        onSeek={(timestamp) => player && player.seekTo(timestamp)}
                        tasks={tasks}
                    />
                    </Box>


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
                            <center><Typography variant="h5">Statistics</Typography></center>


                            <Box sx={{
                                display: "flex",
                                minWidth: "100%",

                            }}>
                                <BarChart
                                    xAxis={[{ scaleType: 'band', data: ["Red", "Yellow", "Green"], colorMap: { type: "ordinal", colors: ["red", "yellow", "green"] } }]}
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
                                    <Typography variant="h5">{currentTaskDiscussion.name} Discussion</Typography> :
                                    <Typography variant="h5">No Task Selected</Typography>
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
                                        border: '5px solid #ccc',
                                        borderRadius:2,
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
