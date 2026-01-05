import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { authService } from '../services/auth';
import '../styles/Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    empid: '',
    firstname: '',
    middlename: '',
    lastname: '',
    email: '',
    phone: '',
    bloodgroup: '',
    address: '',
    department_id: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/' },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments' },
    { id: 3, label: 'Users', icon: '👥', path: '/users' },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis' },
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadUserProfile(parsedUser.id);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      setLoading(true);
      const response = await userService.getById(userId);
      const userData = response.data.data;
      setFormData({
        empid: userData.empid || '',
        firstname: userData.firstname || '',
        middlename: userData.middlename || '',
        lastname: userData.lastname || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bloodgroup: userData.bloodgroup || '',
        address: userData.address || '',
        department_id: userData.department_id || ''
      });
    } catch (error) {
      showNotification('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return `${user.firstname} ${user.lastname}`;
  };

  const handleLogout = () => {
    authService.removeToken();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await userService.update(user.id, formData);
      
      // Update local storage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setIsEditing(false);
      showNotification('Profile updated successfully', 'success');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to update profile', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      // You'll need to create this endpoint
      await userService.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showNotification('Password changed successfully', 'success');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to change password', 'error');
    }
  };

  const handleCancelEdit = () => {
    // Reload original data
    loadUserProfile(user.id);
    setIsEditing(false);
  };

  return (
    <div className="profile-layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1 className="header-title">Hyloc</h1>
          </div>
          <div className="header-right">
            <div className="user-profile" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
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
                  <button className="dropdown-item active" onClick={() => setDropdownOpen(false)}>
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
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <a
                key={item.id}
                href={item.path}
                className="nav-item"
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`content ${sidebarOpen ? 'expanded' : 'full'}`}>
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading profile...</div>
          ) : (
            <div className="profile-container">
              <div className="profile-header">
                <h2>My Profile</h2>
                {!isEditing ? (
                  <button className="btn-edit" onClick={() => setIsEditing(true)}>
                    ✏️ Edit Profile
                  </button>
                ) : null}
              </div>

              <div className="profile-content">
                <div className="profile-sidebar-info">
                  <div className="profile-avatar">
                    <span className="avatar-icon">👤</span>
                  </div>
                  <h3>{getUserDisplayName()}</h3>
                  <p className="profile-empid">Employee ID: {formData.empid}</p>
                  <button 
                    className="btn-change-password"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    🔒 Change Password
                  </button>
                </div>

                <div className="profile-details">
                  <form onSubmit={handleUpdateProfile}>
                    <div className="form-section">
                      <h3>Personal Information</h3>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Employee ID</label>
                          <input
                            type="text"
                            name="empid"
                            value={formData.empid}
                            disabled
                            className="input-disabled"
                          />
                        </div>

                        <div className="form-group">
                          <label>First Name *</label>
                          <input
                            type="text"
                            name="firstname"
                            value={formData.firstname}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Middle Name</label>
                          <input
                            type="text"
                            name="middlename"
                            value={formData.middlename}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="form-group">
                          <label>Last Name *</label>
                          <input
                            type="text"
                            name="lastname"
                            value={formData.lastname}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Email *</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Phone</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="form-group">
                          <label>Blood Group</label>
                          <select
                            name="bloodgroup"
                            value={formData.bloodgroup}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label>Address</label>
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            rows="3"
                          />
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-save">
                          Save Changes
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
