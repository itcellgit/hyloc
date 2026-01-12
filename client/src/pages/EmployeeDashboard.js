import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/auth';
import '../styles/EmployeeDashboard.css';

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [kpis, setKPIs] = useState([]); // All KPIs for hierarchy display
  const [assignedKPIValues, setAssignedKPIValues] = useState([]); // KPI values assigned to employee
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const dropdownRef = useRef(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadEmployeeData(parsedUser.empid);
    } else {
      navigate('/login');
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  const loadEmployeeData = async (empId) => {
    try {
      setLoading(true);
      
      console.log('Loading data for employee:', empId);
      
      // Load KPI values assigned to this employee
      const kpiValuesResponse = await api.get(`/employees/${empId}/kpi-values`);
      const kpiValues = kpiValuesResponse.data.data || [];
      console.log('Loaded KPI values for employee:', kpiValues.length, kpiValues);
      setAssignedKPIValues(kpiValues);
      
      if (kpiValues.length === 0) {
        console.warn('No KPI values assigned to this employee');
        showNotification('No KPIs have been assigned to you yet. Please contact your administrator.', 'error');
        setLoading(false);
        return;
      }
      
      // Load only the KPIs that this employee has values for
      const uniqueKPIIds = [...new Set(kpiValues.map(kv => kv.kpi_id))];
      console.log('Employee has values for KPIs:', uniqueKPIIds);
      
      // Fetch full KPI details for assigned KPIs
      const kpisResponse = await api.get('/kpis');
      const allKPIs = kpisResponse.data.data || [];
      const assignedKPIs = allKPIs.filter(kpi => uniqueKPIIds.includes(kpi.id));
      console.log('Loaded KPI details:', assignedKPIs.length);
      setKPIs(assignedKPIs);
      
      // Select the first KPI with values
      if (assignedKPIs.length > 0) {
        selectKPI(assignedKPIs[0], kpiValues);
      }
    } catch (error) {
      console.error('Failed to load employee data:', error);
      console.error('Error details:', error.response?.data);
      showNotification(error.response?.data?.error || 'Failed to load employee data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectKPI = async (kpi, kpiValues = null) => {
    setSelectedKPI(kpi);
    
    // Filter kpi_values for this specific KPI
    const kpiValuesForSelected = kpiValues || assignedKPIValues.filter(kv => kv.kpi_id === kpi.id);
    
    try {
      // Load monthly data for each KPI value
      if (kpiValuesForSelected.length > 0) {
        for (const value of kpiValuesForSelected) {
          await loadMonthlyData(value.id, selectedYear);
        }
      }
    } catch (error) {
      console.error('Failed to load monthly data:', error);
      showNotification('Failed to load monthly data', 'error');
    }
  };

  const loadMonthlyData = async (kpiValueId, year) => {
    try {
      const response = await api.get(`/kpi-values/${kpiValueId}/monthly-data/${year}`);
      const data = response.data.data || [];
      
      setMonthlyData(prev => ({
        ...prev,
        [kpiValueId]: data
      }));
    } catch (error) {
      console.error('Failed to load monthly data:', error);
    }
  };

  const handleDataSubmit = async (kpiValueId, month, targetValue, actualValue) => {
    try {
      await api.post('/employees/kpi-data', {
        kpiValueId,
        kpiId: selectedKPI.id,
        empId: user.empid,
        month: month + 1, // Convert 0-indexed to 1-indexed
        year: selectedYear,
        targetValue,
        actualValue
      });

      showNotification('Data saved successfully!', 'success');
      await loadMonthlyData(kpiValueId, selectedYear);
    } catch (error) {
      console.error('Failed to save data:', error);
      showNotification('Failed to save data', 'error');
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

  // Build KPI hierarchy
  const buildKPIHierarchy = (kpis) => {
    const kpiMap = {};
    kpis.forEach(kpi => {
      kpiMap[kpi.id] = { ...kpi, children: [] };
    });

    const rootKPIs = [];
    kpis.forEach(kpi => {
      if (kpi.parent_kpi_id && kpiMap[kpi.parent_kpi_id]) {
        kpiMap[kpi.parent_kpi_id].children.push(kpiMap[kpi.id]);
      } else {
        rootKPIs.push(kpiMap[kpi.id]);
      }
    });

    return rootKPIs;
  };

  const renderKPIHierarchy = (kpis, level = 0) => {
    // Filter KPIs to only show those with assigned values
    const kpisWithValues = kpis.filter(kpi => 
      assignedKPIValues.some(kv => kv.kpi_id === kpi.id)
    );
    
    return kpisWithValues.map(kpi => {
      const hasValues = assignedKPIValues.some(kv => kv.kpi_id === kpi.id);
      const valueCount = assignedKPIValues.filter(kv => kv.kpi_id === kpi.id).length;
      
      return (
        <div key={kpi.id} style={{ marginLeft: `${level * 20}px` }}>
          <div
            className={`kpi-item ${selectedKPI?.id === kpi.id ? 'active' : ''} ${!hasValues ? 'disabled' : ''}`}
            onClick={() => hasValues && selectKPI(kpi)}
            style={{ cursor: hasValues ? 'pointer' : 'not-allowed', opacity: hasValues ? 1 : 0.6 }}
            title={kpi.title}
          >
            <span className="kpi-icon">📊</span>
            <span className="kpi-title">{kpi.title}</span>
            {valueCount > 0 && <span className="kpi-badge">{valueCount}</span>}
          </div>
          {kpi.children && kpi.children.length > 0 && renderKPIHierarchy(kpi.children, level + 1)}
        </div>
      );
    });
  };

  const getMonthData = (kpiValueId, monthIndex) => {
    const data = monthlyData[kpiValueId] || [];
    return data.find(d => d.month === monthIndex + 1) || {};
  };

  return (
    <div className="employee-dashboard-layout">
      <header className="header">
        <div className="header-content">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-logo-section">
            <img src="/hyloc-logo.png" alt="Hyloc Logo" className="header-logo" />
            <h1 className="header-title">Hyloc Hydrotechnic Pvt Ltd - Employee Dashboard</h1>
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
          <div className="sidebar-header">
            <h3>My KPIs</h3>
          </div>
          <nav className="kpi-nav">
            {loading ? (
              <div className="loading-text">Loading KPIs...</div>
            ) : kpis.length === 0 ? (
              <div className="no-kpis">No KPIs assigned</div>
            ) : (
              renderKPIHierarchy(buildKPIHierarchy(kpis))
            )}
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

          {selectedKPI ? (
            <div className="kpi-details">
              <div className="kpi-header">
                <h2>{selectedKPI.title}</h2>
                <div className="year-selector">
                  <label>Select Year: </label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      setSelectedYear(year);
                      const kpiValuesForSelected = assignedKPIValues.filter(kv => kv.kpi_id === selectedKPI.id);
                      kpiValuesForSelected.forEach(value => loadMonthlyData(value.id, year));
                    }}
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              </div>

              {assignedKPIValues.filter(kv => kv.kpi_id === selectedKPI.id).map(kpiValue => (
                <div key={kpiValue.id} className="kpi-value-section">
                  <h3>{kpiValue.data}</h3>
                  <p className="kpi-meta">
                    Type: <span className="badge">{kpiValue.kpi_type}</span>
                    {kpiValue.unit_name && <> | Unit: <span className="badge">{kpiValue.unit_name}</span></>}
                  </p>

                  {kpiValue.kpi_type === 'manual' && (
                    <div className="monthly-data-grid">
                      {months.map((month, index) => {
                        const monthData = getMonthData(kpiValue.id, index);
                        return (
                          <MonthlyDataForm
                            key={index}
                            month={month}
                            monthIndex={index}
                            kpiValueId={kpiValue.id}
                            targetRequired={kpiValue.target_required}
                            initialTarget={monthData.target_value || ''}
                            initialActual={monthData.actual_value || ''}
                            onSubmit={handleDataSubmit}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a KPI from the sidebar to view and enter data</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Monthly Data Form Component
function MonthlyDataForm({ month, monthIndex, kpiValueId, targetRequired, initialTarget, initialActual, onSubmit }) {
  const [targetValue, setTargetValue] = useState(initialTarget);
  const [actualValue, setActualValue] = useState(initialActual);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTargetValue(initialTarget);
    setActualValue(initialActual);
  }, [initialTarget, initialActual]);

  const handleSave = () => {
    onSubmit(kpiValueId, monthIndex, targetValue, actualValue);
    setIsEditing(false);
  };

  return (
    <div className="month-card">
      <h4>{month}</h4>
      {isEditing ? (
        <div className="form-inputs">
          {targetRequired && (
            <div className="form-group">
              <label>Target:</label>
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Enter target"
              />
            </div>
          )}
          <div className="form-group">
            <label>Actual:</label>
            <input
              type="text"
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
              placeholder="Enter actual value"
            />
          </div>
          <div className="form-actions">
            <button className="btn-save" onClick={handleSave}>Save</button>
            <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="data-display">
          {targetRequired && (
            <p className="data-row"><strong>Target:</strong> {targetValue || '-'}</p>
          )}
          <p className="data-row"><strong>Actual:</strong> {actualValue || '-'}</p>
          <button className="btn-edit" onClick={() => setIsEditing(true)}>
            {targetValue || actualValue ? 'Edit' : 'Add Data'}
          </button>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
