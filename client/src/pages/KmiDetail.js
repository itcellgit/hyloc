import React, { useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  const dropdownRef = useRef(null);

  const kmi = location.state?.kmi || { id, title: 'Loading...', fin_year: '' };

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/' },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments' },
    { id: 3, label: 'Users', icon: '👥', path: '/users' },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis' },
    { id: 5, label: "KPI's", icon: '🎯', path: '#' },
    { id: 6, label: "KAI's", icon: '⭐', path: '#' },
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
      name: 'Pillar KPI',
      color: '#8b5cf6',
      icon: '🏛️',
      description: 'Key pillar-based performance indicators'
    },
    {
      id: 3,
      name: 'Department KPI',
      color: '#ec4899',
      icon: '📋',
      description: 'Department-specific performance metrics'
    },
    {
      id: 4,
      name: 'Employee KPI',
      color: '#f59e0b',
      icon: '👤',
      description: 'Individual employee performance metrics'
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

  const handleKpiTypeClick = (kpiType) => {
    setSelectedKpiType(selectedKpiType?.id === kpiType.id ? null : kpiType);
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
            <h3 className="section-title">Select KPI Type</h3>
            <div className="kpi-blocks-grid">
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
        </main>
      </div>
    </div>
  );
}

export default KmiDetail;
