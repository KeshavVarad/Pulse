import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, List, ListItem, ListItemText, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { format } from 'date-fns';
import OpenAI from "openai";
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { MentionsInput, Mention } from 'react-mentions';


const ChatInterface = () => {
    const { currentUser } = useAuth()

    const [messages, setMessages] = useState([{
        text: "Welcome to the Pulse Assitant! I’m here to assist you with your feedback and questions. Whether you want to summarize your feedback from practicals, explore ways to improve, or ask technical questions, feel free to reach out. Let’s make your learning experience as effective as possible.",
        sender: 'ai'
    }]);
    const [input, setInput] = useState('');
    const endOfMessagesRef = useRef(null);

    const [userPerfData, setUserPerfData] = useState();
    const [userRole, setUserRole] = useState("student");

    const [currentAiMessage, setCurrentAiMessage] = useState('');
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isAiTyping, setIsAiTyping] = useState(true);
    const typingDelay = 100; // Delay between words in milliseconds

    const [students, setStudents] = useState([]);
    const [schoolId, setSchoolId] = useState([]);

    const mentionInputStyle = {
        control: {
            backgroundColor: "#fff",
            fontSize: 16,
            fontWeight: "normal",
            width: "60%",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "8px",
        },
        highlighter: {
            overflow: "hidden",
        },
        input: {
            margin: 0,
            padding: 0,
        },
        // Custom styles for the suggestions dropdown.
        suggestions: {
            list: {
                backgroundColor: "white",
                border: "1px solid rgba(0,0,0,0.15)",
                fontSize: 14,
                overflow: "auto",
                maxHeight: 150,
            },
            item: {
                padding: "5px 10px",
                borderBottom: "1px solid #eee",
                "&focused": {
                    backgroundColor: "#cee4e5",
                },
            },
        },
    };

    useEffect(() => {
        async function fetchSchoolData() {
            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());

                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                };
                const school_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/school/${schoolId}`, requestOptions);
                const school_data = await school_res.json()

                setStudents(school_data.students);

            } catch (e) {
                console.log(e);
            }
        }

        if (schoolId) {
            fetchSchoolData()
        }
    }, [schoolId]);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const user = auth.currentUser;
                const token = user && (await user.getIdToken());
                const userId = user.uid;

                const requestOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                };

                // Fetch user data to check if they are an instructor
                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
                const userData = await user_res.json();

                setUserRole(userData.role);
                setSchoolId(userData.school_id);

                let cleaned_practical_data = [];


                // Check if user is an instructor
                if (userData.role === "instructor") {
                    // Fetch instructor's practicals
                    const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/instructor/${user.uid}`, requestOptions);
                    const instructorPracticals = await practical_res.json();

                    // Process each practical and organize by student
                    for (let practical of instructorPracticals) {
                        const participants = practical.user_participants;
                        let studentsData = {};

                        // Fetch each student's details
                        for (let studentId of participants) {
                            const student_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${studentId}`, requestOptions);
                            const studentData = await student_res.json();

                            // Clean tasks
                            let cleaned_tasks = practical.tasks.map((task) => ({
                                name: task.name,
                                red_count: task.red_count,
                                yellow_count: task.yellow_count,
                                green_count: task.green_count,
                                comments: [],
                            }));

                            // Fetch and organize comments for each task
                            for (let commentId of practical.comments) {
                                const comment_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`, requestOptions);
                                const commentData = await comment_res.json();

                                if (commentData.feedback !== "") {
                                    let task_index = cleaned_tasks.findIndex((task) => task.name === commentData.task);
                                    if (task_index !== -1) {
                                        cleaned_tasks[task_index].comments.push({
                                            rating: commentData.rating,
                                            feedback: commentData.feedback,
                                        });
                                    }
                                }
                            }

                            // Add cleaned tasks under each student
                            studentsData[studentData.real_name] = {
                                name: studentData.real_name,
                                tasks: cleaned_tasks,
                            };
                        }

                        // Clean practical data for each student
                        let cleanPractical = {
                            practical_name: practical.practical_name,
                            creation_date: format(practical.creation_date, 'MMMM do yyyy, h:mm:ss a'),
                            students: studentsData,  // Organize by student names
                        };

                        cleaned_practical_data.push(cleanPractical);
                    }

                } else {
                    // If the user is not an instructor (fetch practicals for a student)
                    const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/student/${user.uid}`, requestOptions);
                    const practicalData = await practical_res.json();

                    // Clean practicals for student
                    practicalData.map((practical) => {
                        let cleaned_tasks = practical.tasks.map((task) => ({
                            name: task.name,
                            red_count: task.red_count,
                            yellow_count: task.yellow_count,
                            green_count: task.green_count,
                            comments: [],
                        }));

                        practical.comments.map(async (commentId) => {
                            const comment_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`, requestOptions);
                            const commentData = await comment_res.json();

                            if (commentData.feedback === "") return;

                            let task_index = cleaned_tasks.findIndex((task) => task.name === commentData.task);
                            if (task_index !== -1) {
                                cleaned_tasks[task_index].comments.push({
                                    rating: commentData.rating,
                                    feedback: commentData.feedback,
                                });
                            }
                        });

                        let cleanPractical = {
                            name: practical.practical_name,
                            creation_date: format(practical.creation_date, 'MMMM do yyyy, h:mm:ss a'),
                            avg_rating: practical.avg_rating,
                            tasks: cleaned_tasks,
                        };

                        cleaned_practical_data.push(cleanPractical);
                    });
                }

                // Construct cleaned data to be set in state
                const cleanedData = {
                    name: userData.real_name,
                    role: userData.role,
                    cohort_year: userData.grad_year,
                    practicals: cleaned_practical_data,
                };

                setUserPerfData(cleanedData);
            } catch (e) {
                console.log(e);
            }
        }

        if (currentUser) {
            fetchUserData();
        }
    }, [currentUser]);


    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, currentWordIndex]);

    useEffect(() => {
        // Update the AI message one word at a time
        if (isAiTyping) {
            const words = messages[messages.length - 1].text.split(' '); // Get the latest AI message
            if (currentWordIndex < words.length) {
                const timer = setTimeout(() => {
                    setCurrentAiMessage(prev => prev + (prev ? ' ' : '') + words[currentWordIndex]); // Add the next word to the message
                    setCurrentWordIndex(prevIndex => prevIndex + 1); // Increment word index
                }, typingDelay); // Adjust this for the desired typing speed

                return () => clearTimeout(timer);
            } else {
                setIsAiTyping(false); // Stop typing when all words are displayed
            }
        }
    }, [isAiTyping, currentWordIndex, messages]);


    const handleSendMessage = async () => {
        if (input.trim()) {
            // Append the new user message locally.
            const userMessage = { text: input, sender: 'user' };
            setMessages(prevMessages => [...prevMessages, userMessage]);

            // Prepare the prompt.
            const prompt = `User: ${input}`;
            setInput('');

            try {
                // Convert local messages (stored as { text, sender }) into the format expected by the backend.
                const conversationHistory = messages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }));

                // Check if the prompt includes a tag like @[{student6}]({student6@pulse.edu})
                const tagRegex = /@\[(.*?)\]\((.*?)\)/;
                const tagMatch = prompt.match(tagRegex);
                let customFilter = {};
                if (tagMatch) {
                    // Build a string that matches the stored metadata format:
                    // "{student6}|{student6@pulse.edu}"
                    const studentName = tagMatch[1].replace(/[{}]/g, "").trim();
                    const studentEmail = tagMatch[2].replace(/[{}]/g, "").trim();
                    const tagString = `${studentName}|${studentEmail}`;



                    customFilter = { "student_tag": { "$in": [...new Set([tagString])] } };
                }

                // Build the payload. Include filter only if a tag was found.
                const payload = {
                    messages: [
                        {
                            role: 'system',
                            content:
                                "You are a helpful teaching assistant for practical healthcare education. " +
                                "Answer using data from practicals that are relevant to the user based on their id."
                        },
                        ...conversationHistory,
                        { role: 'user', content: prompt }
                    ],
                    userId: currentUser.uid,
                    role: userRole,
                    ...(Object.keys(customFilter).length > 0 ? { filter: customFilter } : {})
                };

                const response = await axios.post(
                    `${process.env.REACT_APP_API_HOST}/api/chat`,
                    payload
                );

                console.log(response.data);
                // According to the new response format:
                // response.response is the assistant's message,
                // response.chatHistory is the updated conversation history,
                // response.threadId is the conversation id.
                const aiMessage = response.data.response;
                setMessages(prevMessages => [
                    ...prevMessages,
                    { text: aiMessage.content, sender: 'ai' }
                ]);

                // Reset any typing state.
                setCurrentAiMessage('');
                setCurrentWordIndex(0);
                setIsAiTyping(true);
            } catch (error) {
                console.error("Error calling API:", error);
            }
        }
    };


    // Get the last AI message to determine if we should show the typing effect
    const lastMessage = messages[messages.length - 1];
    const aiMessageText = lastMessage.sender === 'ai' ? lastMessage.text : '';

    return (
        <Paper elevation={3} style={{ width: "75%", padding: '20px', height: '500px', display: 'flex', flexDirection: 'column' }}>
            <List style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                    <ListItem key={index} style={{
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.sender === 'user' ? '#d1e7dd' : '#f8d7da',
                        borderRadius: '8px',
                        margin: '5px',
                        padding: '10px',
                        maxWidth: '70%',
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                        <ListItemText
                            primary={<span style={{ fontWeight: msg.sender === 'ai' ? 'bold' : 'normal' }}>
                                {msg.sender === 'ai' ? "AI: " : "You: "}
                                <ReactMarkdown>{msg.sender === 'ai' ? (msg.text === aiMessageText ? currentAiMessage : msg.text) : msg.text}</ReactMarkdown>
                            </span>}
                        />
                    </ListItem>
                ))}
                {/* Empty div to scroll to */}
                <div ref={endOfMessagesRef} />
            </List>

            <MentionsInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={mentionInputStyle}
                placeholder="Type your message..."
                fullWidth
            >
                <Mention
                    trigger="@"
                    data={students.map((p) => ({
                        id: p.email,
                        display: p.real_name,
                    }))}
                    markup="@[{__display__}]({__id__})"
                    displayTransform={(id, display) => `@${display}`}
                />
            </MentionsInput>
            <Button variant="contained" color="primary" onClick={handleSendMessage} style={{ marginTop: '10px' }}>
                Send
            </Button>
        </Paper>
    );

};

export default ChatInterface;

