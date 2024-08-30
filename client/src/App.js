import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from './components/accounts/Register';
import RegisterUser from './components/accounts/RegisterUser';
import Login from './components/accounts/Login';
import Home from './components/pages/Home';
import Practical from './components/pages/Practical';
import Dashboard from './components/pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import ErrorMessage from './components/layouts/ErrorMessage';
import WithPrivateRoute from './utils/WithPrivateRoute';
import MakePractical from './components/pages/MakePractical';
import Layout from './components/layouts/Layout';
import Analytics from './components/pages/Analytics';
import { Box } from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import theme from './theme';
import CssBaseline from '@mui/material/CssBaseline';


function App() {


  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />

    
    <AuthProvider>
      <Router>

        <Box sx={{
          minHeight: "100vh"
        }}>


          <Layout>
            <ErrorMessage />


            <Routes>
              <Route exact path="/dashboard" element={<Dashboard />} />
              <Route exact path="/" element={<Home />} />
              <Route exact path="/register_school" element={<Register />} />
              <Route exact path="/register_user" element={<RegisterUser />} />
              <Route exact path="/login" element={<Login />} />
              <Route exact path="/practical/:id" element={
                <WithPrivateRoute>
                  <Practical />
                </WithPrivateRoute>
              } />
              <Route exact path="/makepractical" element={
                <WithPrivateRoute>
                  <MakePractical />
                </WithPrivateRoute>
              } />

              <Route exact path="/analytics" element={
                <WithPrivateRoute>
                  <Analytics />
                </WithPrivateRoute>
              } />
            </Routes>




          </Layout>
        </Box>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
