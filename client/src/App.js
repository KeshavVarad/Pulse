import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from './components/accounts/Register';
import Login from './components/accounts/Login';
import Home from './components/pages/Home';
import Practical from './components/pages/Practical';
import Dashboard from './components/pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import ErrorMessage from './components/layouts/ErrorMessage';
import WithPrivateRoute from './utils/WithPrivateRoute';
import Grid from '@mui/material/Box';
import MakePractical from './components/pages/MakePractical';
import SideBar from './components/elements/SideBar';
import Layout from './components/layouts/Layout';

function App() {



  return (
    <AuthProvider>

      <Router>
        <Layout>
          <ErrorMessage />


          <Routes>
            <Route exact path="/dashboard" element={<Dashboard />} />
            <Route exact path="/" element={<Home />} />
            <Route exact path="/register" element={<Register />} />
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
          </Routes>


        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
