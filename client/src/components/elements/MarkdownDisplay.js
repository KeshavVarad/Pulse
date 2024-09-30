import React, { useEffect, useState } from 'react';
import { Container, CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown
import { useParams } from 'react-router-dom';
import CustomImage from './CustomImage';

const MarkdownDisplay = () => {
    const { role, tutorial } = useParams();
    const tutorialPath = `/user_guides/${role}/${tutorial}/${tutorial}.md`;

    const [markdownContent, setMarkdownContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarkdown = async () => {
            const response = await fetch(tutorialPath);
            const text = await response.text();
            setMarkdownContent(text);
            setLoading(false); // Set loading to false after content is fetched
        };

        fetchMarkdown();
    }, [tutorialPath]);

    // Check if images are loaded, if not reload the page
    useEffect(() => {
        const images = document.querySelectorAll('img');
        const allImagesLoaded = Array.from(images).every(img => img.complete);

        if (!allImagesLoaded && !loading) {
            window.location.reload(); // Force reload if images are not loaded
        }
    }, [markdownContent, loading]);

    return (
        <Container sx={{ pt: 10 }}>
            {loading ? (
                <CircularProgress /> // Show a loading spinner while fetching
            ) : (
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        img: ({ node, ...props }) => <CustomImage {...props} />, // Use CustomImage for img elements
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            )}
        </Container>
    );
};

export default MarkdownDisplay;
