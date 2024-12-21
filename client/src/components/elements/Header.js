import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Box, Button, Menu, MenuItem, Badge, IconButton, Typography } from "@mui/material";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import NotificationsIcon from '@mui/icons-material/Notifications';

export default function Header() {
    const { currentUser, logout, setError } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);

    async function handleLogout() {
        try {
            setError("");
            await logout();
            navigate("/");
        } catch {
            setError("Failed to logout");
        }
    }

    // Fetch notifications from the API
    const fetchNotifications = async () => {
        if (currentUser) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/notification/user/${currentUser.uid}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch notifications");
                }
                const userNotifications = await response.json();
                setNotifications(userNotifications);
                const unread = userNotifications.filter(n => !n.read_status).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        }
    };

    // Set up interval to fetch notifications every 10 seconds
    useEffect(() => {
        const intervalId = setInterval(fetchNotifications, 10000); // Fetch every 10 seconds

        // Fetch notifications immediately on mount
        fetchNotifications();

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, [currentUser]); // Dependencies array ensures it only runs when currentUser changes

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Navigate to the practical page
            navigate(`/practical/${notification.practical_id}`);

            // Update the notification to mark it as read
            const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/updateNotification/${notification.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ read_status: true }),
            });

            if (!response.ok) {
                throw new Error('Failed to update notification');
            }
        } catch (error) {
            console.error(error);
        } finally {
            handleMenuClose();
        }
    };

    return (
        <div>
            <AppBar position='fixed'>
                <Toolbar sx={{ height: 6 }}>
                    {
                        !currentUser ? (
                            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <MonitorHeartIcon fontSize='large' />
                            </Link>
                        ) : (<Box></Box>)
                    }
                    {
                        !currentUser ? (
                            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <h1> Pulse</h1>
                            </Link>
                        ) : (<Box></Box>)
                    }

                    <Box sx={{
                        width: "100%",
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'right',
                        alignContent: 'right',
                        p: 1,
                        m: 1
                    }}>
                        {
                            !currentUser ? (
                                <Box sx={{

                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                }}>
                                    <Button component={Link} to="/login" variant="contained" color="primary">
                                        Login
                                    </Button>
                                    <Button component={Link} to="/register_school" variant="contained">
                                        Register School
                                    </Button>
                                    <Button component={Link} to="/register_user" variant="contained">
                                        Register User
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <IconButton onClick={handleMenuOpen} color="inherit">
                                        <Badge badgeContent={unreadCount} color="secondary">
                                            <NotificationsIcon />
                                        </Badge>
                                    </IconButton>
                                    <Button onClick={handleLogout} variant="contained" color="primary" sx={{ ml: 2 }}>
                                        Logout
                                    </Button>

                                    {/* Notification Menu */}
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                        PaperProps={{
                                            style: {
                                                width: '300px',
                                                borderRadius: '8px',
                                                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
                                            },
                                        }}
                                    >
                                        {notifications.length > 0 ? (
                                            notifications.map(notification => (
                                                <MenuItem
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'flex-start',
                                                        padding: '12px',
                                                        whiteSpace: 'normal',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        backgroundColor: notification.read_status ? 'transparent' : '#e3f2fd', // Light blue for unread notifications
                                                        borderRadius: '4px',
                                                        transition: 'background-color 0.3s ease',
                                                        '&:hover': {
                                                            backgroundColor: notification.read_status ? 'transparent' : '#bbdefb', // Darker blue on hover for unread notifications
                                                        },
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2" // Changed to subtitle2 for a more subtle emphasis
                                                        component="strong"
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            fontWeight: notification.read_status ? 'normal' : '500', // Semi-bold for unread notifications
                                                        }}
                                                    >
                                                        {notification.task}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="textSecondary"
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            marginTop: '4px',
                                                        }}
                                                    >
                                                        {notification.message}
                                                    </Typography>
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem onClick={handleMenuClose}>
                                                <Typography variant="body1" color="textSecondary">No notifications</Typography>
                                            </MenuItem>
                                        )}
                                    </Menu>


                                </Box>
                            )}
                    </Box>
                </Toolbar>
            </AppBar>
        </div>
    );
}
