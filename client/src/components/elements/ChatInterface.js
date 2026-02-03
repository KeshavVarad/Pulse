import React, { useEffect, useRef, useState } from 'react';
import {
    Button, List, ListItem, ListItemText, Paper, Box, Chip, Typography,
    IconButton, Collapse, ListItemButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import axios from 'axios';
import { MentionsInput, Mention } from 'react-mentions';
import AIMessageRenderer from './AIMessageRenderer';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const DEFAULT_PROMPTS = [
    { label: 'Summarize my feedback', prompt: 'Summarize my recent feedback from practicals' },
    { label: 'What should I work on?', prompt: 'Based on my feedback, what areas should I focus on improving?' },
    { label: 'Explain my last practical', prompt: 'Can you explain what happened in my most recent practical?' },
];

const getContextualPrompts = (practicalName) => [
    { label: 'Summarize this session', prompt: `Summarize the feedback from my ${practicalName} practical` },
    { label: 'What went well?', prompt: `What did I do well in my ${practicalName} practical?` },
    { label: 'How can I improve?', prompt: `Based on the feedback from ${practicalName}, what should I focus on improving?` },
];

const ChatInterface = () => {
    const { currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Get contextual parameters from URL
    const contextPracticalId = searchParams.get('practical');
    const contextPracticalName = searchParams.get('name');

    // Check for forked conversation from guided reflection
    const forkedConversation = location.state?.forkedConversation;
    const forkedFrom = location.state?.forkedFrom;

    // Handle timestamp click - navigate to practical page with timestamp
    const handleTimestampClick = (seconds) => {
        if (contextPracticalId) {
            navigate(`/practical/${contextPracticalId}?t=${seconds}`);
        }
    };

    const getWelcomeMessage = () => {
        if (contextPracticalName) {
            return `I'm ready to help you understand your "${contextPracticalName}" practical session. You can ask me about your feedback, what you did well, or areas for improvement.`;
        }
        return "Welcome to the Pulse Assistant! I'm here to assist you with your feedback and questions. Whether you want to summarize your feedback from practicals, explore ways to improve, or ask technical questions, feel free to reach out. Let's make your learning experience as effective as possible.";
    };

    const [messages, setMessages] = useState([
        {
            text: getWelcomeMessage(),
            sender: 'ai',
        },
    ]);
    const [input, setInput] = useState('');
    const endOfMessagesRef = useRef(null);

    const [userRole, setUserRole] = useState('student');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [currentTool, setCurrentTool] = useState(null);

    const [students, setStudents] = useState([]);
    const [practicals, setPracticals] = useState([]);
    const [schoolId, setSchoolId] = useState(null);
    const [showSuggestedPrompts, setShowSuggestedPrompts] = useState(true);

    // Conversation persistence state
    const [conversationId, setConversationId] = useState(null);
    const [pastConversations, setPastConversations] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);
    const [isForkedConversation, setIsForkedConversation] = useState(false);

    // Get the appropriate suggested prompts based on context
    const suggestedPrompts = contextPracticalName
        ? getContextualPrompts(contextPracticalName)
        : DEFAULT_PROMPTS;

    // Handle forked conversation from guided reflection
    useEffect(() => {
        if (forkedConversation && forkedFrom === 'guided_reflection') {
            // Add a system message indicating this is a continuation
            const continuationMessage = {
                text: "This conversation was continued from a Guided Reflection. Feel free to ask follow-up questions or explore the topics more freely.",
                sender: 'ai',
            };

            // Set the forked messages with the continuation message
            setMessages([...forkedConversation, continuationMessage]);
            setShowSuggestedPrompts(false);
            setIsForkedConversation(true);

            // Clear the location state to prevent re-loading on navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [forkedConversation, forkedFrom]);

    /**
     * Styles for the MentionsInput & mentions
     */
    const mentionInputStyle = {
        control: {
            backgroundColor: '#fff',
            fontSize: 16,
            fontWeight: 'normal',
            width: '60%',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
        },
        highlighter: {
            overflow: 'hidden',
        },
        input: {
            margin: 0,
            padding: 0,
        },
        mention: {
            // This styles the mention text (both @ and #)
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            padding: '2px 4px',
            fontWeight: 'bold',
            color: '#333',
        },
        suggestions: {
            list: {
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.15)',
                fontSize: 14,
                overflow: 'auto',
                maxHeight: 150,
            },
            item: {
                padding: '5px 10px',
                borderBottom: '1px solid #eee',
                '&focused': {
                    backgroundColor: '#cee4e5',
                },
            },
        },
    };

    /**
     * Fetch school data (including students) once we have a schoolId
     */
    useEffect(() => {
        async function fetchSchoolData() {
            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());

                const requestOptions = {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                };

                if (!schoolId) return;
                const schoolRes = await fetch(
                    `${process.env.REACT_APP_API_HOST}/api/school/${schoolId}`,
                    requestOptions
                );
                const schoolData = await schoolRes.json();

                setStudents(schoolData.students || []);
            } catch (e) {
                console.log(e);
            }
        }

        fetchSchoolData();
    }, [schoolId]);

    /**
     * Fetch user data (role, school, practicals) once
     */
    useEffect(() => {
        async function fetchUserData() {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                const userId = user.uid;

                const requestOptions = {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                };

                // 1. Fetch user doc
                const userRes = await fetch(
                    `${process.env.REACT_APP_API_HOST}/api/user/${userId}`,
                    requestOptions
                );
                const userData = await userRes.json();

                setUserRole(userData.role);
                setSchoolId(userData.school_id);

                // 2. Based on role, fetch relevant practicals
                let practicalRes;
                if (userData.role === 'instructor') {
                    practicalRes = await fetch(
                        `${process.env.REACT_APP_API_HOST}/api/practical/instructor/${userId}`,
                        requestOptions
                    );
                } else {
                    // Student
                    practicalRes = await fetch(
                        `${process.env.REACT_APP_API_HOST}/api/practical/student/${userId}`,
                        requestOptions
                    );
                }
                const practicalData = await practicalRes.json();

                // 3. Extract just the practical names (with spaces)
                const practicalNames = practicalData.map((p) => p.practical_name);
                setPracticals(practicalNames);
            } catch (e) {
                console.log(e);
            }
        }

        if (currentUser) {
            fetchUserData();
            fetchPastConversations();
        }
    }, [currentUser]);

    // Fetch past conversations
    const fetchPastConversations = async () => {
        if (!currentUser) return;
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_HOST}/api/conversations/${currentUser.uid}?type=chat&limitCount=10`
            );
            const data = await response.json();
            setPastConversations(data.conversations || []);
        } catch (error) {
            console.error('Error fetching past conversations:', error);
        }
    };

    // Save conversation to backend
    const saveConversation = async (msgs) => {
        if (!currentUser || msgs.length <= 1) return; // Don't save if only welcome message

        try {
            const payload = {
                conversationId,
                userId: currentUser.uid,
                type: 'chat',
                messages: msgs.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text,
                })),
                metadata: {
                    contextPracticalId,
                    contextPracticalName,
                },
            };

            const response = await fetch(
                `${process.env.REACT_APP_API_HOST}/api/conversations`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );
            const data = await response.json();

            if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
            }

            fetchPastConversations();
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    // Load a past conversation
    const loadConversation = async (convId) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_HOST}/api/conversations/detail/${convId}`
            );
            const data = await response.json();

            if (data.messages) {
                setMessages(data.messages.map(m => ({
                    text: m.content,
                    sender: m.role === 'user' ? 'user' : 'ai',
                })));
                setConversationId(convId);
                setShowHistory(false);
                setShowSuggestedPrompts(false);
                setIsForkedConversation(false);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    // Delete a conversation
    const deleteConversation = async (convId) => {
        try {
            await fetch(
                `${process.env.REACT_APP_API_HOST}/api/conversations/${convId}`,
                { method: 'DELETE' }
            );
            fetchPastConversations();
            setDeleteDialogOpen(false);
            setConversationToDelete(null);
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    // Start a new conversation
    const startNewConversation = () => {
        setMessages([{ text: getWelcomeMessage(), sender: 'ai' }]);
        setConversationId(null);
        setShowSuggestedPrompts(true);
        setShowHistory(false);
        setIsForkedConversation(false);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    /**
     * Autoscroll to bottom when messages change or streaming content updates
     */
    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, streamingContent]);

    /**
     * Handle key down in input - Enter sends, Shift+Enter creates new line
     */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    /**
     * Handle clicking a suggested prompt - sets input and sends immediately
     */
    const handleSuggestedPrompt = (prompt) => {
        setInput(prompt);
        setShowSuggestedPrompts(false);
        // Use setTimeout to ensure state updates before sending
        setTimeout(() => {
            handleSendMessageWithText(prompt);
        }, 0);
    };

    /**
     * Send a message with specific text (used by suggested prompts)
     */
    const handleSendMessageWithText = async (messageText) => {
        if (!messageText.trim()) return;

        const userMessageObj = {
            text: messageText,
            sender: 'user',
        };
        setMessages((prev) => [...prev, userMessageObj]);
        setInput('');
        setIsAiTyping(true);
        setStreamingContent('');

        try {
            const conversationHistory = messages.map((msg) => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text,
            }));

            // Build filter for context practical if present
            const contextFilter = contextPracticalId
                ? { practical_id: { $eq: contextPracticalId } }
                : {};

            const payload = {
                messages: [
                    {
                        role: 'system',
                        content:
                            "You are a helpful teaching assistant for practical healthcare education. " +
                            "Answer using data from practicals that are relevant to the user based on their id.",
                    },
                    ...conversationHistory,
                    { role: 'user', content: `User: ${messageText}` },
                ],
                userId: currentUser.uid,
                role: userRole,
                ...(Object.keys(contextFilter).length > 0 ? { filter: contextFilter } : {}),
            };

            // Use streaming endpoint
            const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.tool) {
                            setCurrentTool(data.tool.name);
                        }
                        if (data.chunk) {
                            setCurrentTool(null);
                            fullContent += data.chunk;
                            setStreamingContent(fullContent);
                        }
                        if (data.done) {
                            const newMessages = [...messages, userMessageObj, { text: data.content, sender: 'ai' }];
                            setMessages(newMessages);
                            setStreamingContent('');
                            setCurrentTool(null);
                            setIsAiTyping(false);
                            saveConversation(newMessages);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        } catch (error) {
            console.error('Error calling API:', error);
            setCurrentTool(null);
            setIsAiTyping(false);
        }
    };

    /**
     * Handle sending user message
     */
    const handleSendMessage = async () => {
        if (!input.trim()) return;

        // 1. Temporarily store the user message in local state
        //    We'll also do a final "clean up" to remove mention markup from displayed text
        const userMessageRaw = input; // raw with mention markup
        let userMessageClean = userMessageRaw;

        // 2. Replace mention markup for practicals => e.g. "#[Blood Draw 101](Blood Draw 101)" => "#BloodDraw101"
        userMessageClean = userMessageClean.replace(/#\[(.*?)\]\((.*?)\)/g, (match, p1) => {
            return '#' + p1.replace(/\s+/g, '');
        });

        // 3. Replace mention markup for students => e.g. "@[Jane Doe](jane@pulse.edu)" => "@JaneDoe"
        userMessageClean = userMessageClean.replace(/@\[(.*?)\]\((.*?)\)/g, (match, p1) => {
            // remove spaces from the display name if you prefer, or keep them
            return '@' + p1.replace(/\s+/g, '');
        });

        // Add the user message to local chat
        const userMessageObj = {
            text: userMessageClean,
            sender: 'user',
        };
        setMessages((prev) => [...prev, userMessageObj]);

        // Clear the input and start streaming state
        setInput('');
        setIsAiTyping(true);
        setStreamingContent('');

        // 4. Build the user prompt for the backend
        const prompt = `User: ${userMessageRaw}`;
        // (We pass the raw text w/ mention markup to parse filters.)

        try {
            // Convert local messages into the format the backend expects
            const conversationHistory = messages.map((msg) => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text,
            }));

            // -------------------------
            // PARSE STUDENT TAGS (raw)
            // -------------------------
            const studentTagRegex = /@\[(.*?)\]\((.*?)\)/g;
            let studentTags = [];
            let match;
            while ((match = studentTagRegex.exec(prompt)) !== null) {
                // match[1] = "Jane Doe", match[2] = "jane@pulse.edu"
                studentTags.push(`${match[1].trim()}|${match[2].trim()}`);
            }
            studentTags = [...new Set(studentTags)];

            // -------------------------
            // PARSE PRACTICAL TAGS (raw)
            // => "#[Blood Draw 101](Blood Draw 101)"
            // -------------------------
            const practicalTagRegex = /#\[(.*?)\]\((.*?)\)/g;
            let practicalTags = [];
            let pMatch;
            while ((pMatch = practicalTagRegex.exec(prompt)) !== null) {
                // pMatch[1] = "Blood Draw 101"
                // pMatch[2] = "Blood Draw 101"
                practicalTags.push(pMatch[1].trim());
            }
            practicalTags = [...new Set(practicalTags)];

            // Build filter
            let customFilter = {};
            if (studentTags.length > 0) {
                customFilter['student_tag'] = { $in: studentTags };
            }
            if (practicalTags.length > 0) {
                customFilter['practical_name'] = { $in: practicalTags };
            }

            // 5. Build the payload
            const payload = {
                messages: [
                    {
                        role: 'system',
                        content:
                            "You are a helpful teaching assistant for practical healthcare education. " +
                            "Answer using data from practicals that are relevant to the user based on their id.",
                    },
                    ...conversationHistory,
                    { role: 'user', content: prompt },
                ],
                userId: currentUser.uid,
                role: userRole,
                ...(Object.keys(customFilter).length > 0 ? { filter: customFilter } : {}),
            };

            // 6. Send to streaming backend
            const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.tool) {
                            // Show which tool is being used
                            setCurrentTool(data.tool.name);
                        }
                        if (data.chunk) {
                            setCurrentTool(null); // Clear tool status when streaming starts
                            fullContent += data.chunk;
                            setStreamingContent(fullContent);
                        }
                        if (data.done) {
                            const newMessages = [...messages, userMessageObj, { text: data.content, sender: 'ai' }];
                            setMessages(newMessages);
                            setStreamingContent('');
                            setCurrentTool(null);
                            setIsAiTyping(false);
                            saveConversation(newMessages);
                        }
                        if (data.error) {
                            console.error('Streaming error:', data.error);
                            setCurrentTool(null);
                            setIsAiTyping(false);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        } catch (error) {
            console.error('Error calling API:', error);
            setCurrentTool(null);
            setIsAiTyping(false);
        }
    };


    return (
        <Paper
            elevation={3}
            style={{
                width: '75%',
                padding: '20px',
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header with History Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Pulse Assistant
                    </Typography>
                    <Chip
                        label="Full Mode"
                        size="small"
                        sx={{
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            fontSize: '0.7rem',
                            height: '22px',
                        }}
                    />
                </Box>
                <Box>
                    <IconButton
                        onClick={() => setShowHistory(!showHistory)}
                        title="View past conversations"
                        sx={{ color: showHistory ? '#1976d2' : 'inherit' }}
                        size="small"
                    >
                        <HistoryIcon />
                    </IconButton>
                    <IconButton
                        onClick={startNewConversation}
                        title="New conversation"
                        size="small"
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Past Conversations Panel */}
            <Collapse in={showHistory}>
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2, maxHeight: '150px', overflowY: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Past Conversations
                    </Typography>
                    {pastConversations.length === 0 ? (
                        <Typography variant="body2" sx={{ color: '#666' }}>
                            No past conversations yet.
                        </Typography>
                    ) : (
                        <List dense disablePadding>
                            {pastConversations.map((conv) => (
                                <ListItem
                                    key={conv.id}
                                    disablePadding
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConversationToDelete(conv.id);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    }
                                >
                                    <ListItemButton
                                        onClick={() => loadConversation(conv.id)}
                                        selected={conv.id === conversationId}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        <ListItemText
                                            primary={conv.title}
                                            secondary={formatDate(conv.updatedAt)}
                                            primaryTypographyProps={{ noWrap: true, sx: { fontSize: '0.875rem' } }}
                                            secondaryTypographyProps={{ sx: { fontSize: '0.75rem' } }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </Collapse>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Conversation?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this conversation? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => deleteConversation(conversationToDelete)} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Context Header */}
            {contextPracticalName && (
                <Box sx={{
                    backgroundColor: '#e8f5e9',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Discussing: {contextPracticalName}
                    </Typography>
                </Box>
            )}

            {/* Forked from Guided Reflection indicator */}
            {isForkedConversation && (
                <Box sx={{
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1565c0' }}>
                        Continued from Guided Reflection
                    </Typography>
                </Box>
            )}

            {/* Chat Messages */}
            <List style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '10px' }}>
                {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    const isAi = msg.sender === 'ai';

                    return (
                        <ListItem
                            key={index}
                            style={{
                                justifyContent: isUser ? 'flex-end' : 'flex-start',
                                backgroundColor: isUser ? '#d1e7dd' : '#f5f5f5',
                                borderRadius: '8px',
                                margin: '5px',
                                padding: '10px',
                                maxWidth: isAi ? '85%' : '70%',
                                alignSelf: isUser ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <ListItemText
                                primary={
                                    isAi ? (
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 0.5, display: 'block' }}>
                                                AI Assistant
                                            </Typography>
                                            <AIMessageRenderer
                                                content={msg.text}
                                                onTimestampClick={contextPracticalId ? handleTimestampClick : null}
                                            />
                                        </Box>
                                    ) : (
                                        <span>
                                            <strong>You:</strong> {msg.text}
                                        </span>
                                    )
                                }
                            />
                        </ListItem>
                    );
                })}
                {/* Show streaming content while AI is typing */}
                {isAiTyping && streamingContent && (
                    <ListItem
                        style={{
                            justifyContent: 'flex-start',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '8px',
                            margin: '5px',
                            padding: '10px',
                            maxWidth: '85%',
                            alignSelf: 'flex-start',
                        }}
                    >
                        <ListItemText
                            primary={
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 0.5, display: 'block' }}>
                                        AI Assistant
                                    </Typography>
                                    <AIMessageRenderer
                                        content={streamingContent}
                                        onTimestampClick={contextPracticalId ? handleTimestampClick : null}
                                    />
                                </Box>
                            }
                        />
                    </ListItem>
                )}
                {/* Show typing indicator when waiting for first chunk */}
                {isAiTyping && !streamingContent && (
                    <ListItem
                        style={{
                            justifyContent: 'flex-start',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '8px',
                            margin: '5px',
                            padding: '10px',
                            maxWidth: '85%',
                            alignSelf: 'flex-start',
                        }}
                    >
                        <ListItemText
                            primary={
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 0.5, display: 'block' }}>
                                        AI Assistant
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                                        {currentTool === 'search_transcripts' && 'Searching video transcripts...'}
                                        {currentTool === 'get_practical_summary' && 'Looking up practical details...'}
                                        {currentTool === 'search_feedback' && 'Searching feedback...'}
                                        {currentTool === 'list_practicals' && 'Listing practicals...'}
                                        {!currentTool && 'Thinking...'}
                                    </Typography>
                                </Box>
                            }
                        />
                    </ListItem>
                )}
                <div ref={endOfMessagesRef} />
            </List>

            {/* Suggested Prompts */}
            {showSuggestedPrompts && messages.length <= 1 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {suggestedPrompts.map((item, idx) => (
                        <Chip
                            key={idx}
                            label={item.label}
                            onClick={() => handleSuggestedPrompt(item.prompt)}
                            sx={{
                                cursor: 'pointer',
                                backgroundColor: '#e3f2fd',
                                '&:hover': {
                                    backgroundColor: '#bbdefb',
                                },
                            }}
                        />
                    ))}
                </Box>
            )}

            {/* Mentions Input */}
            <MentionsInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={mentionInputStyle}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                allowSuggestionsAboveCursor
            >
                {/* Mention for Students */}
                <Mention
                    trigger="@"
                    data={students.map((s) => ({
                        id: s.email,
                        display: s.real_name,
                    }))}
                    // Example markup: "@[Jane Doe](jane@pulse.edu)"
                    markup="@[__display__](__id__)"
                    displayTransform={(id, display) => '@' + display.replace(/\s+/g, '')}
                />

                {/* Mention for Practicals */}
                <Mention
                    trigger="#"
                    data={practicals.map((p) => ({
                        // "id" stores the full spaced name for the backend filter
                        id: p,
                        // "display" is the same spaced name you see in the suggestions
                        display: p,
                    }))}
                    // We store bracket-based markup so we can parse the spaced name later:
                    // e.g. "#[Blood Draw 101](Blood Draw 101)"
                    markup="#[__id__](__id__)"
                    // But visually in the input, we remove spaces:
                    displayTransform={(id) => '#' + id.replace(/\s+/g, '')}
                    // If your practicals have spaces, let user keep typing after space:
                    allowSpaceInQuery
                />
            </MentionsInput>

            {/* Send Button */}
            <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                style={{ marginTop: '10px' }}
            >
                Send
            </Button>
        </Paper>
    );
};

export default ChatInterface;
