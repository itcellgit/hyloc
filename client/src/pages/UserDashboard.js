import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import api from '../services/api';
import '../styles/Dashboard.css';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FISCAL_YEAR_START = 2025;
const FISCAL_MONTH_SEQUENCE = Array.from({ length: 12 }, (_, i) => {
  const month = ((3 + i) % 12) + 1; // April (4) through March (3)
  const year = month >= 4 ? FISCAL_YEAR_START : FISCAL_YEAR_START + 1;
  return { month, year };
});

// SVG Line Chart Component for Industry 4.0 KPI
const Industry40LineChart = ({ title, labels, actuals, targets }) => {
  const svgWidth = 900;
  const svgHeight = 350;
  const padding = 60;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = svgHeight - padding * 2;

  const maxVal = Math.max(...actuals, ...targets, 1);
  const minVal = 0;
  const range = maxVal - minVal;

  const getX = (idx) => padding + (idx / (labels.length - 1 || 1)) * plotWidth;
  const getY = (val) => svgHeight - padding - ((val - minVal) / range) * plotHeight;

  // Generate line paths
  const actualPath = actuals
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`)
    .join(' ');
  const targetPath = targets
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`)
    .join(' ');

  return (
    <div className="industry40-chart-wrapper">
      <h2 className="industry40-chart-title">{title}</h2>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="industry40-chart-svg">
        {/* Grid lines */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
          const y = svgHeight - padding - ratio * plotHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={svgWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Y-axis line */}
        <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />
        {/* X-axis line */}
        <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Target line (background) */}
        <path d={targetPath} stroke="#ffb74d" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />

        {/* Actual line (foreground) */}
        <path d={actualPath} stroke="#41aafe" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Target dots */}
        {targets.map((val, idx) => (
          <circle key={`target-dot-${idx}`} cx={getX(idx)} cy={getY(val)} r="5" fill="#ffb74d" stroke="white" strokeWidth="2" />
        ))}

        {/* Actual dots */}
        {actuals.map((val, idx) => (
          <circle key={`actual-dot-${idx}`} cx={getX(idx)} cy={getY(val)} r="5" fill="#41aafe" stroke="white" strokeWidth="2" />
        ))}

        {/* X-axis labels */}
        {labels.map((label, idx) => (
          <text
            key={`x-label-${idx}`}
            x={getX(idx)}
            y={svgHeight - padding + 30}
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#4b5563"
          >
            {label}
          </text>
        ))}

        {/* Y-axis labels */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
          const val = Math.round(minVal + ratio * range);
          const y = svgHeight - padding - ratio * plotHeight;
          return (
            <text key={`y-label-${i}`} x={padding - 15} y={y + 5} textAnchor="end" fontSize="12" fontWeight="500" fill="#4b5563">
              {val}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="industry40-legend">
        <div className="legend-item">
          <span className="legend-line actual"></span>
          <span className="legend-label">Actual Value</span>
        </div>
        <div className="legend-item">
          <span className="legend-line target"></span>
          <span className="legend-label">Target Value</span>
        </div>
      </div>
    </div>
  );
};

