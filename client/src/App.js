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
import UserDashboard from './pages/UserDashboard';
import UserKmis from './pages/UserKmis';
import UserKmiDetail from './pages/UserKmiDetail';
import UserPillars from './pages/UserPillars';
import { authService } from './services/auth';
import './styles/App.css';

const getStoredRoles = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return [];
    const user = JSON.parse(storedUser);
    return (user?.roles || [])
      .map(r => r.role_name?.toLowerCase())
      .filter(Boolean);
  } catch (err) {
    return [];
  }
};

const getDefaultRoute = (rolesOverride = null) => {
  const roles = rolesOverride || getStoredRoles();
  const hasAdminRole = roles.includes('admin');
  const hasEmployeeRole = roles.includes('employee');
  const hasManagementRole = roles.some(r => ['management', 'manager'].includes(r));

  if (hasAdminRole) return '/dashboard';
  if (hasEmployeeRole) return '/employee-dashboard';
  if (hasManagementRole) return '/user-dashboard';
  return '/user-dashboard';
};

function ProtectedRoute({ children, allowedRoles }) {
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && allowedRoles.length > 0) {
    const roles = getStoredRoles();
    const hasAccess = roles.some(r => allowedRoles.includes(r));
    if (!hasAccess) {
      return <Navigate to={getDefaultRoute(roles)} replace />;
    }
  }

  return children;
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
                <Navigate to={getDefaultRoute()} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Departments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kmis" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Kmis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pillers" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Pillers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kmis/:id" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <KmiDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/roles" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Roles />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-roles" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserRoles />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['management', 'manager']}>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-kmis" 
            element={
              <ProtectedRoute allowedRoles={['management', 'manager']}>
                <UserKmis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-kmis/:id" 
            element={
              <ProtectedRoute allowedRoles={['management', 'manager']}>
                <UserKmiDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-pillars" 
            element={
              <ProtectedRoute allowedRoles={['management', 'manager']}>
                <UserPillars />
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
