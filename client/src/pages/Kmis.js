import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import axios from 'axios';
import '../styles/Kmis.css';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get current financial year
const getInitialYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const endYear = fyStartYear + 1;
  return `${fyStartYear}-${endYear.toString().slice(-2)}`;
};

function Kmis() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [kmis, setKmis] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(getInitialYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKmi, setEditingKmi] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    fin_year: ''
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

  // Generate financial years on component mount
  useEffect(() => {
    const { years } = generateFinancialYears();
    setFinancialYears(years);
  }, []);

  // Fetch KMIs when selected year changes
  useEffect(() => {
    const loadKmis = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/kmis?fin_year=${selectedYear}`);
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
    
    if (selectedYear) {
      loadKmis();
    }
  }, [selectedYear]);

  const generateFinancialYears = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Determine current financial year (April - March)
    // If current month is April (3) or later, FY starts this year
    // Otherwise, FY started last year
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const currentFinYear = `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`;

    const years = [];
    // Previous 2 years
    for (let i = 2; i >= 1; i--) {
      const start = fyStartYear - i;
      const end = start + 1;
      years.push(`${start}-${end.toString().slice(-2)}`);
    }
    // Current year
    years.push(currentFinYear);
    // Next 1 year
    const nextStart = fyStartYear + 1;
    const nextEnd = nextStart + 1;
    years.push(`${nextStart}-${nextEnd.toString().slice(-2)}`);

    return { years, currentFinYear };
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
    setFormData({ 
      title: '',
      fin_year: selectedYear 
    });
    setShowModal(true);
  };

  const handleEdit = (kmi) => {
    setEditingKmi(kmi);
    setFormData({
      title: kmi.title || '',
      fin_year: kmi.fin_year || selectedYear
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
      setSelectedYear(selectedYear); // Trigger reload
    } catch (err) {
      const errorMsg = 'Failed to delete KMI: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleView = (kmi) => {
    navigate(`/kmis/${kmi.id}`, { state: { kmi } });
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
      if (selectedYear) {
        setSelectedYear(selectedYear); // Trigger reload
      }
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
                className={`nav-item ${item.id === 4 ? 'active' : ''}`}
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
            <div className="header-section">
              <h2>Key Management Indicators (KMIs)</h2>
              <div className="year-filter">
                <label htmlFor="financial-year">Financial Year:</label>
                <select
                  id="financial-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="year-dropdown"
                >
                  {financialYears.length === 0 ? (
                    <option value="">No financial years available</option>
                  ) : (
                    financialYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
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
                            <button className="btn-view" onClick={() => handleView(kmi)}>
                              👁️ View
                            </button>
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
                <label>Financial Year *</label>
                <select
                  name="fin_year"
                  value={formData.fin_year}
                  onChange={handleChange}
                  required
                  className="fin-year-select"
                >
                  <option value="">Select Financial Year</option>
                  {financialYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
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
