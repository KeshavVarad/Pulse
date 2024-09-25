import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const StudentTutorials = () => {
    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h5" gutterBottom>
                Student Dashboard
            </Typography>
            <Typography paragraph>
                Welcome to your Dashboard! Here, you can easily track the practicals you are currently enrolled in.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Key Features
            </Typography>
            <Typography paragraph>
                - <strong>Task Performance Section:</strong> Observe how your performance on various tasks has evolved over time. This visual representation will help you identify areas of strength and opportunities for improvement.
            </Typography>
            <Typography paragraph>
                - <strong>AI Teaching Assistant:</strong> On the left side, you’ll find the AI Teaching Assistant—your personal chatbot for any questions or clarifications about your practical performance. Feel free to ask anything your instructor may not have covered!
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Practical
            </Typography>
            <Typography paragraph>
                When you access a practical, you’ll be greeted with the <strong>Average Rating</strong> you have received at the top of the page.
            </Typography>
            <Typography paragraph>
                <strong>While Watching the Video:</strong>
            </Typography>
            <Typography paragraph>
                - <strong>Feedback Display:</strong> As you watch the practical video, feedback related to your performance will appear on the right side of the screen, synchronized with the video playback.
            </Typography>
            <Typography paragraph>
                - <strong>Timeline Navigation:</strong> Use the Timeline at the bottom of the video to jump directly to specific feedback moments. Just click on any point in the timeline to view the associated comments instantly.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Performance Insights
            </Typography>
            <Typography paragraph>
                At the bottom of the practical page, you can explore detailed statistics regarding your performance across different tasks.
            </Typography>

            <Divider sx={{ margin: '20px 0' }} />
            <Typography variant="h6" gutterBottom>
                Discussion Board
            </Typography>
            <Typography paragraph>
                Engage with your instructor and classmates on the Discussion Board. This is your space to ask questions, share comments, or discuss feedback you’ve received. Collaboration can enhance your learning experience!
            </Typography>
        </Box>
    );
};

export default StudentTutorials;
