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
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Financial year months (April to March)
  const months = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
  ];
  
  // Map financial year month index to calendar month (1-12)
  const getCalendarMonth = (fyMonthIndex) => {
    // fyMonthIndex 0 = April (month 4), 1 = May (month 5), etc.
    const calendarMonth = (fyMonthIndex + 4) % 12;
    return calendarMonth === 0 ? 12 : calendarMonth;
  };

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

  const loadMonthlyData = async (kpiValueId, fyYear) => {
    try {
      // For financial year, we need to load data from two calendar years
      // FY 2024 = April 2024 to March 2025
      const response1 = await api.get(`/kpi-values/${kpiValueId}/monthly-data/${fyYear}`);
      const response2 = await api.get(`/kpi-values/${kpiValueId}/monthly-data/${fyYear + 1}`);
      
      const data1 = response1.data.data || [];
      const data2 = response2.data.data || [];
      
      // Combine data from both years
      const combinedData = [...data1, ...data2];
      
      setMonthlyData(prev => ({
        ...prev,
        [kpiValueId]: combinedData
      }));
    } catch (error) {
      console.error('Failed to load monthly data:', error);
    }
  };

  const handleDataSubmit = async (kpiValueId, fyMonthIndex, targetValue, actualValue) => {
    try {
      const calendarMonth = getCalendarMonth(fyMonthIndex);
      // Determine the calendar year for this financial year month
      // For months Jan-Mar (fyMonthIndex 9-11), use next calendar year
      const calendarYear = fyMonthIndex >= 9 ? selectedYear + 1 : selectedYear;
      
      const payload = {
        kpiValueId,
        kpiId: selectedKPI.id,
        empId: user.empid,
        month: calendarMonth,
        year: calendarYear,
        targetValue: targetValue || null,
        actualValue: actualValue || null
      };
      
      console.log('Submitting KPI data:', payload);
      
      const response = await api.post('/employees/kpi-data', payload);
      
      console.log('Save response:', response.data);
      showNotification('Data saved successfully!', 'success');
      await loadMonthlyData(kpiValueId, selectedYear);
    } catch (error) {
      console.error('Failed to save data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save data';
      showNotification(errorMsg, 'error');
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

  const getMonthData = (kpiValueId, fyMonthIndex) => {
    const data = monthlyData[kpiValueId] || [];
    const calendarMonth = getCalendarMonth(fyMonthIndex);
    return data.find(d => d.month === calendarMonth) || {};
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
            <h3>My KPIs/KAIs</h3>
          </div>
        </aside>

        <main className={`content ${sidebarOpen ? 'expanded' : 'full'}`}>
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-icon">{notification.type === 'success' ? '✓' : '✕'}</span>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={() => setNotification({ show: false, message: '', type: '' })}>×</button>
            </div>
          )}
          
          {!selectedKPI ? (
            <div className="kpi-page">
              <div className="kpi-page-header">
                <div className="kpi-page-title-section">
                  <h2>My KPIs/KAIs</h2>
                  <p className="kpi-page-subtitle">Click the eye icon to view and enter data</p>
                </div>
                <div className="kpi-search-bar">
                  <input
                    type="text"
                    placeholder="Search KPIs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button 
                      className="clear-search-btn"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="loading-text">Loading KPIs...</div>
              ) : kpis.length === 0 ? (
                <div className="no-kpis">No KPIs assigned to you yet. Please contact your administrator.</div>
              ) : (() => {
                const filteredKPIs = kpis.filter(kpi => 
                  kpi.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                return filteredKPIs.length === 0 ? (
                  <div className="no-kpis">No KPIs found matching "{searchQuery}"</div>
                ) : (
                  <div className="kpi-list-grid">
                    {filteredKPIs.map(kpi => {
                      const valueCount = assignedKPIValues.filter(kv => kv.kpi_id === kpi.id).length;
                      return (
                        <div key={kpi.id} className="kpi-card">
                          <div className="kpi-card-content">
                            <h3 className="kpi-card-title">{kpi.title}</h3>
                            {valueCount > 0 && (
                              <p className="kpi-card-values">{valueCount} value{valueCount !== 1 ? 's' : ''} assigned</p>
                            )}
                          </div>
                          <button 
                            className="kpi-view-btn"
                            title="View and enter data"
                            onClick={() => selectKPI(kpi)}
                          >
                            👁️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="kpi-details">
              <div className="kpi-details-header">
                <button 
                  className="back-btn"
                  onClick={() => setSelectedKPI(null)}
                  title="Back to KPI list"
                >
                  ← Back
                </button>
                <div className="kpi-details-title">
                  <h2>{selectedKPI.title}</h2>
                </div>
              </div>

              <div className="year-selector">
                <label>Financial Year: </label>
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
                    return <option key={year} value={year}>{year}-{String(year + 1).slice(-2)}</option>;
                  })}
                </select>
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
