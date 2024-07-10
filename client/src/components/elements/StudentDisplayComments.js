import React, { useEffect, useState } from 'react'
import { Typography, Box, Button } from '@mui/material';
import InsertCommentIcon from "@mui/icons-material/InsertComment"

export default function StudentDisplayComments({ comments, currentIndex, onNext, onPrevious, onCommentChat }) {



    if (comments.length === 0) return <center><Typography variant="h5">No comments available</Typography></center>;

    const comment = comments[currentIndex];

    if (!comment) return <center><Typography variant="h5">No comments available</Typography></center>;

    return (
        <Box sx={{
            display:"flex",
            flexDirection:"column",
             p: 4, 
             height: "84%", 
             border: '5px solid #ccc', 
             borderRadius: 2, 
             alignContent:"space-evenly",
             justifyContent:"space-evenly",
             }}>
            
            <Typography variant="h6" >Current Feedback ({currentIndex + 1}/{comments.length})</Typography>
            <Typography variant="h7"><strong>Task:</strong> {comment.task}</Typography>
            <Typography variant="h7"><strong>Rating:</strong> {comment.rating}</Typography>
            <Typography variant="h7"><strong>Feedback:</strong> {comment.feedback}</Typography>
            <Typography variant="h7"><strong>Timestamp:</strong> {new Date(comment.timestamp * 1000).toISOString().substring(14, 19)}</Typography>
            <Box sx={{ display: "flex", pt: 2 }}>
                <Typography variant="h6">
                    <strong>Discussion:</strong>
                </Typography>
                <Button onClick={() => onCommentChat(comment)}>
                    <InsertCommentIcon />
                </Button>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={onPrevious} disabled={currentIndex === 0}>Previous</Button>
                <Button onClick={onNext} disabled={currentIndex === comments.length - 1}>Next</Button>
            </Box>


        </Box>
    );
};