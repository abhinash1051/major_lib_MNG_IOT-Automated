import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Books from './pages/Books';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import ArduinoPage from './pages/ArduinoPage';
import ArduinoLive from './pages/ArduinoLive';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="student-profile/:id" element={<StudentProfile />} />
          <Route path="books" element={<Books />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="arduino" element={<ArduinoPage />} />
          <Route path="arduino-live" element={<ArduinoLive />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;