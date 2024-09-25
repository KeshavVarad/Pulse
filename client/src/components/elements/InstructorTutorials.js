import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const InstructorTutorials = () => {
    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h5" gutterBottom>
                Instructor Dashboard
            </Typography>
            <Typography paragraph>
                Welcome to your Instructor Dashboard! Here, you can easily manage the practicals you are currently providing feedback on.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Key Features
            </Typography>
            <Typography paragraph>
                - <strong>Current Practicals:</strong> View the practicals you are giving feedback on, along with the average performance of your students on assigned tasks.
            </Typography>
            <Typography paragraph>
                - <strong>Performance Trends:</strong> Monitor how student performance has evolved over time, giving you insights into their progress.
            </Typography>
            <Typography paragraph>
                - <strong>Settings Management:</strong> Click the <strong>Settings</strong> button next to each practical to manage participants. You can add or remove students and even delete the practical if needed.
            </Typography>
            <Typography paragraph>
                <strong>Important:</strong> After making any updates, remember to click the <strong>Update Practical</strong> button to save your changes.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Creating a Practical
            </Typography>
            <Typography paragraph>
                To create a new practical, navigate to the <strong>Make Practical</strong> tab on the left side of the dashboard. Here’s what you need to do:
            </Typography>
            <Typography paragraph>
                1. <strong>Informative Title:</strong> Enter a clear and descriptive name for the practical.
            </Typography>
            <Typography paragraph>
                2. <strong>YouTube Video Link:</strong> Include a link to the relevant YouTube video. Make sure to enter only the portion of the link before the "?" mark. For example, if the full URL is <a href="https://youtu.be/ZAqIosdDnwk?si=5kJSLp72iu03-eKFbr28" target="_blank" rel="noopener noreferrer">https://youtu.be/ZAqIosdDnwk?si=5kJSLp72iu03-eKFbr28</a>, you should use <a href="https://youtu.be/ZAqIosdDnwk" target="_blank" rel="noopener noreferrer">https://youtu.be/ZAqIosdDnwk</a>.
            </Typography>
            <Typography paragraph>
                3. <strong>Participant Emails:</strong> Enter the emails of the students participating in the practical.
            </Typography>
            <Typography paragraph>
                4. <strong>Your Email:</strong> Provide your email as the instructor for this practical.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Analytics
            </Typography>
            <Typography paragraph>
                The <strong>Analytics Dashboard</strong> provides valuable insights into the performance of different cohorts within your school over time.
            </Typography>
            <Typography paragraph>
                <strong>Features:</strong>
            </Typography>
            <Typography paragraph>
                - <strong>Cohort and Task Selection:</strong> Easily select various cohorts and tasks to view their aggregated performance data over the years.
            </Typography>
            <Typography paragraph>
                - <strong>Demo Mode:</strong> If you’d like to see a demonstration of the analytics features, click the demo switch and reload the page.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Shortcuts
            </Typography>
            <Typography paragraph>
                To streamline your feedback process, you can create shortcuts for frequently used comments in the <strong>Account</strong> page of the website.
            </Typography>
            <Typography paragraph>
                - For example, you can create a shortcut like "wdym" that automatically expands to "What do you mean?" When typing a comment, simply type "wdym" followed by a space, and the phrase will replace it for you!
            </Typography>
        </Box>
    );
};

export default InstructorTutorials;