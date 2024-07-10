import React, { useEffect, useState } from 'react'
import { Typography, Box, Button } from '@mui/material';
import InsertCommentIcon from "@mui/icons-material/InsertComment"

export default function StudentDisplayComments({ comments, currentIndex, onNext, onPrevious, onCommentChat }) {



    if (comments.length === 0) return <center><Typography variant="h5">No comments available</Typography></center>;

    const comment = comments[currentIndex];

    if (!comment) return <center><Typography variant="h5">No comments available</Typography></center>;

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