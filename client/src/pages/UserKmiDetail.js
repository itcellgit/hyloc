import React, { useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/auth';
import '../styles/KmiDetail.css';

function UserKmiDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [kpiValues, setKpiValues] = useState([]);
  const [units, setUnits] = useState([]);
  const [pillers, setPillers] = useState([]);
  const [users, setUsers] = useState([]);
  const dropdownRef = useRef(null);

  const kmi = location.state?.kmi || { id, title: 'Loading...', fin_year: '' };

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/user-dashboard' },
    { id: 2, label: 'KMIs', icon: '📈', path: '/user-kmis' },
    { id: 3, label: 'Pillars', icon: '🏛️', path: '/user-pillars' },
  ];

  React.useEffect(() => {
    const token = authService.getToken();
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login', { replace: true });
      return;
    }

    setUser(JSON.parse(userData));

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  const loadKpiValues = React.useCallback(async (kpiId) => {
    if (!kpiId) return;
    try {
      const response = await api.get(`/kpi-values?kpi_id=${kpiId}`);
      const values = response.data?.data || [];
      setKpiValues(values);
    } catch (err) {
      console.error('Failed to load KPI values', err);
      setKpiValues([]);
    }
  }, []);

  React.useEffect(() => {
    if (id) {
      loadKpiValues(id);
    }
  }, [id, loadKpiValues]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [unitsRes, pillersRes, usersRes] = await Promise.all([
          api.get('/unit-master'),
          api.get('/pillers'),
          api.get('/users')
        ]);
        setUnits(unitsRes.data?.data || []);
        setPillers(pillersRes.data?.data || []);
        setUsers(usersRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load data', err);
      }
    };
    loadData();
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

  return (
    <div className="kmi-detail-layout">
      <header className="header">
        <div className="header-content">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-logo-section">
            <img src="/hyloc-logo.png" alt="Hyloc Logo" className="header-logo" />
            <h1 className="header-title">Hyloc Hydrotechnic Pvt Ltd</h1>
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
          <div className="kmi-detail-header">
            <button className="btn-back" onClick={() => navigate('/user-kmis')}>
              ← Back to KMIs
            </button>
            <div className="kmi-info">
              <h2>{kmi.title}</h2>
              <p className="fin-year">Financial Year: {kmi.fin_year}</p>
            </div>
          </div>

          <div className="kpi-details-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-title">KPI Values</h3>
            </div>

            {kpiValues.length === 0 ? (
              <div className="details-placeholder" style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ fontSize: '16px', color: '#666' }}>No values recorded yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="kpi-values-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Data</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Data Operator</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Unit of Measurement</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Piller</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Target Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiValues.map((val) => {
                      const dataOperator = val.data_operator ?? val['data operator'];
                      const operator = users.find((u) =>
                        dataOperator != null && String(u.empid) === String(dataOperator)
                      );
                      const unit = units.find(u => u.id === val.uom);
                      const piller = pillers.find(p => p.id === val.piller_id);
                      const typeLabel = (val.kpi_type ? String(val.kpi_type) : 'manual');
                      return (
                        <tr key={val.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '12px',
                              background: '#f5f5f5',
                              color: '#666',
                              fontWeight: '500'
                            }}>
                              {typeLabel}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {val.data ?? '-'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {operator ? `${operator.firstname} ${operator.lastname} (${operator.empid})` : '-'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {unit ? unit.unit_name : '-'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {piller ? piller.short_name : '-'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {val.target_required ? '✓' : '✗'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserKmiDetail;
