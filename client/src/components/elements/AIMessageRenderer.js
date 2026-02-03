import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * Parse timestamps in text and make them clickable
 * Matches patterns like [2:34], [12:05], or standalone 2:34, 12:05
 * Also extracts practical context if present (e.g., "in Blood Draw 101")
 */
const parseTimestamps = (text, onTimestampClick) => {
    if (!text || typeof text !== 'string') return text;

    // Match [MM:SS] format (with brackets) - primary format
    const timestampRegex = /\[(\d{1,2}:\d{2})\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = timestampRegex.exec(text)) !== null) {
        // Add text before the timestamp
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        // Add styled timestamp (clickable if handler provided)
        const timestamp = match[1];
        const seconds = timestampToSeconds(timestamp);
        const isClickable = !!onTimestampClick;

        parts.push(
            <Box
                component="span"
                key={`ts-${match.index}`}
                onClick={() => isClickable && onTimestampClick(seconds)}
                sx={{
                    backgroundColor: isClickable ? '#e3f2fd' : '#f5f5f5',
                    color: isClickable ? '#1565c0' : '#666',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    cursor: isClickable ? 'pointer' : 'default',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: isClickable ? '1px solid #90caf9' : '1px solid #e0e0e0',
                    transition: 'all 0.15s ease',
                    ...(isClickable && {
                        '&:hover': {
                            backgroundColor: '#bbdefb',
                            borderColor: '#64b5f6',
                            transform: 'translateY(-1px)',
                        },
                        '&:active': {
                            transform: 'translateY(0)',
                        },
                    }),
                }}
                title={isClickable ? 'Click to jump to this moment in the video' : `Video timestamp: ${timestamp}`}
            >
                <span style={{ fontSize: '0.85em' }}>{isClickable ? '▶' : '⏱'}</span>
                {timestamp}
            </Box>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
};

/**
 * Recursively process React children to parse timestamps
 */
const processChildrenForTimestamps = (children, onTimestampClick) => {
    if (!children) return children;

    // Handle string children directly
    if (typeof children === 'string') {
        return parseTimestamps(children, onTimestampClick);
    }

    // Handle arrays of children
    if (Array.isArray(children)) {
        return children.map((child, idx) => (
            <React.Fragment key={idx}>
                {processChildrenForTimestamps(child, onTimestampClick)}
            </React.Fragment>
        ));
    }

    // Handle React elements - clone with processed children
    if (React.isValidElement(children)) {
        const childProps = children.props;
        if (childProps && childProps.children) {
            return React.cloneElement(
                children,
                {},
                processChildrenForTimestamps(childProps.children, onTimestampClick)
            );
        }
    }

    return children;
};

/**
 * Convert timestamp string (MM:SS) to seconds
 */
const timestampToSeconds = (timestamp) => {
    const [mins, secs] = timestamp.split(':').map(Number);
    return mins * 60 + secs;
};

/**
 * Check if a heading is a special section type
 */
const getSectionType = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('strength') || lower.includes('well') || lower.includes('positive')) {
        return 'strengths';
    }
    if (lower.includes('improve') || lower.includes('area') || lower.includes('work on')) {
        return 'improvements';
    }
    if (lower.includes('moment') || lower.includes('timestamp') || lower.includes('key')) {
        return 'moments';
    }
    return null;
};

/**
 * Get section styling based on type
 */
const getSectionStyle = (type) => {
    switch (type) {
        case 'strengths':
            return {
                backgroundColor: '#e8f5e9',
                borderLeft: '4px solid #4caf50',
                iconColor: '#4caf50',
                iconType: 'check',
            };
        case 'improvements':
            return {
                backgroundColor: '#fff3e0',
                borderLeft: '4px solid #ff9800',
                iconColor: '#ff9800',
                iconType: 'trending',
            };
        case 'moments':
            return {
                backgroundColor: '#e3f2fd',
                borderLeft: '4px solid #2196f3',
                iconColor: '#2196f3',
                iconType: 'time',
            };
        default:
            return null;
    }
};

/**
 * Render the appropriate icon for a section
 */
