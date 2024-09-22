import React, { useEffect, useRef, useState } from 'react';
import { TextField, Button, List, ListItem, ListItemText, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import auth from '../../config/firebase';
import { format } from 'date-fns';
import OpenAI from "openai";
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const ChatInterface = () => {
    const { currentUser } = useAuth()

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const endOfMessagesRef = useRef(null);

    const [userPerfData, setUserPerfData] = useState();

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
                const user_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/user/${userId}`, requestOptions);
                const userData = await user_res.json()

                const practical_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/practical/student/${user.uid}`, requestOptions);
                const practicalData = await practical_res.json();

                let cleaned_practical_data = []

                practicalData.map((practical) => {

                    let cleaned_tasks = []

                    practical.tasks.map((task) => {
                        cleaned_tasks.push({
                            name: task.name,
                            red_count: task.red_count,
                            yellow_count: task.yellow_count,
                            green_count: task.green_count,
                            comments: []
                        })
                    })

                    practical.comments.map(async (commentId) => {
                        const comment_res = await fetch(`${process.env.REACT_APP_API_HOST}/api/comment/${commentId}`, requestOptions);
                        const commentData = await comment_res.json();

                        if (commentData.feedback === "") {
                            return
                        }

                        let task_index = cleaned_tasks.findIndex((task) => (task.name == commentData.task))

                        cleaned_tasks[task_index].comments.push({
                            rating: commentData.rating,
                            feedback: commentData.feedback
                        })
                    })

                    let cleanPractical = {
                        name: practical.practical_name,
                        creation_date: format(practical.creation_date, 'MMMM do yyyy, h:mm:ss a'),
                        avg_rating: practical.avg_rating,
                        tasks: cleaned_tasks
                    }

                    cleaned_practical_data.push(cleanPractical)

                })

                const cleanedData = {
                    name: userData.real_name,
                    cohort_year: userData.grad_year,
                    practicals: cleaned_practical_data
                }

                console.log(cleanedData)

                setUserPerfData(cleanedData)

            } catch (e) {
                console.log(e);
            }

        }

        if (currentUser) {
            fetchUserData()
        }

    }, [currentUser])

    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (input.trim()) {
            const userMessage = { text: input, sender: 'user' };
            setMessages((prevMessages) => [...prevMessages, userMessage]);

            const prompt = `Context: ${JSON.stringify(userPerfData)} User: ${input}`;

            setInput('');

            try {
                const response = await axios.post(`${process.env.REACT_APP_API_HOST}/api/chat`, {
                    messages: [
                        { role: 'system', content: "You are a helpful assistant." },
                        { role: 'user', content: prompt }
                    ],
                });

                const aiMessage = { text: response.data.choices[0].message.content, sender: 'ai' };
                setMessages((prevMessages) => [...prevMessages, aiMessage]);
            } catch (error) {
                console.error("Error calling API:", error);
            }

        }
    };





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
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </span>}
                        />
                    </ListItem>
                ))}
                {/* Empty div to scroll to */}
                <div ref={endOfMessagesRef} />
            </List>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button variant="contained" color="primary" onClick={handleSendMessage} style={{ marginTop: '10px' }}>
                Send
            </Button>
        </Paper>
    );
};

export default ChatInterface;

