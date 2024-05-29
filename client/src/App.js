import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from './components/accounts/Register';
import Login from './components/accounts/Login';
import Home from './components/Home';
import { AuthProvider } from './contexts/AuthContext';
import ErrorMessage from './components/layouts/ErrorMessage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorMessage />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/login" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
