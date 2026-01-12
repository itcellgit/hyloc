import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Users from './pages/admin/Users';
import Kmis from './pages/Kmis';
import KmiDetail from './pages/KmiDetail';
import Pillers from './pages/Pillers';
import Profile from './pages/Profile';
import Roles from './pages/Roles';
import UserRoles from './pages/admin/UserRoles';
import Unauthorized from './pages/Unauthorized';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { authService } from './services/auth';
import './styles/App.css';

function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <Router>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee-dashboard" 
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
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
            path="/kmis" 
            element={
              <ProtectedRoute>
                <Kmis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pillers" 
            element={
              <ProtectedRoute>
                <Pillers />
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
            path="/roles" 
            element={
              <ProtectedRoute>
                <Roles />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-roles" 
            element={
              <ProtectedRoute>
                <UserRoles />
              </ProtectedRoute>
            } 
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
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
