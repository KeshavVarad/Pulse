import React, { useEffect, useRef, useState } from 'react';
import { Button, List, ListItem, ListItemText, Paper, Box, Chip, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { MentionsInput, Mention } from 'react-mentions';

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

    // Get contextual parameters from URL
    const contextPracticalId = searchParams.get('practical');
    const contextPracticalName = searchParams.get('name');

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
    const [isAiTyping, setIsAiTyping] = useState(true);
    const [currentAiMessage, setCurrentAiMessage] = useState('');
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const typingDelay = 100; // Delay between words in ms

    const [students, setStudents] = useState([]);
    const [practicals, setPracticals] = useState([]);
    const [schoolId, setSchoolId] = useState(null);
    const [showSuggestedPrompts, setShowSuggestedPrompts] = useState(true);

    // Get the appropriate suggested prompts based on context
    const suggestedPrompts = contextPracticalName
        ? getContextualPrompts(contextPracticalName)
        : DEFAULT_PROMPTS;

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
        }
    }, [currentUser]);

    /**
     * Autoscroll to bottom when messages change
     */
    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, currentWordIndex]);

    /**
     * Typewriter effect for AI messages
     */
    useEffect(() => {
        if (!isAiTyping) return;

        const lastMsg = messages[messages.length - 1];
        const isLatestAi = lastMsg && lastMsg.sender === 'ai';

        if (isLatestAi) {
            const words = lastMsg.text.split(' ');
            if (currentWordIndex < words.length) {
                const timer = setTimeout(() => {
                    setCurrentAiMessage((prev) => (prev ? prev + ' ' : '') + words[currentWordIndex]);
                    setCurrentWordIndex((prevIndex) => prevIndex + 1);
                }, typingDelay);

                return () => clearTimeout(timer);
            } else {
                setIsAiTyping(false);
            }
        } else {
            setIsAiTyping(false);
        }
    }, [isAiTyping, currentWordIndex, messages]);

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

            const response = await axios.post(`${process.env.REACT_APP_API_HOST}/api/chat`, payload);
            const aiMessage = response.data.response;
            setMessages((prev) => [...prev, { text: aiMessage.content, sender: 'ai' }]);

            setCurrentAiMessage('');
            setCurrentWordIndex(0);
            setIsAiTyping(true);
        } catch (error) {
            console.error('Error calling API:', error);
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

        // Clear the input
        setInput('');

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

            // 6. Send to backend
            const response = await axios.post(`${process.env.REACT_APP_API_HOST}/api/chat`, payload);

            // 7. Receive the AI response, store in local state
            const aiMessage = response.data.response;
            setMessages((prev) => [...prev, { text: aiMessage.content, sender: 'ai' }]);

            // Reset typing effect for the new AI message
            setCurrentAiMessage('');
            setCurrentWordIndex(0);
            setIsAiTyping(true);
        } catch (error) {
            console.error('Error calling API:', error);
        }
    };

    // Get the last AI message to see if we show typewriter
    const lastMessage = messages[messages.length - 1];
    const aiMessageText = lastMessage.sender === 'ai' ? lastMessage.text : '';

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
                                backgroundColor: isUser ? '#d1e7dd' : '#f8d7da',
                                borderRadius: '8px',
                                margin: '5px',
                                padding: '10px',
                                maxWidth: '70%',
                                alignSelf: isUser ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <ListItemText
                                primary={
                                    <span style={{ fontWeight: isAi ? 'bold' : 'normal' }}>
                                        {isAi ? 'AI: ' : 'You: '}
                                        <ReactMarkdown>
                                            {isAi
                                                ? // If it's the most recent AI message being typed out:
                                                msg.text === aiMessageText
                                                    ? currentAiMessage
                                                    : msg.text
                                                : msg.text}
                                        </ReactMarkdown>
                                    </span>
                                }
                            />
                        </ListItem>
                    );
                })}
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
