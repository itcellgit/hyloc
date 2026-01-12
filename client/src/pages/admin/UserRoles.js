import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { authService } from '../../services/auth';
import '../../styles/admin/UserRoles.css';

function UserRoles() {
  const [userRoles, setUserRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    role_id: '',
    status: 'active'
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/', roles: ['Admin'] },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments', roles: ['Admin'] },
    { id: 3, label: 'Users', icon: '👥', path: '/users', roles: ['Admin'] },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis', roles: ['Admin'] },
    { id: 7, label: 'Pillers', icon: '🏛️', path: '/pillers', roles: ['Admin'] },
    { id: 5, label: 'Roles', icon: '🎭', path: '/roles', roles: ['Admin'] },
    { id: 6, label: 'User Roles', icon: '🔐', path: '/user-roles', roles: ['Admin'] },
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleWindowResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchUserRoles(), fetchUsers(), fetchRoles()]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    const response = await api.get('/user-roles');
    setUserRoles(response.data.data || []);
  };

  const fetchUsers = async () => {
    const response = await api.get('/users');
    setUsers(response.data.data || []);
  };

  const fetchRoles = async () => {
    const response = await api.get('/roles');
    setRoles(response.data.data || []);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      authService.removeToken();
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      authService.removeToken();
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return `${user.firstname} ${user.lastname}`;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  const handleAddNew = () => {
    setEditingUserRole(null);
    setFormData({
      user_id: '',
      role_id: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleEdit = (userRole) => {
    setEditingUserRole(userRole);
    setFormData({
      user_id: userRole.user_id || '',
      role_id: userRole.role_id || '',
      status: userRole.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this role assignment?')) {
      return;
    }

    try {
      const response = await api.delete(`/user-roles/${id}`);
      if (response.data.success) {
        showNotification('Role assignment removed successfully!', 'success');
        fetchUserRoles();
      }
    } catch (err) {
      const errorMsg = 'Failed to remove role assignment: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUserRole) {
        const response = await api.put(`/user-roles/${editingUserRole.id}`, formData);
        if (response.data.success) {
          showNotification('Role assignment updated successfully!', 'success');
          setShowModal(false);
          fetchUserRoles();
        }
      } else {
        const response = await api.post('/user-roles', formData);
        if (response.data.success) {
          showNotification('Role assigned successfully!', 'success');
          setShowModal(false);
          fetchUserRoles();
        }
      }
    } catch (err) {
      const errorMsg = 'Failed to save role assignment: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstname} ${user.lastname}` : 'Unknown User';
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.role_name : 'Unknown Role';
  };

  return (
    <div className="user-roles-layout">
      <header className="header">
        <div className="header-content">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-logo-section">
            <img src="/hyloc-logo.png" alt="Hyloc Logo" className="header-logo" />
            <h1 className="header-title">Hyloc Hydro technic Pvt Ltd</h1>
          </div>
          <div className="header-actions">
            <div className="user-profile" ref={dropdownRef}>
              <button className="profile-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className="profile-icon">👤</span>
                <span className="profile-name">{getUserDisplayName()}</span>
                <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
              </button>
              
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-user-icon">👤</div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">{getUserDisplayName()}</div>
                      <div className="dropdown-user-email">{user?.email || ''}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>
                    <span className="dropdown-item-icon">👤</span>
                    View Profile
                  </button>
                  <button className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <span className="dropdown-item-icon">⚙️</span>
                    Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <span className="dropdown-item-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <a
                key={item.id}
                href="#"
                className={`nav-item ${item.id === 6 ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className={`content ${sidebarOpen ? 'expanded' : 'full'}`}>
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-icon">{notification.type === 'success' ? '✓' : '✕'}</span>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={() => setNotification({ show: false, message: '', type: '' })}>×</button>
            </div>
          )}

          <div className="page-header">
            <h2>User Role Assignments</h2>
            <button className="btn-primary" onClick={handleAddNew}>
              <span>+</span> Assign Role
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading user roles...</div>
          ) : (
            <div className="table-container">
              <table className="user-roles-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Assigned At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userRoles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">No role assignments found</td>
                    </tr>
                  ) : (
                    userRoles.map((ur, index) => (
                      <tr key={ur.id}>
                        <td>{index + 1}</td>
                        <td>{getUserName(ur.user_id)}</td>
                        <td>
                          <span className={`role-badge role-${getRoleName(ur.role_id).toLowerCase()}`}>
                            {getRoleName(ur.role_id)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${ur.status || 'active'}`}>
                            {ur.status || 'active'}
                          </span>
                        </td>
                        <td>{ur.created_at ? new Date(ur.created_at).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => handleEdit(ur)}>
                              ✏️ Edit
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(ur.id)}>
                              🗑️ Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUserRole ? 'Edit Role Assignment' : 'Assign Role to User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>User *</label>
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    required
                    disabled={editingUserRole !== null}
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstname} {u.lastname} ({u.empid})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUserRole ? 'Update' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserRoles;
