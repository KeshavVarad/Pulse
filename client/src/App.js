import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from './components/accounts/Register';
import Login from './components/accounts/Login';
import Home from './components/pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import ErrorMessage from './components/layouts/ErrorMessage';
import Header from './components/layouts/Header';
import WithPrivateRoute from './utils/WithPrivateRoute';
import Practical from './components/pages/Practical';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <ErrorMessage />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/practical/:id" element={<Practical />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
