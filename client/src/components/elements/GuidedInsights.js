import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Paper,
    Typography,
    Button,
    Box,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import AIMessageRenderer from './AIMessageRenderer';

// Clinical/Educational settings for context-specific advice
const SETTINGS = [
    { value: 'emergency_room', label: 'Emergency Room' },
    { value: 'operating_room', label: 'Operating Room' },
    { value: 'icu', label: 'ICU' },
    { value: 'clinic', label: 'Clinic' },
    { value: 'delivery_suite', label: 'Delivery Suite' },
    { value: 'floor', label: 'Hospital Floor' },
    { value: 'classroom', label: 'Classroom' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'simulation_lab', label: 'Simulation Lab' },
];

// Progress stages (based on Kolb's Learning Cycle, but with subtle labels)
const PROGRESS_STAGES = [
    { label: 'Review', description: 'What happened?' },
    { label: 'Reflect', description: 'Why it matters' },
    { label: 'Learn', description: 'Key takeaways' },
    { label: 'Plan', description: 'Next steps' },
];

// Question tree structure following Kolb's cycle
const QUESTION_TREE = {
    // Stage 1: Concrete Experience - What happened?
    initial: {
        stage: 0,
        questions: [
            {
                id: 'strengths',
                label: 'What did I do well?',
                prompt: 'Based on my recent practicals and feedback, what specific things did I do well? Please search my transcripts and feedback for concrete examples.',
                followUp: 'reflect_strengths',
            },
            {
                id: 'improvements',
                label: 'What could I improve?',
                prompt: 'Based on my recent practicals and feedback, what areas need improvement? Please search my transcripts and feedback for specific examples.',
                followUp: 'reflect_improvements',
            },
            {
                id: 'overview',
                label: 'Summarize my recent performance',
                prompt: 'Give me an overview of my recent practical performance. Search my practicals, transcripts, and feedback to provide a comprehensive summary.',
                followUp: 'reflect_overview',
            },
        ],
    },

    // Stage 2: Reflective Observation - Why did it matter?
    reflect_strengths: {
        stage: 1,
        questions: [
            {
                id: 'why_strengths',
                label: 'Why did these strengths matter?',
                prompt: 'Based on the strengths you just identified, explain why these skills are important in healthcare. How do they impact patient outcomes?',
                followUp: 'conceptualize_strengths',
            },
            {
                id: 'patterns_strengths',
                label: 'What patterns do you see?',
                prompt: 'Looking at my strengths across multiple practicals, what patterns do you notice? Are there specific situations where I consistently perform well?',
                followUp: 'conceptualize_patterns',
            },
        ],
    },
    reflect_improvements: {
        stage: 1,
        questions: [
            {
                id: 'why_improvements',
                label: 'Why do these areas need work?',
                prompt: 'For the improvement areas you identified, explain why these skills matter in healthcare. What could go wrong if I don\'t improve?',
                followUp: 'conceptualize_improvements',
            },
            {
                id: 'root_cause',
                label: 'What might be causing these gaps?',
                prompt: 'Looking at my improvement areas, what underlying factors might be contributing to these gaps? Are there patterns in when or how these issues occur?',
                followUp: 'conceptualize_gaps',
            },
        ],
    },
    reflect_overview: {
        stage: 1,
        questions: [
            {
                id: 'trends',
                label: 'What trends do you see over time?',
                prompt: 'Looking at my practicals chronologically, what trends do you see in my performance? Am I improving in certain areas?',
                followUp: 'conceptualize_trends',
            },
            {
                id: 'compare',
                label: 'How do different skills compare?',
                prompt: 'Compare my performance across different skill areas (communication, critical thinking, technical skills, etc.). Where am I strongest and weakest?',
                followUp: 'conceptualize_compare',
            },
        ],
    },

    // Stage 3: Abstract Conceptualization - What can I learn?
    conceptualize_strengths: {
        stage: 2,
        questions: [
            {
                id: 'leverage_strengths',
                label: 'How can I leverage these strengths?',
                prompt: 'Given my strengths, how can I leverage them more effectively? What advanced techniques could I develop?',
                followUp: 'apply',
                showSettingSelector: true,
            },
        ],
    },
    conceptualize_patterns: {
        stage: 2,
        questions: [
            {
                id: 'build_patterns',
                label: 'How can I build on these patterns?',
                prompt: 'Based on the patterns you identified, what specific habits or techniques should I continue developing?',
                followUp: 'apply',
                showSettingSelector: true,
            },
        ],
    },
    conceptualize_improvements: {
        stage: 2,
        questions: [
            {
                id: 'strategies',
                label: 'What strategies should I use?',
                prompt: 'For my improvement areas, what specific strategies or techniques are most effective for developing these skills?',
                followUp: 'apply',
                showSettingSelector: true,
            },
        ],
    },
    conceptualize_gaps: {
        stage: 2,
        questions: [
            {
                id: 'address_gaps',
                label: 'How do I address the root causes?',
                prompt: 'Given the underlying factors you identified, what foundational skills or mindsets should I work on?',
                followUp: 'apply',
                showSettingSelector: true,
            },
        ],
    },
    conceptualize_trends: {
        stage: 2,
        questions: [
            {
                id: 'accelerate',
                label: 'How can I accelerate my progress?',
                prompt: 'Based on my improvement trends, what can I do to accelerate my growth in areas where I\'m developing?',
                followUp: 'apply',
                showSettingSelector: true,
            },
        ],
    },
    conceptualize_compare: {
        stage: 2,
        questions: [
            {
                id: 'balance',
                label: 'How do I balance my skill development?',
                prompt: 'Given the comparison of my skills, how should I prioritize my development to become a more well-rounded practitioner?',
                followUp: 'apply',
                showSettingSelector: true,
            },
        ],
    },

    // Stage 4: Active Experimentation - How do I apply this?
    apply: {
        stage: 3,
        questions: [
            {
                id: 'action_plan',
                label: 'Give me a specific action plan',
                prompt: 'Create a specific, actionable plan I can implement in my next practical. Include concrete behaviors and techniques I should practice.',
                followUp: null,
                useSelectedSetting: true,
            },
            {
                id: 'practice_scenarios',
                label: 'What scenarios should I practice?',
                prompt: 'Suggest specific scenarios or exercises I can practice to improve. Be concrete about what I should do.',
                followUp: null,
                useSelectedSetting: true,
            },
            {
                id: 'self_check',
                label: 'How will I know I\'m improving?',
                prompt: 'What specific indicators or self-assessment criteria can I use to track my improvement?',
                followUp: null,
            },
        ],
    },
};

