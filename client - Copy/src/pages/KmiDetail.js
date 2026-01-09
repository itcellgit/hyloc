import React, { useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/auth';
import '../styles/KmiDetail.css';

function KmiDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedKpiType, setSelectedKpiType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [parentKpis, setParentKpis] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    title: '',
    fin_year: '',
    kpi_type: 'Plant KPI',
    parent_kpi_id: id || ''
  });
  const dropdownRef = useRef(null);

  const kmi = location.state?.kmi || { id, title: 'Loading...', fin_year: '' };

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/' },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments' },
    { id: 3, label: 'Users', icon: '👥', path: '/users' },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis' },
  ];

  const kpiTypes = [
    {
      id: 1,
      name: 'Plant KPI',
      color: '#3b82f6',
      icon: '🏭',
      description: 'Overall plant performance metrics'
    },
    {
      id: 2,
      name: 'Department KPI',
      color: '#ec4899',
      icon: '📋',
      description: 'Department-specific performance metrics'
    },
    {
      id: 3,
       name: 'Pillar KPI',
      color: '#8b5cf6',
      icon: '🏛️',
      description: 'Key pillar-based performance indicators'
    },
    {
      id: 4,
      name: 'Employee KPI',
      color: '#f59e0b',
      icon: '👤',
      description: 'Individual employee performance metrics'
    },
    {
      id: 5,
      name: 'KAI',
      color: '#10b981',
      icon: '🎯',
      description: 'Key Activity Indicators for specific tasks'
    }
  ];

  React.useEffect(() => {
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

  const loadParentKpis = React.useCallback(async () => {
    try {
      const response = await api.get('/kpis');
      const data = response.data?.data || [];
      const nonNullParents = data.filter((kpi) => kpi.parent_kpi_id !== null && kpi.parent_kpi_id !== undefined);
      setParentKpis(nonNullParents);
    } catch (err) {
      console.error('Failed to load parent KPIs', err);
    }
  }, []);

  React.useEffect(() => {
    loadParentKpis();
  }, [loadParentKpis]);

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    loadCategories();
  }, []);

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

  const handleKpiTypeClick = (kpiType) => {
    setSelectedKpiType(selectedKpiType?.id === kpiType.id ? null : kpiType);
  };

  const handleAddNew = () => {
    setFormData({
      title: '',
      fin_year: kmi.fin_year || '',
      kpi_type: selectedKpiType?.name || 'Plant KPI',
      parent_kpi_id: id || ''
    });
    setShowModal(true);
  };

  const getCategoryIdForType = (type) => {
    if (!type || categories.length === 0) return null;
    const match = categories.find((c) => c.category_name?.toLowerCase() === type.toLowerCase());
    return match?.id || categories[0]?.id || null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const categoryId = getCategoryIdForType(formData.kpi_type);
      if (!categoryId) {
        console.error('Cannot create KPI: category_id is missing for type', formData.kpi_type);
        return;
      }

      const payload = {
        title: formData.title,
        fin_year: formData.fin_year,
        kpi_type: formData.kpi_type,
        parent_kpi_id: formData.parent_kpi_id || null,
        category_id: categoryId
      };
      await api.post('/kpis', payload);
      await loadParentKpis();
      setShowModal(false);
      setFormData((prev) => ({ ...prev, title: '' }));
      showNotification('KPI created successfully!', 'success');
    } catch (err) {
      console.error('Failed to create KPI', err);
      showNotification('Failed to create KPI', 'error');
    }
  };

  return (
    <div className="kmi-detail-layout">
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
              <button
                className="notification-close"
                onClick={() => setNotification({ show: false, message: '', type: '' })}
              >
                ×
              </button>
            </div>
          )}

          <div className="kmi-detail-header">
            <button className="btn-back" onClick={() => navigate('/kmis')}>
              ← Back to KMIs
            </button>
            <div className="kmi-info">
              <h2>{kmi.title}</h2>
              <p className="fin-year">Financial Year: {kmi.fin_year}</p>
            </div>
          </div>

          <div className="kpi-types-container">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>Select KPI Type</h3>
              <button className="btn-primary" onClick={handleAddNew} style={{ marginLeft: '16px' }}>
                <span>+</span> Add KPI
              </button>
            </div>
            <div style={{ height: '12px' }}></div>
            <div
              className="kpi-blocks-grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
            >
              {kpiTypes.map((kpiType) => (
                <div
                  key={kpiType.id}
                  className={`kpi-block ${selectedKpiType?.id === kpiType.id ? 'active' : ''}`}
                  style={{
                    backgroundColor: selectedKpiType?.id === kpiType.id ? kpiType.color : `${kpiType.color}15`,
                    borderColor: kpiType.color
                  }}
                  onClick={() => handleKpiTypeClick(kpiType)}
                >
                  <div className="kpi-icon">{kpiType.icon}</div>
                  <h4 className="kpi-name" style={{ color: selectedKpiType?.id === kpiType.id ? '#fff' : kpiType.color }}>
                    {kpiType.name}
                  </h4>
                  <p className="kpi-description" style={{ color: selectedKpiType?.id === kpiType.id ? '#fff' : '#666' }}>
                    {kpiType.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {selectedKpiType && (
            <div className="kpi-details-section">
              <h3 className="section-title" style={{ color: selectedKpiType.color }}>
                {selectedKpiType.name} Details for "{kmi.title}"
              </h3>
              <div className="kpi-details-content">
                <div className="details-placeholder">
                  <p>No KPI data available yet for this KMI and type.</p>
                  <p className="details-note">KPI values will be displayed here once they are created in the system.</p>
                </div>
              </div>
            </div>
          )}

          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Add KPI</h3>
                  <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>KPI Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Enter KPI title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Financial Year</label>
                    <input
                      type="text"
                      name="fin_year"
                      value={formData.fin_year}
                      onChange={handleChange}
                      placeholder="e.g. 2024-25"
                    />
                  </div>
                  <div className="form-group">
                    <label>KPI Type</label>
                    <select name="kpi_type" value={formData.kpi_type} onChange={handleChange}>
                      {kpiTypes.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Parent KPI</label>
                    <select
                      name="parent_kpi_id"
                      value={formData.parent_kpi_id}
                      onChange={handleChange}
                    >
                      <option value="">None (top-level)</option>
                      {id && (
                        <option value={id}>KMI: {kmi.title || 'Current KMI'}</option>
                      )}
                      {parentKpis.length === 0 && <option value="" disabled>No parent KPIs available</option>}
                      {parentKpis.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default KmiDetail;
