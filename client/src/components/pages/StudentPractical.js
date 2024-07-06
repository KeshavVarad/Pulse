
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import { useRef, useCallback } from "react";

import YouTube from "react-youtube"
import auth from "../../config/firebase.js";
import SendIcon from '@mui/icons-material/Send';
import InsertCommentIcon from "@mui/icons-material/InsertComment"

import { Typography, Box, Button, TextField, Grid, Modal, List, ListItem, ListItemText } from "@mui/material";


export default function StudentPractical() {

    const { currentUser } = useAuth();

    const userId = currentUser.uid;

    const params = useParams();
    const practicalId = params.id;

    const [player, setPlayer] = useState(null);
    const [videoId, setVideoId] = useState("")
    const [comments, setComments] = useState([])

    const [commentChatOpen, setCommentChatOpen] = useState(false)
    const [commentToDisplay, setCommentToDisplay] = useState()

    const [curMessage, setMessage] = useState("")

    const [currentCommentIndex, setCurrentCommentIndex] = useState(comments.length > 0 ? 0 : -1);

    const [autoMoveVideo, setAutoMoveVideo] = useState(false);

    const videoRef = useRef(null);


    const updateCurrentComment = (currentTime) => {
        if (comments.length === 0) return;

        const relevantCommentIndex = comments.findIndex(comment => comment.timestamp > currentTime);
        setCurrentCommentIndex(relevantCommentIndex === -1 ? comments.length - 1 : Math.max(0, relevantCommentIndex - 1));
    };


    const checkVideoTime = useCallback(() => {
        if (player && player.getCurrentTime) {
            const currentTime = player.getCurrentTime();
            updateCurrentComment(currentTime);
        }
    }, [player, updateCurrentComment]);


    const handleVideoChange = async (e) => {
        const curTime = await e.target.getCurrentTime();


        updateCurrentComment(curTime);
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

            const cur_user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${user.uid}`);
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
            await fetch(`${process.env.REACT_APP_API_HOST}/api/updateComment/${newCommentToDisplay.id}`, requestOptions);

            setCommentToDisplay(newCommentToDisplay)
            setMessage("")



        } catch (e) {
            console.log(e);
        }


    }


    const CurrentCommentDisplay = ({ comments, currentIndex, onNext, onPrevious, autoMove, onToggleAutoMove }) => {
        if (comments.length === 0) return <Typography>No comments available</Typography>;

        const comment = comments[currentIndex];

        if (!comment) return <Typography>Loading comments...</Typography>;

        return (
            <Box sx={{ p: 4, height: "85%", border: '1px solid #ccc', borderRadius: 1 }}>
                <Typography variant="h6">Current Feedback ({currentIndex + 1}/{comments.length})</Typography>
                <Typography><strong>Task:</strong> {comment.task}</Typography>
                <Typography><strong>Rating:</strong> {comment.rating}</Typography>
                <Typography><strong>Feedback:</strong> {comment.feedback}</Typography>
                <Typography><strong>Timestamp:</strong> {new Date(comment.timestamp * 1000).toISOString().substring(14, 19)}</Typography>
                <Box sx={{ display: "flex", pt: 2 }}>
                    <Typography>
                        <strong>Discussion:</strong>
                    </Typography>
                    <Button onClick={() => handleCommentChatButton(comment)}>
                        <InsertCommentIcon />
                    </Button>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={onPrevious} disabled={currentIndex === 0}>Previous</Button>
                    <Button onClick={onNext} disabled={currentIndex === comments.length - 1}>Next</Button>
                </Box>

                {/* <Box sx={{ mt: 2 }}>
                    <Button onClick={onToggleAutoMove}>{autoMove ? 'Disable' : 'Enable'} Auto Video Move</Button>
                </Box> */}
            </Box>
        );
    };

    const moveToNextComment = () => {
        const nextIndex = Math.min(currentCommentIndex + 1, comments.length - 1);
        setCurrentCommentIndex(nextIndex);
        if (autoMoveVideo && player) {
            player.seekTo(comments[nextIndex].timestamp);
        }
    };

    const moveToPreviousComment = () => {
        const prevIndex = Math.max(currentCommentIndex - 1, 0);
        setCurrentCommentIndex(prevIndex);
        // if (autoMoveVideo && player) {
        //     player.seekTo(comments[prevIndex].timestamp);
        // }
    };

    const toggleAutoMoveVideo = () => {
        setAutoMoveVideo(!autoMoveVideo);
    };

    useEffect(() => {
        async function fetchPractical() {

            const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/${practicalId}`);

            const practical = await practical_res.json()

            const videoParams = practical.video_link.split("/")
            setVideoId(videoParams[videoParams.length - 1])


            const commentIds = practical.comments
            const commentsData = []

            commentIds.map(async (commentId, idx) => {
                const commentRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`);
                const commentData = await commentRes.json()
                commentsData.push(commentData)

            })

            // let sortedComments = [...comments]
            commentsData.sort((a, b) => a.timestamp - b.timestamp);

            setComments(commentsData)



        }

        fetchPractical()

        let interval;
        if (player) {
            interval = setInterval(checkVideoTime, 250); // Check every second
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [])

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
                    py: 5
                }}>
                    <Typography variant="h4"> Practical </Typography>
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
                        <YouTube videoId={videoId} onStateChange={handleVideoChange} opts={video_opts} ref={videoRef} onReady={(event) => { setPlayer(event.target); }} />



                        <Box sx={{
                            width: "100%",
                            //bgcolor: 'primary.main',
                            alignContent: "center",
                            justifyContent: "center"
                        }}>
                            <CurrentCommentDisplay
                                comments={comments}
                                currentIndex={currentCommentIndex}
                                onNext={moveToNextComment}
                                onPrevious={moveToPreviousComment}
                            // autoMove={autoMoveVideo}
                            // onToggleAutoMove={toggleAutoMoveVideo}
                            />

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

                    {/*                                 
                                <Typography variant="h5">Comments</Typography>

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
                                    </TableContainer> */}





                </Box>

            </Box>


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
