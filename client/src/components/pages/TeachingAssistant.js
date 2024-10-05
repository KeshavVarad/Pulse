import React from 'react'
import { Box, Typography } from '@mui/material'
import ChatInterface from '../elements/ChatInterface'

export default function TeachingAssistant() {
    return (
        <Box sx={{
            minHeight: "100%",
            minWidth: "100%",
        }}>
            <Box sx={{
                minHeight: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 8,
                flexDirection: "column",
            }}>
                <Box sx={{
                    py: 5
                }}>
                    <Typography variant="h3"> Pulse Assistant </Typography>
                </Box>

                <ChatInterface />

            </Box>
        </Box>
    )
}