const GuidedInsights = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [role, setRole] = useState('');
    const [currentNode, setCurrentNode] = useState('initial');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [currentTool, setCurrentTool] = useState(null);
    const [selectedSetting, setSelectedSetting] = useState('');
    const [showSettingSelector, setShowSettingSelector] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState(null);

    // Conversation persistence state
    const [conversationId, setConversationId] = useState(null);
    const [pastConversations, setPastConversations] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());
                const userId = user.uid;

                const requestOptions = {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                };

                const userRes = await fetch(
                    `${process.env.REACT_APP_API_HOST}/api/user/${userId}`,
                    requestOptions
                );
                const userData = await userRes.json();
                setRole(userData.role);
            } catch (e) {
                console.error(e);
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
                `${process.env.REACT_APP_API_HOST}/api/conversations/${currentUser.uid}?type=guided_reflection&limitCount=10`
            );
            const data = await response.json();
            setPastConversations(data.conversations || []);
        } catch (error) {
            console.error('Error fetching past conversations:', error);
        }
    };

    // Save conversation to backend
    const saveConversation = async (history) => {
        if (!currentUser || history.length === 0) return;

        try {
            const payload = {
                conversationId,
                userId: currentUser.uid,
                type: 'guided_reflection',
                messages: history.map(h => ({
                    role: h.role,
                    content: h.text,
                })),
                metadata: {
                    currentNode,
                    currentStage: QUESTION_TREE[currentNode]?.stage || 0,
                    selectedSetting,
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

            // Refresh the list
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
                setConversationHistory(data.messages.map(m => ({
                    role: m.role,
                    text: m.content,
                })));
                setConversationId(convId);
                if (data.metadata?.currentNode) {
                    setCurrentNode(data.metadata.currentNode);
                }
                if (data.metadata?.selectedSetting) {
                    setSelectedSetting(data.metadata.selectedSetting);
                }
                setShowHistory(false);
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

    const handleQuestionClick = async (question) => {
        // If this question needs a setting selector and none is selected, show the selector
        if (question.showSettingSelector && !showSettingSelector) {
            setShowSettingSelector(true);
            setPendingQuestion(question);
            return;
        }

        // Build the prompt with setting context if applicable
        let prompt = question.prompt;
        if (question.useSelectedSetting && selectedSetting) {
            const settingLabel = SETTINGS.find(s => s.value === selectedSetting)?.label || selectedSetting;
            prompt = `${prompt} Focus specifically on how I can apply this in the ${settingLabel} setting.`;
        }

        // Add user question to history
        const newHistory = [
            ...conversationHistory,
            { role: 'user', text: question.label, isQuestion: true },
        ];
        setConversationHistory(newHistory);
        setIsStreaming(true);
        setStreamingContent('');
        setShowSettingSelector(false);
        setPendingQuestion(null);

        try {
            // Build messages for the API
            const messages = [
                {
                    role: 'system',
                    content: `You are a helpful educational feedback assistant helping a ${role} reflect on their practical performance using Kolb's Learning Cycle. Be specific and actionable in your responses.`,
                },
                ...newHistory
                    .filter(h => !h.isQuestion || h.role === 'user')
                    .map(h => ({
                        role: h.role === 'user' ? 'user' : 'assistant',
                        content: h.role === 'user' ? prompt : h.text,
                    })),
            ];

            const payload = {
                messages,
                userId: currentUser.uid,
                role: role,
            };

            const response = await fetch(
                `${process.env.REACT_APP_API_HOST}/api/chat/stream`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

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
                            const updatedHistory = [
                                ...newHistory,
                                { role: 'assistant', text: data.content },
                            ];
                            setConversationHistory(updatedHistory);
                            setStreamingContent('');
                            setCurrentTool(null);
                            setIsStreaming(false);

                            // Save conversation after each response
                            saveConversation(updatedHistory);

                            // Move to next node in the tree
                            if (question.followUp) {
                                setCurrentNode(question.followUp);
                            }
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        } catch (error) {
            console.error('Error calling API:', error);
            setCurrentTool(null);
            setIsStreaming(false);
        }
    };

    const handleSettingConfirm = () => {
        if (pendingQuestion && selectedSetting) {
            handleQuestionClick({ ...pendingQuestion, showSettingSelector: false });
        }
    };

    const handleReset = () => {
        setCurrentNode('initial');
        setConversationHistory([]);
        setStreamingContent('');
        setSelectedSetting('');
        setShowSettingSelector(false);
        setPendingQuestion(null);
        setConversationId(null); // Start a new conversation
    };

    const handleBack = () => {
        if (conversationHistory.length >= 2) {
            // Remove last Q&A pair
            const newHistory = conversationHistory.slice(0, -2);
            setConversationHistory(newHistory);

            // Go back to previous node (simplified - goes to initial)
            if (currentNode !== 'initial') {
                const currentStage = QUESTION_TREE[currentNode]?.stage || 0;
                if (currentStage > 0) {
                    // Find a node at the previous stage
                    const prevNode = Object.entries(QUESTION_TREE).find(
                        ([key, val]) => val.stage === currentStage - 1
                    );
                    if (prevNode) {
                        setCurrentNode(prevNode[0]);
                    }
                }
            }
        }
    };

    // Fork conversation to chat interface for free-form discussion
    const handleForkToChat = () => {
        if (conversationHistory.length === 0) return;

        // Convert conversation history to chat format
        const chatMessages = conversationHistory.map(h => ({
            text: h.text,
            sender: h.role === 'user' ? 'user' : 'ai',
        }));

        // Navigate to assistant page with conversation state
        navigate('/aita', {
            state: {
                forkedConversation: chatMessages,
                forkedFrom: 'guided_reflection',
                originalConversationId: conversationId,
            }
        });
    };

    const currentQuestions = QUESTION_TREE[currentNode]?.questions || [];
    const currentStage = QUESTION_TREE[currentNode]?.stage || 0;

    return (
        <Paper elevation={3} sx={{ p: 3, m: 3, backgroundColor: '#fafafa' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Guided Reflection
                    </Typography>
                    <Chip
                        label="Quick Mode"
                        size="small"
                        sx={{
                            backgroundColor: '#fff3e0',
                            color: '#e65100',
                            fontSize: '0.7rem',
                            height: '22px',
                        }}
                    />
                </Box>
                <Box>
                    <IconButton
                        onClick={() => setShowHistory(!showHistory)}
                        title="View past reflections"
                        sx={{ color: showHistory ? '#1976d2' : 'inherit' }}
                    >
                        <HistoryIcon />
                    </IconButton>
                    {conversationHistory.length > 0 && (
                        <>
                            <Tooltip title="Continue in Full Assistant for deeper exploration">
                                <IconButton onClick={handleForkToChat}>
                                    <ChatIcon />
                                </IconButton>
                            </Tooltip>
                            <IconButton onClick={handleBack} title="Go back">
                                <ArrowBackIcon />
                            </IconButton>
                        </>
                    )}
                    <IconButton onClick={handleReset} title="Start over">
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Past Conversations Panel */}
            <Collapse in={showHistory}>
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2, maxHeight: '200px', overflowY: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Past Reflections
                    </Typography>
                    {pastConversations.length === 0 ? (
                        <Typography variant="body2" sx={{ color: '#666' }}>
                            No past reflections yet. Start a new reflection to save it here.
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
                <DialogTitle>Delete Reflection?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this reflection? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => deleteConversation(conversationToDelete)}
                        color="error"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Progress indicator - subtle dots */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 1 }}>
                {PROGRESS_STAGES.map((stage, index) => (
                    <Box
                        key={stage.label}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                        }}
                    >
                        <Box
                            sx={{
                                width: index === currentStage ? 10 : 8,
                                height: index === currentStage ? 10 : 8,
                                borderRadius: '50%',
                                backgroundColor: index <= currentStage ? '#1976d2' : '#e0e0e0',
                                transition: 'all 0.2s ease',
                            }}
                        />
                        {index === currentStage && (
                            <Typography
                                variant="caption"
                                sx={{ color: '#1976d2', fontWeight: 500, ml: 0.5 }}
                            >
                                {stage.description}
                            </Typography>
                        )}
                        {index < PROGRESS_STAGES.length - 1 && (
                            <Box
                                sx={{
                                    width: 24,
                                    height: 2,
                                    backgroundColor: index < currentStage ? '#1976d2' : '#e0e0e0',
                                    ml: index === currentStage ? 1 : 0,
                                }}
                            />
                        )}
                    </Box>
                ))}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Conversation History */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto', mb: 2 }}>
                {conversationHistory.map((item, index) => (
                    <Box
                        key={index}
                        sx={{
                            mb: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: item.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                            borderLeft: item.role === 'user' ? '4px solid #1976d2' : '4px solid #757575',
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', display: 'block', mb: 0.5 }}>
                            {item.role === 'user' ? 'Your Question' : 'AI Assistant'}
                        </Typography>
                        {item.role === 'user' ? (
                            <Typography variant="body2">{item.text}</Typography>
                        ) : (
                            <AIMessageRenderer content={item.text} />
                        )}
                    </Box>
                ))}

                {/* Streaming response */}
                {isStreaming && (
                    <Box
                        sx={{
                            mb: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: '#f5f5f5',
                            borderLeft: '4px solid #757575',
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', display: 'block', mb: 0.5 }}>
                            AI Assistant
                        </Typography>
                        {streamingContent ? (
                            <AIMessageRenderer content={streamingContent} />
                        ) : (
                            <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                                {currentTool === 'search_transcripts' && 'Searching video transcripts...'}
                                {currentTool === 'get_practical_summary' && 'Looking up practical details...'}
                                {currentTool === 'search_feedback' && 'Searching feedback...'}
                                {currentTool === 'list_practicals' && 'Listing practicals...'}
                                {!currentTool && 'Thinking...'}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>

            {/* Setting Selector (shown when needed) */}
            {showSettingSelector && (
                <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff3e0', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Choose a setting to focus on:
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Clinical/Educational Setting</InputLabel>
                        <Select
                            value={selectedSetting}
                            onChange={(e) => setSelectedSetting(e.target.value)}
                            label="Clinical/Educational Setting"
                        >
                            {SETTINGS.map((setting) => (
                                <MenuItem key={setting.value} value={setting.value}>
                                    {setting.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        onClick={handleSettingConfirm}
                        disabled={!selectedSetting}
                        size="small"
                    >
                        Continue
                    </Button>
                </Box>
            )}

            {/* Question Buttons */}
            {!isStreaming && !showSettingSelector && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                        {conversationHistory.length === 0
                            ? 'Start by choosing a question:'
                            : 'Continue your reflection:'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {currentQuestions.map((question) => (
                            <Chip
                                key={question.id}
                                label={question.label}
                                onClick={() => handleQuestionClick(question)}
                                sx={{
                                    cursor: 'pointer',
                                    backgroundColor: '#e3f2fd',
                                    '&:hover': {
                                        backgroundColor: '#bbdefb',
                                    },
                                    fontSize: '0.9rem',
                                    py: 2,
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Completion message */}
            {currentNode === 'apply' && conversationHistory.length > 0 && !isStreaming && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#e8f5e9', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                        You've completed a full reflection cycle! Click any question above to continue exploring,
                        or use the refresh button to start a new reflection.
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default GuidedInsights;
