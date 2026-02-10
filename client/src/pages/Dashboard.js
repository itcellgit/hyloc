import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import api, { userService, departmentService } from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [totalUsers, setTotalUsers] = useState(null);
  const [departmentsCount, setDepartmentsCount] = useState(null);
  const [activeKpiCount, setActiveKpiCount] = useState(null);
  const [avgPerformance, setAvgPerformance] = useState(null);
  const [departmentData, setDepartmentData] = useState({ labels: [], values: [] });
  const [kpiAchievementData, setKpiAchievementData] = useState({ labels: [], values: [] });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return `${user.firstname} ${user.lastname}`;
  };

  useEffect(() => {
    // Verify user is still authenticated
    const verifyAuth = async () => {
      const token = authService.getToken();
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        navigate('/login', { replace: true });
        return;
      }

      setUser(JSON.parse(userData));
    };

    verifyAuth();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  useEffect(() => {
    // Fetch stats and charts
    const fetchStats = async () => {
      try {
        setLoadingStats(true);

        const [usersRes, departmentsRes, kpiValuesRes] = await Promise.all([
          userService.getAll(),
          departmentService.getAll(),
          api.get('/kpi-values'),
        ]);

        const users = usersRes.data?.data || [];
        const departments = departmentsRes.data?.data || [];
        const kpiValues = kpiValuesRes.data?.data || [];

        setTotalUsers(users.length);
        setDepartmentsCount(departments.length);

        // Active KPIs = distinct KPI IDs that have at least one value
        const distinctKpiIds = Array.from(new Set(kpiValues.map((kv) => kv.kpi_id))).filter((id) => id != null);
        setActiveKpiCount(distinctKpiIds.length);

        // Employees by Department chart
        const deptIdToName = new Map();
        departments.forEach((d) => deptIdToName.set(d.id, d.name || d.department_name || `Dept ${d.id}`));
        const deptCounts = new Map();
        users.forEach((u) => {
          const deptName = deptIdToName.get(u.department_id) || 'Unassigned';
          deptCounts.set(deptName, (deptCounts.get(deptName) || 0) + 1);
        });
        const deptLabels = Array.from(deptCounts.keys());
        const deptValues = Array.from(deptCounts.values());
        setDepartmentData({ labels: deptLabels, values: deptValues });

        // Compute KPI achievement for current month/year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        // Limit how many KPI values we query for monthly data to avoid overload
        const MAX_KPI_VALUES = 30;
        const kpiValuesSample = kpiValues.slice(0, MAX_KPI_VALUES);

        const monthlyDataResponses = await Promise.all(
          kpiValuesSample.map((kv) => api.get(`/kpi-values/${kv.id}/monthly-data/${currentYear}`))
        );

        const achievements = [];
        const kpiAchievementPairs = [];

        monthlyDataResponses.forEach((resp, idx) => {
          const rows = resp.data?.data || [];
          const monthRow = rows.find((r) => Number(r.month) === currentMonth);
          if (monthRow) {
            const target = Number(monthRow.target_value || 0);
            const actual = Number(monthRow.actual_value || 0);
            if (target > 0) {
              const pct = Math.min(100, Math.max(0, (actual / target) * 100));
              achievements.push(pct);
              const label = kpiValuesSample[idx]?.data || `KPI ${kpiValuesSample[idx]?.id}`;
              kpiAchievementPairs.push({ label, value: Math.round(pct) });
            }
          }
        });

        const avg = achievements.length > 0
          ? Math.round(achievements.reduce((a, b) => a + b, 0) / achievements.length)
          : null;
        setAvgPerformance(avg);

        // Take top 5 KPI achievements for chart
        kpiAchievementPairs.sort((a, b) => b.value - a.value);
        const top = kpiAchievementPairs.slice(0, 5);
        setKpiAchievementData({ labels: top.map((t) => t.label), values: top.map((t) => t.value) });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
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
    { id: 7, label: 'User Roles', icon: '🔐', path: '/user-roles' },
  ];

  // Placeholder for quarterly performance until aggregated endpoint is available
  const performanceData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    values: [0, 0, 0, 0],
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

  // Horizontal Bar Chart (better for many categories)
  const HorizontalBarChart = ({ title, data, color, maxItems = 10 }) => {
    const [showAll, setShowAll] = useState(false);
    if (!data || !data.labels || !data.values || data.labels.length === 0) {
      return (
        <div className="chart-card">
          <h3>{title}</h3>
          <div className="hbar-empty">No Data</div>
        </div>
      );
    }

    // Zip labels and values, sort by value desc
    const items = data.labels.map((label, i) => ({ label, value: Number(data.values[i]) || 0 }));
    items.sort((a, b) => b.value - a.value);

    const visibleItems = showAll ? items : items.slice(0, maxItems);
    const maxValue = Math.max(...items.map((it) => it.value), 1);

    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="hbar-list">
          {visibleItems.map((it, idx) => (
            <div className="hbar-row" key={idx}>
              <div className="hbar-barwrap">
                <div
                  className="hbar-bar"
                  style={{ width: `${(it.value / maxValue) * 100}%`, backgroundColor: color }}
                >
                  <span className="hbar-barlabel" title={it.label}>{it.label}</span>
                </div>
              </div>
              <div className="hbar-value">{it.value}</div>
            </div>
          ))}
        </div>
        {items.length > maxItems && (
          <div className="hbar-actions">
            <button className="hbar-toggle" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show Top' : `Show All (${items.length})`}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Line Chart component
  const LineChart = ({ title, data, color }) => {
    const maxValue = Math.max(...data.values);
    const points = maxValue > 0 ? data.values.map((val) => (val / maxValue) * 150) : data.values.map(() => 0);
    const width = 400;
    const height = 200;
    const stepX = points.length > 1 ? width / (points.length - 1) : 0;
    const svgPath = points
      .map((point, index) => `${index * stepX} ${height - point}`)
      .join(' L ');

    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="line-chart">
          <svg width="100%" height="250" viewBox={`0 0 ${width} 250`}>
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
                cx={index * stepX}
                cy={height - point}
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

  // Pie Chart component (Quarterly)
  const PieChart = ({ title, data, colors }) => {
    const total = data.values.reduce((a, b) => a + (Number(b) || 0), 0);
    const cx = 110;
    const cy = 110;
    const r = 100;

    const defaultColors = colors && colors.length ? colors : ['#41aafe', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

    // Convert polar to cartesian
    const polarToCartesian = (centerX, centerY, radius, angleInRadians) => {
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    };

    // Build slice path for a value
    const buildSlice = (startAngle, endAngle) => {
      const start = polarToCartesian(cx, cy, r, startAngle);
      const end = polarToCartesian(cx, cy, r, endAngle);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
    };

    let currentAngle = -Math.PI / 2; // start at top

    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="pie-chart">
          {total > 0 ? (
            <svg className="pie-svg" viewBox="0 0 220 220" width="100%" height="220">
              {data.values.map((val, idx) => {
                const value = Number(val) || 0;
                const sliceAngle = (value / total) * Math.PI * 2;
                const start = currentAngle;
                const end = currentAngle + sliceAngle;
                currentAngle = end;
                const path = buildSlice(start, end);
                const fill = defaultColors[idx % defaultColors.length];
                return <path key={idx} d={path} fill={fill} stroke="#ffffff" strokeWidth="1"/>;
              })}
            </svg>
          ) : (
            <div className="pie-empty">No Data</div>
          )}
          <div className="pie-legend">
            {data.labels.map((label, idx) => (
              <div className="pie-legend-item" key={idx}>
                <span className="pie-legend-swatch" style={{ backgroundColor: defaultColors[idx % defaultColors.length] }}></span>
                <span className="pie-legend-label">{label}</span>
              </div>
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
              value={loadingStats ? 'Loading…' : (totalUsers ?? '—')}
              icon="👥"
              color="#41aafe"
            />
            <StatsCard
              title="Departments"
              value={loadingStats ? 'Loading…' : (departmentsCount ?? '—')}
              icon="🏢"
              color="#4CAF50"
            />
            <StatsCard
              title="Active KPIs"
              value={loadingStats ? 'Loading…' : (activeKpiCount ?? '—')}
              icon="🎯"
              color="#FF9800"
            />
            <StatsCard
              title="Avg Performance"
              value={loadingStats ? 'Loading…' : (avgPerformance != null ? `${avgPerformance}%` : '—')}
              icon="📊"
              color="#E91E63"
            />
          </div>

        </main>
      </div>
    </div>
  );
}

export default Dashboard;