// Speedometer Gauge Component for Plant Efficiency
const SpeedometerGauge = ({ efficiency, month, year }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate angle: -180 to 0 degrees (left to right semicircle)
  // 0-60 red, 61-80 yellow, >80 green
  const angle = -180 + (Math.min(Math.max(efficiency, 0), 100) / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const x = 150 + radius * Math.cos(radians);
  const y = 150 + radius * Math.sin(radians);

  let color = '#ef4444'; // red
  let status = 'Critical';
  if (efficiency > 80) {
    color = '#22c55e'; // green
    status = 'Excellent';
  } else if (efficiency > 60) {
    color = '#eab308'; // yellow
    status = 'Good';
  }

  return (
    <div className="speedometer-container">
      <h3 className="speedometer-title">{month} {year}</h3>
      <svg viewBox="0 0 300 200" className="speedometer-svg">
        {/* Background arc */}
        <path
          d="M 70 150 A 80 80 0 0 1 230 150"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Red zone (0-60) */}
        <path
          d="M 70 150 A 80 80 0 0 1 126 82"
          fill="none"
          stroke="#ef4444"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Yellow zone (61-80) */}
        <path
          d="M 126 82 A 80 80 0 0 1 174 82"
          fill="none"
          stroke="#eab308"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Green zone (81-100) */}
        <path
          d="M 174 82 A 80 80 0 0 1 230 150"
          fill="none"
          stroke="#22c55e"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Needle */}
        <line x1="150" y1="150" x2={x} y2={y} stroke={color} strokeWidth="4" strokeLinecap="round" />
        
        {/* Arrow tip on needle */}
        <polygon
          points={`${x},${y} ${x - 6},${y + 8} ${x + 6},${y + 8}`}
          fill={color}
        />
        
        {/* Center dot */}
        <circle cx="150" cy="150" r="8" fill={color} />

        {/* Labels */}
        <text x="75" y="175" fontSize="12" fontWeight="600" fill="#4b5563" textAnchor="middle">0</text>
        <text x="150" y="50" fontSize="12" fontWeight="600" fill="#4b5563" textAnchor="middle">50</text>
        <text x="225" y="175" fontSize="12" fontWeight="600" fill="#4b5563" textAnchor="middle">100</text>
      </svg>
      
      <div className="speedometer-display">
        <div className="efficiency-value">{efficiency.toFixed(1)}%</div>
        <div className={`efficiency-status status-${status.toLowerCase()}`}>{status}</div>
      </div>
    </div>
  );
};

