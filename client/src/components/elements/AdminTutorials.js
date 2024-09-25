import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const AdminTutorials = () => {
    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h5" gutterBottom>
                Admin Dashboard
            </Typography>
            <Typography paragraph>
                Welcome to your Admin Dashboard! Here, you can manage all members of your organization with ease.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Key Features
            </Typography>
            <Typography paragraph>
                - <strong>Member Management:</strong> View all current members of your school. To invite a new user, simply click the <strong>Invite</strong> button, enter the email address of the person you wish to invite, and create the invitation.
            </Typography>
            <Typography paragraph>
                - <strong>Registration Process:</strong> Once an invitation is sent, the invited user can create an account by clicking the <strong>Register User</strong> button and filling out their information.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Registration
            </Typography>
            <Typography paragraph>
                For users to register successfully, they must complete all required fields.
            </Typography>
            <Typography paragraph>
                - <strong>Graduation Year:</strong> This field is mandatory only for students and does not apply to instructors.
            </Typography>
            <Typography paragraph>
                - <strong>Email Consistency:</strong> Ensure that the email used for registration matches the one provided in the invitation from the admin.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Creating a Practical
            </Typography>
            <Typography paragraph>
                To create a new practical, navigate to the <strong>Make Practical</strong> tab on the left. Here’s what you need to do:
            </Typography>
            <Typography paragraph>
                1. <strong>Informative Title:</strong> Provide a clear and descriptive name for the practical.
            </Typography>
            <Typography paragraph>
                2. <strong>YouTube Video Link:</strong> Include a link to the relevant YouTube video. Remember, only enter the portion of the link before the "?" mark. For example, if the full URL is <a href="https://youtu.be/ZAqIosdDnwk?si=5kJSLp72iu03-eKFbr28" target="_blank" rel="noopener noreferrer">https://youtu.be/ZAqIosdDnwk?si=5kJSLp72iu03-eKFbr28</a>, you should enter <a href="https://youtu.be/ZAqIosdDnwk" target="_blank" rel="noopener noreferrer">https://youtu.be/ZAqIosdDnwk</a>.
            </Typography>
            <Typography paragraph>
                3. <strong>Participant Emails:</strong> Enter the emails of the students participating in the practical.
            </Typography>
            <Typography paragraph>
                4. <strong>Instructor Email:</strong> Include the email of the instructor overseeing the practical.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Analytics
            </Typography>
            <Typography paragraph>
                The <strong>Analytics Dashboard</strong> provides insights into how different cohorts within your school are performing over time.
            </Typography>
            <Typography paragraph>
                <strong>Features:</strong>
            </Typography>
            <Typography paragraph>
                - <strong>Cohort Selection:</strong> Easily select different cohorts and tasks to view aggregated performance data over the years.
            </Typography>
            <Typography paragraph>
                - <strong>Demo Mode:</strong> If you would like to see a demonstration of the analytics features, simply click the demo switch and reload the page.
            </Typography>
        </Box>
    );
};

export default AdminTutorials;
