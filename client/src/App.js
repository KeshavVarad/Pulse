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
import WithPublicRoute from './utils/WithPublicRoute';
import MakePractical from './components/pages/MakePractical';
import Layout from './components/layouts/Layout';
import Analytics from './components/pages/Analytics';
import Account from './components/pages/Account';
import { Box } from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import theme from './theme';
import CssBaseline from '@mui/material/CssBaseline';
import TeachingAssistant from './components/pages/TeachingAssistant';
import LearnMore from './components/pages/LearnMore';
import UserGuide from './components/pages/UserGuide';
import MarkdownDisplay from './components/elements/MarkdownDisplay';
import TutorialDashboard from './components/pages/TutorialDashboard';
import TutorialAdmin from './components/pages/Tutorial_Groups/TutorialAdmin';
import TutorialInstructor from './components/pages/Tutorial_Groups/TutorialInstructor';
import TutorialStudent from './components/pages/Tutorial_Groups/TutorialStudent';

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
                <Route path="/user_guides" exact element={<TutorialDashboard />} />
                <Route path="/user_guides/admin" exact element={<TutorialAdmin />} />
                <Route path="/user_guides/instructor" exact element={<TutorialInstructor />} />
                <Route path="/user_guides/student" exact element={<TutorialStudent />} />
                <Route path="/user_guides/:role/:tutorial" element={<MarkdownDisplay />} />
                
                <Route exact path="/dashboard" element={
                     <WithPrivateRoute>
                     <Dashboard />
                    </WithPrivateRoute>

                } />
                <Route exact path="/" element={
                     <WithPublicRoute>
                     <Home />
                    </WithPublicRoute>
                  
                } />
                <Route exact path="/register_school" element={<Register />} />
                <Route exact path="/register_user" element={<RegisterUser />} />
                <Route exact path="/login" element={<Login />} />
                <Route exact path="/learn_more" element={<LearnMore />} />
                <Route exact path="/user_guides" element={<UserGuide />} />
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

                <Route exact path="/aita" element={
                  <WithPrivateRoute>
                    <TeachingAssistant />
                  </WithPrivateRoute>
                } />

                <Route exact path="/account" element={
                  <WithPrivateRoute>
                    <Account />
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