function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalKPIs: 0,
    activeKPIs: 0,
    totalPillars: 0
  });
  const [kpiLookup, setKpiLookup] = useState({});
  const [kpiCharts, setKpiCharts] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [industry40Chart, setIndustry40Chart] = useState(null);
  const [industry40Loading, setIndustry40Loading] = useState(false);
  const [plantEfficiency, setPlantEfficiency] = useState({});
  const [selectedFiscalIndex, setSelectedFiscalIndex] = useState(0);
  const [monthlyEfficiency, setMonthlyEfficiency] = useState([]);
  const [efficiencyLoading, setEfficiencyLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/user-dashboard' },
    { id: 2, label: 'KMIs', icon: '📈', path: '/user-kmis' },
    { id: 3, label: 'Pillars', icon: '🏛️', path: '/user-pillars' },
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
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [kpisRes, pillarsRes] = await Promise.all([
        api.get('/kpis'),
        api.get('/pillers')
      ]);
      
      const kpis = kpisRes.data?.data || [];
      const pillars = pillarsRes.data?.data || [];

      const lookup = kpis.reduce((acc, k) => {
        const name = k.title || k.kpi_name || k.name || `KPI ${k.id}`;
        acc[k.id] = name;
        return acc;
      }, {});
      setKpiLookup(lookup);
      
      setStats({
        totalKPIs: kpis.length,
        activeKPIs: kpis.filter(k => k.fin_year).length,
        totalPillars: pillars.length
      });

      loadKpiCharts(lookup);
      loadIndustry40Chart(lookup);
      loadPlantEfficiency();
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const loadPlantEfficiency = async () => {
    try {
      setEfficiencyLoading(true);
      const kpiValuesRes = await api.get('/kpi-values');
      const kpiValues = kpiValuesRes.data?.data || [];

      // Calculate efficiency for each month in fiscal year Apr 2025 - Mar 2026
      const efficiencyByIndex = {};

      for (let idx = 0; idx < FISCAL_MONTH_SEQUENCE.length; idx++) {
        const { month, year } = FISCAL_MONTH_SEQUENCE[idx];
        const monthAchievements = [];

        for (const kv of kpiValues) {
          try {
            const resp = await api.get(`/kpi-values/${kv.id}/monthly-data/${year}`);
            const rows = resp.data?.data || [];
            const monthRow = rows.find(r => Number(r.month) === month && Number(r.year) === year);

            if (monthRow) {
              const target = Number(monthRow.target_value || 0);
              const actual = Number(monthRow.actual_value || 0);

              if (target > 0) {
                const achievement = Math.min(100, (actual / target) * 100);
                monthAchievements.push(achievement);
              }
            }
          } catch (err) {
            // Skip errors for individual KPI values
          }
        }

        if (monthAchievements.length > 0) {
          const avg = monthAchievements.reduce((a, b) => a + b, 0) / monthAchievements.length;
          efficiencyByIndex[idx] = Math.round(avg * 10) / 10;
        } else {
          efficiencyByIndex[idx] = 0;
        }
      }

      const monthly = FISCAL_MONTH_SEQUENCE.map((entry, idx) => ({
        month: entry.month,
        year: entry.year,
        efficiency: efficiencyByIndex[idx] || 0,
      }));

      setPlantEfficiency(efficiencyByIndex);
      setMonthlyEfficiency(monthly);
      setSelectedFiscalIndex(0);
    } catch (err) {
      console.error('Failed to load plant efficiency', err);
    } finally {
      setEfficiencyLoading(false);
    }
  };

  const loadIndustry40Chart = async (lookupData = {}) => {
    try {
      setIndustry40Loading(true);
      const currentYear = new Date().getFullYear();
      
      // Get all KPI values
      const kpiValuesRes = await api.get('/kpi-values');
      const kpiValues = kpiValuesRes.data?.data || [];
      
      console.log('All KPI Values:', kpiValues);
      
      // Find Industry 4.0 KPI value by data field or in lookup
      let industry40Value = kpiValues.find(kv => kv.data && kv.data.toLowerCase().includes('industry 4.0'));
      
      // If not found by data, try looking up by KPI title
      if (!industry40Value) {
        industry40Value = kpiValues.find(kv => {
          const kpiName = lookupData[kv.kpi_id] || '';
          return kpiName.toLowerCase().includes('industry 4.0');
        });
      }
      
      console.log('Found Industry 4.0 KPI Value:', industry40Value);
      
      if (!industry40Value) {
        console.warn('Industry 4.0 KPI value not found');
        setIndustry40Chart(null);
        setIndustry40Loading(false);
        return;
      }
      
      // Get monthly data for this KPI value
      const resp = await api.get(`/kpi-values/${industry40Value.id}/monthly-data/${currentYear}`);
      const rows = resp.data?.data || [];
      
      console.log('Industry 4.0 Monthly Data:', rows);
      
      if (!rows || rows.length === 0) {
        console.warn('No monthly data for Industry 4.0');
        setIndustry40Chart(null);
        setIndustry40Loading(false);
        return;
      }

      // Sort by month
      rows.sort((a, b) => Number(a.month) - Number(b.month));
      
      const labels = rows.map(r => MONTH_LABELS[(Number(r.month) || 1) - 1] || `M${r.month}`);
      const actuals = rows.map(r => Number(r.actual_value || 0));
      const targets = rows.map(r => Number(r.target_value || 0));

      console.log('Chart Data - Labels:', labels, 'Actuals:', actuals, 'Targets:', targets);

      setIndustry40Chart({
        title: 'Industry 4.0 Performance Trend',
        labels,
        actuals,
        targets,
      });
    } catch (err) {
      console.error('Failed to load Industry 4.0 chart', err);
      setIndustry40Chart(null);
    } finally {
      setIndustry40Loading(false);
    }
  };

  const loadKpiCharts = async (lookup = kpiLookup) => {
    try {
      setChartsLoading(true);
      const currentYear = new Date().getFullYear();
      const kpiValuesRes = await api.get('/kpi-values');
      const kpiValues = kpiValuesRes.data?.data || [];

      // Build up to 6 charts that actually have data (skip empty ones)
      const charts = [];
      for (const kv of kpiValues) {
        if (charts.length >= 6) break; // cap to avoid heavy load
        try {
          const resp = await api.get(`/kpi-values/${kv.id}/monthly-data/${currentYear}`);
          const rows = resp.data?.data || [];
          if (!rows.length) continue;

          const labels = rows.map(r => MONTH_LABELS[(Number(r.month) || 1) - 1] || `M${r.month}`);
          const actuals = rows.map(r => Number(r.actual_value || 0));
          const targets = rows.map(r => Number(r.target_value || 0));

          charts.push({
            id: kv.id,
            title: lookup?.[kv.kpi_id] || kv.data || `KPI ${kv.kpi_id || kv.id}`,
            labels,
            actuals,
            targets,
          });
        } catch (err) {
          console.error('Failed to load monthly data for KPI value', kv.id, err);
        }
      }

      setKpiCharts(charts);
    } catch (err) {
      console.error('Failed to load KPI charts', err);
      setKpiCharts([]);
    } finally {
      setChartsLoading(false);
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

  return (
    <div className="dashboard-layout">
      <header className="header">
        <div className="header-content">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-logo-section">
            <img src="/hyloc-logo.png" alt="Hyloc Logo" className="header-logo" />
            <h1 className="header-title">Hyloc Hydrotechnic Pvt Ltd.</h1>
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

        <main className={`content ${sidebarOpen ? 'expanded' : 'full'}`}>
          <div className="page-header">
            <h2>Dashboard</h2>
            <p className="subtitle">Welcome back, {getUserDisplayName()}</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalKPIs}</h3>
                <p className="stat-label">Total KPIs</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.activeKPIs}</h3>
                <p className="stat-label">Active KPIs</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏛️</div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalPillars}</h3>
                <p className="stat-label">Total Pillars</p>
              </div>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="welcome-section">
              <h3>📊 Your Performance Dashboard</h3>
              <p>Track your KPIs and performance metrics here. Use the sidebar to navigate to KMIs and Pillars sections.</p>
            </div>

            {industry40Loading ? (
              <div className="loading">Loading Industry 4.0 chart...</div>
            ) : industry40Chart ? (
              <div className="industry40-section">
                <Industry40LineChart
                  title={industry40Chart.title}
                  labels={industry40Chart.labels}
                  actuals={industry40Chart.actuals}
                  targets={industry40Chart.targets}
                />
              </div>
            ) : null}

            {/* Plant Efficiency Speedometer Section */}
            <div className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>⚡ Plant Efficiency (Month-wise)</h3>
                  <p className="section-subtitle">Overall plant efficiency gauge by month</p>
                </div>
              </div>

              {efficiencyLoading ? (
                <div className="loading">Loading plant efficiency...</div>
              ) : (
                <div className="speedometer-nav-wrapper">
                  <button 
                    className="nav-arrow prev-arrow"
                    onClick={() => {
                      if (!monthlyEfficiency.length) return;
                      setSelectedFiscalIndex(selectedFiscalIndex === 0 ? monthlyEfficiency.length - 1 : selectedFiscalIndex - 1);
                    }}
                    title="Previous Month"
                    disabled={!monthlyEfficiency.length}
                  >
                    ‹
                  </button>
                  
                  <div className="speedometer-display-wrapper">
                    <SpeedometerGauge 
                      efficiency={monthlyEfficiency[selectedFiscalIndex]?.efficiency || 0}
                      month={MONTH_LABELS[(monthlyEfficiency[selectedFiscalIndex]?.month || 1) - 1]}
                      year={monthlyEfficiency[selectedFiscalIndex]?.year || ''}
                    />
                  </div>

                  <button 
                    className="nav-arrow next-arrow"
                    onClick={() => {
                      if (!monthlyEfficiency.length) return;
                      setSelectedFiscalIndex(selectedFiscalIndex === monthlyEfficiency.length - 1 ? monthlyEfficiency.length - 1 : selectedFiscalIndex + 1);
                    }}
                    disabled={!monthlyEfficiency.length || selectedFiscalIndex >= monthlyEfficiency.length - 1}
                    title={!monthlyEfficiency.length ? "No data available" : (selectedFiscalIndex >= monthlyEfficiency.length - 1 ? "No further months in fiscal year" : "Next Month")}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default UserDashboard;
