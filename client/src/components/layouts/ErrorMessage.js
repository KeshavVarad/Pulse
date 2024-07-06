import React from 'react'
import { useAuth } from "../../contexts/AuthContext";
import ClearIcon from '@mui/icons-material/Clear';
import { Box, Typography } from '@mui/material';

export default function ErrorMessage() {
    const { error, setError } = useAuth();

    return (
        error && (
            <Box sx={{
                display: "flex",
                justifyContent: "center",
            }}>
                <Box sx={{
                    maxWidth: "md",
                    width: "100%",
                    background: "red",
                    p: 4,
                    mt: 4,
                    zIndex: 1100
                }}>

                    <Box sx={{
                        display: "flex"
                    }}>
                        <Box sx={{
                            flexShrink: 0
                        }}>
                            <ClearIcon
                                onClick={() => setError("")}
                                aria-hidden="true"
                            />
                        </Box>
                        <Box sx={{
                            ml: 3,
                        }}>
                            <Typography variant="h5">
                                Error: {error}
                            </Typography>
                        </Box>
                    </Box>

                </Box>
            </Box>
        )
    );
};