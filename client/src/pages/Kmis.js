import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import axios from 'axios';
import '../styles/Kmis.css';

const API_BASE_URL = 'http://localhost:5000/api';

function Kmis() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [kmis, setKmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKmi, setEditingKmi] = useState(null);
  const [formData, setFormData] = useState({
    title: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/' },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments' },
    { id: 3, label: 'Users', icon: '👥', path: '/users' },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis' },
    { id: 5, label: "KPI's", icon: '🎯', path: '#' },
    { id: 6, label: "KAI's", icon: '⭐', path: '#' },
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchKmis();
  }, []);

  const fetchKmis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/kmis`);
      setKmis(response.data.data);
      setError('');
    } catch (err) {
      const errorMsg = 'Failed to load KMIs';
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

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  const handleAddNew = () => {
    setEditingKmi(null);
    setFormData({ title: '' });
    setShowModal(true);
  };

  const handleEdit = (kmi) => {
    setEditingKmi(kmi);
    setFormData({
      title: kmi.title || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this KMI?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/kmis/${id}`);
      showNotification('KMI deleted successfully!', 'success');
      fetchKmis();
    } catch (err) {
      const errorMsg = 'Failed to delete KMI: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingKmi) {
        await axios.put(`${API_BASE_URL}/kmis/${editingKmi.id}`, formData);
        showNotification('KMI updated successfully!', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/kmis`, formData);
        showNotification('KMI created successfully!', 'success');
      }
      setShowModal(false);
      fetchKmis();
    } catch (err) {
      const errorMsg = 'Failed to save KMI: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="kmis-layout">
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
                  <button className="dropdown-item" onClick={() => setDropdownOpen(false)}>
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
                className={`nav-item ${item.id === 5 ? 'active' : ''}`}
                onClick={(e) => {
                  if (item.path !== '#') {
                    e.preventDefault();
                    navigate(item.path);
                  }
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
            <h2>Key Management Indicators (KMIs)</h2>
            <button className="btn-primary" onClick={handleAddNew}>
              <span>+</span> Add KMI
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading KMIs...</div>
          ) : (
            <div className="table-container">
              <table className="kmis-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Title</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kmis.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="no-data">No KMIs found</td>
                    </tr>
                  ) : (
                    kmis.map((kmi, index) => (
                      <tr key={kmi.id}>
                        <td>{index + 1}</td>
                        <td>{kmi.title}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => handleEdit(kmi)}>
                              ✏️ Edit
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(kmi.id)}>
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
              <h3>{editingKmi ? 'Edit KMI' : 'Add New KMI'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>KMI Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter KMI title"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingKmi ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kmis;
