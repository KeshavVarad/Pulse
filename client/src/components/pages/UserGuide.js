import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InstructorTutorials from '../elements/InstructorTutorials';
import StudentTutorials from '../elements/StudentTutorials';
import AdminTutorials from '../elements/AdminTutorials';

const UserGuide = () => {
    return (
        <Box sx={{ padding: 3, paddingTop: 12, mx:10}}> {/* Increased paddingTop value */}
            <Typography variant="h4" align="center" gutterBottom>
                User Guide
            </Typography>

            {/* Instructor Tutorials */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="instructor-content" id="instructor-header">
                    <Typography variant="h5">Instructor Tutorials</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <InstructorTutorials />
                </AccordionDetails>
            </Accordion>

            {/* Student Tutorials */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="student-content" id="student-header">
                    <Typography variant="h5">Student Tutorials</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <StudentTutorials />
                </AccordionDetails>
            </Accordion>

            {/* Admin Tutorials */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="admin-content" id="admin-header">
                    <Typography variant="h5">Admin Tutorials</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <AdminTutorials />
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default UserGuide;
