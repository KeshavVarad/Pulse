import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from './components/accounts/Register';
import Login from './components/accounts/Login';
import Home from './components/pages/Home';
import Practical from './components/pages/Practical';
import Dashboard from './components/pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import ErrorMessage from './components/layouts/ErrorMessage';
import Header from './components/layouts/Header';
import WithPrivateRoute from './utils/WithPrivateRoute';
import Box from '@mui/material/Box';
import NavBar from './components/elements/NavBar';





function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Box sx={{ display: 'flex' }}>
<<<<<<< HEAD
        <NavBar/>
        <ErrorMessage />
        <Routes>
          <Route exact path="/" element={<Dashboard />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/practical/:id" element={<Practical />} />
=======
          <Drawer sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
            variant="permanent"
            anchor="left">
            <Toolbar />
            <Divider />
            <List>
              {/* {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
                        <ListItem key={text} disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                            {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                            </ListItemIcon>
                            <ListItemText primary={text} />
                        </ListItemButton>
                        </ListItem>
                    ))} */}
            </List>
            <Divider />
>>>>>>> 5338b668c4d9e165bde3831c65eecf9d24b51075

          </Drawer>
          <ErrorMessage />
          <Routes>
            <Route exact path="/" element={<Dashboard />} />
            <Route exact path="/register" element={<Register />} />
            <Route exact path="/login" element={<Login />} />
            <Route exact path="/practical/:id" element={<Practical />} />

          </Routes>
        </Box>
      </Router>
    </AuthProvider>
  );
}

export default App;
