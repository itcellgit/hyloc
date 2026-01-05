import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Users from './pages/Users';
import Posts from './pages/Posts';
import Kmis from './pages/Kmis';
import KmiDetail from './pages/KmiDetail';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { authService } from './services/auth';
import './styles/App.css';

function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute>
                <Departments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/posts" 
            element={
              <ProtectedRoute>
                <Posts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kmis" 
            element={
              <ProtectedRoute>
                <Kmis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kmis/:id" 
            element={
              <ProtectedRoute>
                <KmiDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