const SectionIcon = ({ type, color }) => {
    const iconStyle = { color, marginRight: '8px' };
    switch (type) {
        case 'check':
            return <CheckCircleOutlineIcon style={iconStyle} />;
        case 'trending':
            return <TrendingUpIcon style={iconStyle} />;
        case 'time':
            return <AccessTimeIcon style={iconStyle} />;
        default:
            return null;
    }
};

/**
 * Custom component to render AI messages with enhanced formatting
 */
const AIMessageRenderer = ({ content, onTimestampClick }) => {
    const navigate = useNavigate();

    // Handle internal link clicks (for practical timestamps) - open in new tab
    const handleLinkClick = (e, href) => {
        // Check if it's an internal practical link
        if (href && href.startsWith('/practical/')) {
            e.preventDefault();
            // Open in new tab
            window.open(href, '_blank');
        }
    };

    // Custom components for ReactMarkdown
    const components = {
        // Enhanced heading rendering for section headers
        h2: ({ children }) => {
            const text = typeof children === 'string' ? children :
                        (Array.isArray(children) ? children.join('') : String(children || ''));
            const sectionType = getSectionType(text);
            const style = getSectionStyle(sectionType);

            if (style) {
                return (
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: style.backgroundColor,
                            borderLeft: style.borderLeft,
                            padding: '12px 16px',
                            marginTop: 2,
                            marginBottom: 1,
                            borderRadius: '4px',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SectionIcon type={style.iconType} color={style.iconColor} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {children}
                            </Typography>
                        </Box>
                    </Paper>
                );
            }

            return (
                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    {children}
                </Typography>
            );
        },

        // Render paragraphs with timestamp parsing
        p: ({ children }) => {
            const processed = processChildrenForTimestamps(children, onTimestampClick);
            return <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.7 }}>{processed}</Typography>;
        },

        // Style list items with timestamp parsing
        li: ({ children }) => {
            const processed = processChildrenForTimestamps(children, onTimestampClick);
            return (
                <li style={{ marginBottom: '6px' }}>
                    <Typography variant="body2" component="span" sx={{ lineHeight: 1.7 }}>
                        {processed}
                    </Typography>
                </li>
            );
        },

        // Style unordered lists
        ul: ({ children }) => (
            <Box component="ul" sx={{ pl: 2, mb: 1, mt: 0 }}>
                {children}
            </Box>
        ),

        // Style ordered lists
        ol: ({ children }) => (
            <Box component="ol" sx={{ pl: 2, mb: 1, mt: 0 }}>
                {children}
            </Box>
        ),

        // Style code blocks
        code: ({ inline, children }) => (
            <Box
                component="code"
                sx={{
                    backgroundColor: '#f5f5f5',
                    padding: inline ? '2px 4px' : '8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    display: inline ? 'inline' : 'block',
                    whiteSpace: inline ? 'normal' : 'pre-wrap',
                }}
            >
                {children}
            </Box>
        ),

        // Style strong/bold
        strong: ({ children }) => (
            <Typography component="span" sx={{ fontWeight: 600 }}>
                {children}
            </Typography>
        ),

        // Handle links - special styling for practical timestamp links
        a: ({ href, children }) => {
            const isTimestampLink = href && href.startsWith('/practical/') && href.includes('?t=');

            if (isTimestampLink) {
                // Extract timestamp for display
                const timestampMatch = href.match(/\?t=(\d+)/);
                const seconds = timestampMatch ? parseInt(timestampMatch[1]) : 0;

                return (
                    <Box
                        component="span"
                        onClick={(e) => handleLinkClick(e, href)}
                        sx={{
                            backgroundColor: '#e3f2fd',
                            color: '#1565c0',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontSize: '0.9em',
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #90caf9',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                                backgroundColor: '#bbdefb',
                                borderColor: '#64b5f6',
                                transform: 'translateY(-1px)',
                            },
                            '&:active': {
                                transform: 'translateY(0)',
                            },
                        }}
                        title="Click to jump to this moment in the video"
                    >
                        <span style={{ fontSize: '0.85em' }}>▶</span>
                        {children}
                    </Box>
                );
            }

            // Regular external links
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1565c0' }}
                >
                    {children}
                </a>
            );
        },
    };

    return (
        <Box sx={{ '& > *:first-of-type': { mt: 0 } }}>
            <ReactMarkdown components={components}>
                {content}
            </ReactMarkdown>
        </Box>
    );
};

export default AIMessageRenderer;
