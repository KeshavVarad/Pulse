import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, Typography, List, ListItem, Box, Button,Link } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown
import { useParams } from 'react-router-dom';
import CustomImage from './CustomImage';
import { useTheme } from '@mui/material/styles';
import  {Link as Link_react} from 'react-router-dom';

const MarkdownDisplay = () => {
    const { role, tutorial } = useParams();
    const tutorialPath = `/user_guides/${role}/${tutorial}/${tutorial}.md`;

    const [markdownContent, setMarkdownContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState(false); // New state to track image loading status
    const theme = useTheme(); // Accessing the Material UI theme

    // Fetch Markdown content
    useEffect(() => {
        const fetchMarkdown = async () => {
            const response = await fetch(tutorialPath);
            const text = await response.text();
            setMarkdownContent(text);
            setLoading(false); // Set loading to false after content is fetched
        };

        fetchMarkdown();
    }, [tutorialPath]);

    // Check if all images have loaded
    useEffect(() => {
        const images = document.querySelectorAll('img');
        let imageLoadPromises = Array.from(images).map((img) => {
            if (img.complete) {
                return Promise.resolve();
            } else {
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Ensure that errors are handled too
                });
            }
        });

        Promise.all(imageLoadPromises).then(() => {
            setImagesLoaded(true); // Set images loaded to true after all images are loaded
        });
    }, [markdownContent]);

    // Only show content after both markdown and images have loaded
    const isLoading = loading || !imagesLoaded;

    return (
        
        <Container maxWidth="md" sx={{ pt: 10, pb: 5 }}>
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box>
                    
                    <Button component={Link_react} to={`/user_guides/${role}/`} sx={{textTransform: 'none', 
                '&:hover': {
                    textDecoration: 'underline', // Adds underline on hover
                    },
                position:"absolute",
                top:80,
                }}>
                Back to {role.charAt(0).toUpperCase() + role.slice(1)} Guides
                </Button>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ children }) => (
                            <Typography variant="h3" gutterBottom sx={{ mt: theme.spacing(4), mb: theme.spacing(2) }}>
                                {children}
                            </Typography>
                        ),
                        h2: ({ children }) => (
                            <Typography variant="h4" gutterBottom sx={{ mt: theme.spacing(3), mb: theme.spacing(2) }}>
                                {children}
                            </Typography>
                        ),
                        h3: ({ children }) => (
                            <Typography variant="h5" gutterBottom sx={{ mt: theme.spacing(2), mb: theme.spacing(1.5) }}>
                                {children}
                            </Typography>
                        ),
                        p: ({ children }) => (
                            <Typography variant="body1" paragraph sx={{ mt: theme.spacing(1.5), mb: theme.spacing(1.5) }}>
                                {children}
                            </Typography>
                        ),
                        a: ({ href, children }) => (
                            <Link href={href} color="primary" sx={{ textDecoration: 'none' }}>
                                {children}
                            </Link>
                        ),
                        ul: ({ children }) => (
                            <List sx={{ listStyleType: 'disc', pl: theme.spacing(4), mt: theme.spacing(2) }}>
                                {children}
                            </List>
                        ),
                        li: ({ children }) => (
                            <ListItem sx={{ display: 'list-item', paddingLeft: 0 }}>
                                {children}
                            </ListItem>
                        ),
                        img: ({ node, ...props }) => (
                            <Box
                                component="img"
                                src={props.src}
                                alt={props.alt}
                                sx={{
                                    maxWidth: '100%',
                                    marginTop: theme.spacing(2),
                                    marginBottom: theme.spacing(2),
                                    display: 'block',
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                }}
                            />
                        ),
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
                </Box>
            )}
        </Container>
    );
};

export default MarkdownDisplay;
