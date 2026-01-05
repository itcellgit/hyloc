import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import axios from 'axios';
import '../styles/Departments.css';

const API_BASE_URL = 'http://localhost:5000/api';

function Departments() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/' },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments' },
    { id: 3, label: 'Users', icon: '👥', path: '/users' },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis' },
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/departments`);
      setDepartments(response.data.data);
      setError('');
    } catch (err) {
      const errorMsg = 'Failed to load departments';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handleAddNew = () => {
    setEditingDepartment(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name || department.department_name
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/departments/${id}`);
      showNotification('Department deleted successfully!', 'success');
      fetchDepartments();
    } catch (err) {
      const errorMsg = 'Failed to delete department: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingDepartment) {
        await axios.put(`${API_BASE_URL}/departments/${editingDepartment.id}`, formData);
        showNotification('Department updated successfully!', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/departments`, formData);
        showNotification('Department created successfully!', 'success');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      const errorMsg = 'Failed to save department: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="departments-layout">
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
                href={item.path}
                className={`nav-item ${item.id === 2 ? 'active' : ''}`}
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
            <h2>Departments</h2>
            <button className="btn-primary" onClick={handleAddNew}>
              <span>+</span> Add Department
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading departments...</div>
          ) : (
            <div className="table-container">
              <table className="departments-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="no-data">No departments found</td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.id}>
                        <td>{dept.id}</td>
                        <td>{dept.name || dept.department_name}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => handleEdit(dept)}>
                              ✏️ Edit
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(dept.id)}>
                              🗑️ Delete
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
              <h3>{editingDepartment ? 'Edit Department' : 'Add New Department'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter department name"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Departments;
