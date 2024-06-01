import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from './components/accounts/Register';
import Login from './components/accounts/Login';
import Home from './components/pages/Home';
import Practical from './components/pages/Practical';
import Dashboard from './components/pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import ErrorMessage from './components/layouts/ErrorMessage';
import WithPrivateRoute from './utils/WithPrivateRoute';
import Box from '@mui/material/Box';



function App() {
  return (
    <AuthProvider>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <ErrorMessage />
          <Routes>
            <Route exact path="/dashboard" element={<Dashboard />} />
            <Route exact path="/home" element={<Home />} />
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
