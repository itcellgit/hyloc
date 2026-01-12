import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import '../styles/Dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return `${user.firstname} ${user.lastname}`;
  };

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Close dropdown when clicking outside
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
      // Even if logout fails on server, clear local data
      authService.removeToken();
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments' },
    { id: 3, label: 'Users', icon: '👥', path: '/users' },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis' },
    { id: 7, label: 'Pillers', icon: '🏛️', path: '/pillers' },
    { id: 5, label: 'Roles', icon: '🔐', path: '/roles' },
    { id: 6, label: 'User Roles', icon: '🧩', path: '/user-roles' },
  ];

  // Sample data for charts
  const departmentData = {
    labels: ['Sales', 'HR', 'IT', 'Finance', 'Marketing'],
    values: [45, 30, 50, 25, 35],
  };

  const performanceData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    values: [65, 72, 58, 80],
  };

  const kpiData = {
    labels: ['KPI 1', 'KPI 2', 'KPI 3', 'KPI 4', 'KPI 5'],
    values: [85, 72, 90, 78, 88],
  };

  // Chart component
  const BarChart = ({ title, data, color }) => {
    const maxValue = Math.max(...data.values);
    
    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="chart">
          <div className="bars">
            {data.labels.map((label, index) => (
              <div key={index} className="bar-group">
                <div className="bar-container">
                  <div
                    className="bar"
                    style={{
                      height: `${(data.values[index] / maxValue) * 200}px`,
                      backgroundColor: color,
                    }}
                  >
                    <span className="bar-value">{data.values[index]}</span>
                  </div>
                </div>
                <label className="bar-label">{label}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Line Chart component
  const LineChart = ({ title, data, color }) => {
    const maxValue = Math.max(...data.values);
    const points = data.values.map((val) => (val / maxValue) * 150);
    
    const svgPath = points
      .map((point, index) => `${index * 80} ${200 - point}`)
      .join(' L ');

    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="line-chart">
          <svg width="100%" height="250" viewBox="0 0 400 250">
            <polyline
              points={svgPath}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={index * 80}
                cy={200 - point}
                r="4"
                fill={color}
              />
            ))}
          </svg>
          <div className="line-labels">
            {data.labels.map((label, index) => (
              <span key={index} className="line-label">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Stats Card component
  const StatsCard = ({ title, value, icon, color }) => (
    <div className="stats-card" style={{ borderLeftColor: color }}>
      <div className="stats-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="stats-content">
        <h4>{title}</h4>
        <p className="stats-value">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div className="header-logo-section">
            <img src="/hyloc-logo.png" alt="Hyloc Logo" className="header-logo" />
            <h1 className="header-title">Hyloc Hydrotechnic Pvt Ltd</h1>
          </div>
          <div className="header-actions">
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
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <a
                key={item.id}
                href="#"
                className={`nav-item ${item.id === 1 ? 'active' : ''}`}
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

        {/* Main Content */}
        <main className={`content ${sidebarOpen ? 'expanded' : 'full'}`}>
          <div className="dashboard-header">
            <h2>Welcome to Dashboard</h2>
            <p>Monitor your organization's performance and metrics</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <StatsCard
              title="Total Users"
              value="127"
              icon="👥"
              color="#41aafe"
            />
            <StatsCard
              title="Departments"
              value="5"
              icon="🏢"
              color="#4CAF50"
            />
            <StatsCard
              title="Active KPIs"
              value="24"
              icon="🎯"
              color="#FF9800"
            />
            <StatsCard
              title="Avg Performance"
              value="78%"
              icon="📊"
              color="#E91E63"
            />
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <BarChart
              title="Employees by Department"
              data={departmentData}
              color="#41aafe"
            />
            <LineChart
              title="Quarterly Performance"
              data={performanceData}
              color="#4CAF50"
            />
            <BarChart
              title="KPI Achievement Rate"
              data={kpiData}
              color="#FF9800"
            />
            <div className="chart-card summary-card">
              <h3>Summary</h3>
              <div className="summary-content">
                <div className="summary-item">
                  <span className="label">Total KMIs:</span>
                  <span className="value">45</span>
                </div>
                <div className="summary-item">
                  <span className="label">Active KAIs:</span>
                  <span className="value">12</span>
                </div>
                <div className="summary-item">
                  <span className="label">Completion Rate:</span>
                  <span className="value">82%</span>
                </div>
                <div className="summary-item">
                  <span className="label">Last Updated:</span>
                  <span className="value">Today</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
