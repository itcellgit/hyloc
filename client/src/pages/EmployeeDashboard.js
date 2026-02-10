import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'kpis'
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [formulaDetailsModal, setFormulaDetailsModal] = useState({ show: false, data: null });
  const [recentlyUpdatedKPIs, setRecentlyUpdatedKPIs] = useState([]);
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

  const updateFinancialYear = (year) => {
    setSelectedYear(year);
    
    // When year changes, reload all KPI values' monthly data for the new year
    assignedKPIValues.forEach(value => loadMonthlyData(value.id, year));
  };

  const changeYear = (delta) => {
    const newYear = selectedYear + delta;
    updateFinancialYear(newYear);
  };

  const getSelectedFinancialYear = () => `${selectedYear}-${String(selectedYear + 1).slice(-2)}`;

  const kpiById = useMemo(() => new Map(kpis.map((kpi) => [kpi.id, kpi])), [kpis]);

  // Build breadcrumb trail for a KPI (from root to current)
  const buildBreadcrumb = (kpi) => {
    const breadcrumb = [];
    let currentKPI = kpi;
    
    while (currentKPI) {
      breadcrumb.unshift(currentKPI);
      if (currentKPI.parent_kpi_id) {
        currentKPI = kpiById.get(currentKPI.parent_kpi_id);
      } else {
        currentKPI = null;
      }
    }
    
    return breadcrumb;
  };

  // Get category name from category_id
  const getCategoryName = (categoryId) => {
    const categoryNames = {
      1: 'Pillar',
      2: 'Department KPI',
      3: 'Divisional KPI',
      4: 'Employee KAI',
      5: 'Team KPI',
      6: 'KMI'
    };
    return categoryNames[categoryId] || 'KPI';
  };

  const assignedKPIIdsForYear = useMemo(() => {
    const fy = getSelectedFinancialYear();
    return new Set(
      assignedKPIValues
        .filter((kv) => kpiById.get(kv.kpi_id)?.fin_year === fy)
        .map((kv) => kv.kpi_id)
    );
  }, [assignedKPIValues, kpiById, selectedYear]);

  const assignedKPIValuesForYear = useMemo(
    () => assignedKPIValues.filter((kv) => assignedKPIIdsForYear.has(kv.kpi_id)),
    [assignedKPIValues, assignedKPIIdsForYear]
  );

  const visibleKPIsForYear = useMemo(() => {
    const fy = getSelectedFinancialYear();
    const included = new Set();

    const addWithParents = (id) => {
      let currentId = id;
      while (currentId && !included.has(currentId)) {
        included.add(currentId);
        const parentId = kpiById.get(currentId)?.parent_kpi_id || null;
        currentId = parentId;
      }
    };

    assignedKPIIdsForYear.forEach(addWithParents);

    return kpis.filter((kpi) => kpi.fin_year === fy && included.has(kpi.id));
  }, [kpis, assignedKPIIdsForYear, kpiById, selectedYear]);

  useEffect(() => {
    const token = authService.getToken();
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login', { replace: true });
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadEmployeeData(parsedUser.empid);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [navigate]);

  const loadEmployeeData = async (empId) => {
    try {
      setLoading(true);
      setMonthlyData({}); // Clear any existing monthly data
      
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
      
      // Load all KPIs to build hierarchy for the selected financial year
      const uniqueKPIIds = [...new Set(kpiValues.map(kv => kv.kpi_id))];
      console.log('Employee has values for KPIs:', uniqueKPIIds);
      
      const kpisResponse = await api.get('/kpis');
      const allKPIs = kpisResponse.data.data || [];
      console.log('Loaded KPI details:', allKPIs.length);
      setKPIs(allKPIs);
      
      // Pre-load monthly data for all KPI values for the current financial year
      const currentYear = new Date().getFullYear();
      console.log('Pre-loading monthly data for year:', currentYear);
      for (const kpiValue of kpiValues) {
        await loadMonthlyData(kpiValue.id, currentYear);
      }
      
      // Don't automatically select a KPI - let the user choose from the hierarchy view
      // If user clicks on a specific KPI, selectKPI will be called then
      setSelectedKPI(null);
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
    const kpiValuesForSelected = kpiValues || assignedKPIValuesForYear.filter(kv => kv.kpi_id === kpi.id);
    
    try {
      // Load monthly data for each KPI value for the selected year
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
      
      const isEmptyValue = (value) => value === '' || value === null || value === undefined;
      const payload = {
        kpiValueId,
        kpiId: selectedKPI.id,
        empId: user.empid,
        month: calendarMonth,
        year: calendarYear,
        targetValue: isEmptyValue(targetValue) ? null : targetValue,
        actualValue: isEmptyValue(actualValue) ? null : actualValue
      };
      
      console.log('Submitting KPI data:', payload);
      
      const response = await api.post('/employees/kpi-data', payload);
      
      console.log('Save response:', response.data);
      showNotification('Data saved successfully! Computing dependent KPIs...', 'success');
      
      // Store state before reload to compare
      const previousData = { ...monthlyData };
      
      // Reload monthly data for ALL assigned KPI values to refresh computed values
      // This ensures dependent computed KPIs are also updated on the page
      console.log('Reloading all KPI values monthly data to refresh computed values...');
      const reloadPromises = assignedKPIValuesForYear.map(value => 
        loadMonthlyData(value.id, selectedYear)
      );
      await Promise.all(reloadPromises);
      console.log('All KPI values refreshed successfully');
      
      // Identify computed KPIs that were updated for the same month
      const updatedComputed = [];
      for (const kpiValue of assignedKPIValuesForYear) {
        if (String(kpiValue.kpi_type).toLowerCase() === 'computed') {
          const newData = monthlyData[kpiValue.id] || [];
          const oldData = previousData[kpiValue.id] || [];
          
          const newMonthData = newData.find(d => d.month === calendarMonth);
          const oldMonthData = oldData.find(d => d.month === calendarMonth);
          
          if (newMonthData && newMonthData.actual_value !== oldMonthData?.actual_value) {
            updatedComputed.push({
              name: kpiValue.data,
              value: newMonthData.actual_value,
              unit: kpiValue.unit_symbol
            });
          }
        }
      }
      
      // Store updated KPIs for display
      if (updatedComputed.length > 0) {
        setRecentlyUpdatedKPIs(updatedComputed);
        setTimeout(() => setRecentlyUpdatedKPIs([]), 10000); // Clear after 10 seconds
      }
      
      // Show success message with information about dependent KPIs
      const message = updatedComputed.length > 0 
        ? `✓ Data saved and ${updatedComputed.length} dependent KPI${updatedComputed.length > 1 ? 's have' : ' has'} been computed!`
        : '✓ Data saved successfully!';
      showNotification(message, 'success');
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

  // Fetch dependent KPI values for formula display
  const fetchFormulaDetails = async (kpiValueId, formula, month, monthIndex) => {
    try {
      const sourceIds = extractSourceKpiIds(formula);
      if (sourceIds.length === 0) {
        setFormulaDetailsModal({
          show: true,
          data: {
            month,
            formula,
            dependencies: [],
            computedFormula: formula
          }
        });
        return;
      }

      const dependencies = [];
      const calendarMonth = getCalendarMonth(monthIndex);
      const calendarYear = monthIndex >= 9 ? selectedYear + 1 : selectedYear;

      // Fetch actual values from kpi_data_values table for each dependent KPI
      for (const sourceId of sourceIds) {
        try {
          // Get KPI value details
          const kpiValueResponse = await api.get(`/kpi-values/${sourceId}`);
          const kpiValueData = kpiValueResponse.data.data;

          // Get the monthly data for this specific month/year
          const monthlyResponse = await api.get(`/kpi-values/${sourceId}/monthly-data/${calendarYear}`);
          const monthlyDataArray = monthlyResponse.data.data || [];
          const monthData = monthlyDataArray.find(d => d.month === calendarMonth) || {};

          dependencies.push({
            id: sourceId,
            name: kpiValueData.data || `v${sourceId}`,
            value: monthData.actual_value,
            unit: kpiValueData.unit_symbol,
            hasValue: monthData.actual_value !== null && monthData.actual_value !== undefined && monthData.actual_value !== ''
          });
        } catch (error) {
          console.error(`Failed to fetch data for v${sourceId}:`, error);
          dependencies.push({
            id: sourceId,
            name: `v${sourceId}`,
            value: null,
            unit: '',
            hasValue: false
          });
        }
      }

      // Build computed formula with actual values
      let computedFormula = formula;
      dependencies.forEach(dep => {
        const vPattern = new RegExp(`v${dep.id}(?::actual)?`, 'gi');
        const displayValue = dep.hasValue ? String(dep.value) : '?';
        computedFormula = computedFormula.replace(vPattern, displayValue);
      });

      setFormulaDetailsModal({
        show: true,
        data: {
          month,
          formula,
          dependencies,
          computedFormula
        }
      });
    } catch (error) {
      console.error('Failed to fetch formula details:', error);
      showNotification('Failed to load formula details', 'error');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getMonthData = (kpiValueId, fyMonthIndex) => {
    const data = monthlyData[kpiValueId] || [];
    const calendarMonth = getCalendarMonth(fyMonthIndex);
    return data.find(d => d.month === calendarMonth) || {};
  };

  // Helper function to format numeric values with commas and decimals
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    // Format with commas and 2 decimal places
    return numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Extract KPI Value IDs from formula (v123, v456, etc.)
  const extractSourceKpiIds = (formula) => {
    if (!formula) return [];
    const matches = formula.match(/v(\d+)(?::(?:actual|target))?/gi) || [];
    const ids = matches.map(m => {
      const idMatch = /v(\d+)/i.exec(m);
      return idMatch ? parseInt(idMatch[1]) : null;
    }).filter(id => id !== null);
    return [...new Set(ids)];
  };

  // Build formula with actual values for a specific month
  const buildFormulaWithValues = (formula, kpiValue, fyMonthIndex) => {
    if (!formula) return null;

    const sourceIds = extractSourceKpiIds(formula);
    if (sourceIds.length === 0) return null;

    const currentMonth = months[fyMonthIndex];
    const dependencies = [];
    let readableFormula = formula;

    sourceIds.forEach(sourceId => {
      // Find the KPI value object by ID - search in ALL assigned KPI values
      const sourceKpiValue = assignedKPIValues.find(kv => kv.id === sourceId);
      
      if (!sourceKpiValue) {
        // If not found, show the ID
        dependencies.push({
          id: sourceId,
          name: `v${sourceId}`,
          actual: null,
          unit: '',
          hasValue: false
        });
        return;
      }

      // Get the monthly data for this source KPI value for the SAME month
      const monthData = getMonthData(sourceId, fyMonthIndex);
      const actualValue = monthData.actual_value;
      const targetValue = monthData.target_value;
      
      const kpiName = sourceKpiValue.data || `v${sourceId}`;
      
      // Replace v{id} references with actual numeric value in the formula
      const vPattern = new RegExp(`v${sourceId}(?::actual)?`, 'gi');
      const displayValue = actualValue !== null && actualValue !== undefined && actualValue !== '' 
        ? String(actualValue) 
        : '?';
      readableFormula = readableFormula.replace(vPattern, displayValue);
      
      // Store dependency info
      dependencies.push({
        id: sourceId,
        name: kpiName,
        actual: actualValue,
        target: targetValue,
        unit: sourceKpiValue.unit_symbol,
        hasValue: actualValue !== null && actualValue !== undefined && actualValue !== ''
      });
    });

    // Build a user-friendly formula display with month context
    const dependencyList = dependencies.map(dep => {
      const actualStr = formatValue(dep.actual);
      const unitStr = dep.unit ? ` ${dep.unit}` : '';
      const status = dep.hasValue ? '' : ' (No data)';
      return `  v${dep.id} - ${dep.name}: ${actualStr}${unitStr}${status}`;
    }).join('\n');

    return {
      formula,
      dependencies,
      formulaDisplay: dependencies.length > 0 
        ? `${currentMonth}\n\nComputed Formula:\n${readableFormula}\n\nDependent KPIs:\n${dependencyList}`
        : formula
    };
  };

  // Helper function to get root KPIs (those with no parent)
  const getRootKPIs = () => {
    return visibleKPIsForYear.filter(kpi => !kpi.parent_kpi_id || kpi.parent_kpi_id === null);
  };

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper function to build KPI hierarchy
  const buildKPIHierarchy = (parentKPI) => {
    const hierarchy = [
      {
        kpi: parentKPI,
        children: []
      }
    ];

    // Find all child KPIs
    const findChildren = (parentId) => {
      return visibleKPIsForYear.filter(kpi => kpi.parent_kpi_id === parentId);
    };

    // Recursively build the tree
    const addChildren = (node) => {
      const children = findChildren(node.kpi.id);
      node.children = children.map(child => ({
        kpi: child,
        children: []
      }));
      node.children.forEach(child => addChildren(child));
    };

    addChildren(hierarchy[0]);
    return hierarchy[0];
  };

  // Helper function to render KPI node with expandable children
  const renderKPINode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.kpi.id);
    const hasChildren = (node.children || []).length > 0;
    const kpiValues = assignedKPIValuesForYear.filter(kv => kv.kpi_id === node.kpi.id);
    
    return (
      <div key={node.kpi.id} className="kpi-node" style={{ marginLeft: depth * 16 }}>
        <div className="kpi-node-header">
          <button
            className={`accordion-toggle ${hasChildren ? '' : 'empty'}`}
            onClick={() => hasChildren && toggleExpand(node.kpi.id)}
            aria-label={hasChildren ? 'Toggle children' : 'No children'}
            type="button"
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
          </button>
          <div className="kpi-node-body">
            <div className="kpi-node-title">{node.kpi.title}</div>
            <div className="kpi-node-meta">
              {kpiValues.length > 0 && <span className="badge">📊 {kpiValues.length} Value(s)</span>}
            </div>
          </div>
          <div className="kpi-node-actions">
            <button className="btn-ghost" type="button" onClick={() => selectKPI(node.kpi, kpiValues)}>👁️ View</button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="kpi-children">
            {node.children.map((child) => renderKPINode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to render selected KPI with all values and data
  const renderKPIWithValues = (node) => {
    const kpiValues = assignedKPIValuesForYear.filter(kv => kv.kpi_id === node.kpi.id);
    
    return (
      <div key={node.kpi.id} className="kpi-hierarchy-section">
        <div className="kpi-section-header">
          <h3 className="kpi-section-title">{node.kpi.title}</h3>
        </div>

        {kpiValues.length > 0 ? (
          <div className="kpi-values-cards-container">
            {kpiValues.map((kpiValue) => (
              <div key={kpiValue.id} className="kpi-value-card">
                <div className="kpi-value-header">
                  <div className="kpi-value-info">
                    <h3 className="kpi-value-title">{kpiValue.data}</h3>
                    <div className="kpi-value-meta">
                      <span className="type-badge" title="KPI Type">{String(kpiValue.kpi_type).toLowerCase() === 'computed' ? '🧮 Computed' : '📝 Manual'}</span>
                      {kpiValue.unit_symbol && (
                        <span className="unit-badge" title="Unit of Measurement">📏 {kpiValue.unit_symbol}</span>
                      )}
                      {kpiValue.target_required && (
                        <span className="target-badge" title="Target Required">🎯 Target Required</span>
                      )}
                    </div>
                  </div>
                </div>

                {String(kpiValue.kpi_type).toLowerCase() === 'computed' && kpiValue.formula && (
                  <div className="formula-section">
                    <p className="formula-label">Formula:</p>
                    <code className="formula-display">{kpiValue.formula}</code>
                  </div>
                )}

                <div className="monthly-data-section">
                  <h4 className="monthly-section-title">Monthly Data - FY {selectedYear}-{String(selectedYear + 1).slice(-2)}</h4>
                  {String(kpiValue.kpi_type).toLowerCase() === 'manual' ? (
                    // Manual KPI - Enter both actual and target
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
                            initialTarget={monthData.target_value ?? ''}
                            initialActual={monthData.actual_value ?? ''}
                            unitSymbol={kpiValue.unit_symbol}
                            defaultTargetValue={kpiValue.default_target_value}
                            onSubmit={handleDataSubmit}
                          />
                        );
                      })}
                    </div>
                  ) : String(kpiValue.kpi_type).toLowerCase() === 'computed' && (kpiValue.computation_type === 'target_computed' || (kpiValue.target_formula && kpiValue.target_formula.trim() !== '')) ? (
                    // OPTION 3: Target computed, actual manual - Enter actual manually
                    <div className="monthly-data-grid">
                      {months.map((month, index) => {
                        const monthData = getMonthData(kpiValue.id, index);
                        const formulaInfo = buildFormulaWithValues(kpiValue.target_formula, kpiValue, index);
                        return (
                          <MonthlyDataFormOption3
                            key={index}
                            month={month}
                            monthIndex={index}
                            kpiValueId={kpiValue.id}
                            initialActual={monthData.actual_value ?? ''}
                            initialTarget={monthData.target_value ?? ''}
                            unitSymbol={kpiValue.unit_symbol}
                            targetFormula={kpiValue.target_formula}
                            onViewFormula={() => fetchFormulaDetails(kpiValue.id, kpiValue.target_formula, month, index)}
                            onSubmit={handleDataSubmit}
                          />
                        );
                      })}
                    </div>
                  ) : String(kpiValue.kpi_type).toLowerCase() === 'computed' && kpiValue.computation_type === 'actual_computed' ? (
                    // OPTION 2: Actual computed, target manual - Enter target manually
                    <div className="monthly-data-grid">
                      {months.map((month, index) => {
                        const monthData = getMonthData(kpiValue.id, index);
                        const formulaInfo = buildFormulaWithValues(kpiValue.formula, kpiValue, index);
                        return (
                          <MonthlyDataFormOption2
                            key={index}
                            month={month}
                            monthIndex={index}
                            kpiValueId={kpiValue.id}
                            initialActual={monthData.actual_value ?? ''}
                            initialTarget={monthData.target_value ?? ''}
                            unitSymbol={kpiValue.unit_symbol}
                            formula={kpiValue.formula}
                            onViewFormula={() => fetchFormulaDetails(kpiValue.id, kpiValue.formula, month, index)}
                            defaultTargetValue={kpiValue.default_target_value}
                            onSubmit={handleDataSubmit}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    // OPTION 1: Both computed - Display calculated values (read-only)
                    <div className="monthly-data-grid">
                      {months.map((month, index) => {
                        const monthData = getMonthData(kpiValue.id, index);
                        const hasComputedValue = monthData.actual_value !== null && monthData.actual_value !== undefined && monthData.actual_value !== '';
                        const formulaInfo = buildFormulaWithValues(kpiValue.formula, kpiValue, index);
                        return (
                          <div
                            key={index}
                            className={`month-card computed ${hasComputedValue ? 'has-value' : 'missing-value'}`}
                          >
                            <div className="month-card-header">
                              <h4>{month}</h4>
                              {hasComputedValue && kpiValue.formula && (
                                <button 
                                  className="formula-view-btn"
                                  onClick={() => fetchFormulaDetails(kpiValue.id, kpiValue.formula, month, index)}
                                  title="View formula details"
                                >
                                  👁️
                                </button>
                              )}
                            </div>
                            <div className="data-display">
                              {kpiValue.target_required && (
                                <p className="data-row">
                                  <strong>Target:</strong> {formatValue(monthData.target_value ?? kpiValue.default_target_value)}
                                  {kpiValue.unit_symbol && <span className="unit-label"> {kpiValue.unit_symbol}</span>}
                                </p>
                              )}
                              {hasComputedValue ? (
                                <>
                                  <p className="data-row">
                                    <strong>Calculated:</strong> 
                                    <span className="computed-value">
                                      {formatValue(monthData.actual_value)}
                                    </span>
                                    {kpiValue.unit_symbol && <span className="unit-label"> {kpiValue.unit_symbol}</span>}
                                  </p>
                                  <p className="computed-note">🔧 Auto-calculated</p>
                                </>
                              ) : (
                                <>
                                  <p className="data-row">
                                    <strong>Calculated:</strong> 
                                    <span className="computed-value-missing">Not Available</span>
                                  </p>
                                  <p className="computed-note warning">⚠️ Waiting for dependent KPI values</p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-values-message">
            <p>No values assigned to this KPI.</p>
          </div>
        )}

        {/* Render child KPIs */}
        {node.children && node.children.length > 0 && (
          <div className="kpi-children-container">
            {node.children.map(child => renderKPIWithValues(child))}
          </div>
        )}
      </div>
    );
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
          <div className="sidebar-header">
            <h3>Menu</h3>
          </div>
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
              title="Dashboard"
            >
              <span className="sidebar-icon">📊</span>
              <span className="sidebar-label">Dashboard</span>
            </button>
            <button 
              className={`sidebar-item ${activeView === 'kpis' ? 'active' : ''}`}
              onClick={() => { setActiveView('kpis'); setSelectedKPI(null); }}
              title="My KPIs/KAIs"
            >
              <span className="sidebar-icon">📈</span>
              <span className="sidebar-label">My KPIs/KAIs</span>
            </button>
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
          
          {activeView === 'dashboard' ? (
            <div className="dashboard-view">
              <div className="dashboard-header">
                <h2>Dashboard</h2>
                <p className="dashboard-subtitle">Your KPI/KAI Overview</p>
              </div>
              
              {loading ? (
                <div className="loading-text">Loading dashboard...</div>
              ) : (
                <div className="dashboard-grid">
                  <div className="stat-card">
                    <div className="stat-card-content">
                      <div className="stat-icon">📊</div>
                      <div className="stat-info">
                        <h3>Total KPIs/KAIs</h3>
                        <p className="stat-number">{assignedKPIIdsForYear.size}</p>
                        <p className="stat-description">Assigned to you</p>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-content">
                      <div className="stat-icon">✓</div>
                      <div className="stat-info">
                        <h3>Total Values Assigned</h3>
                        <p className="stat-number">{assignedKPIValuesForYear.length}</p>
                        <p className="stat-description">Measurement points</p>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-content">
                      <div className="stat-icon">📈</div>
                      <div className="stat-info">
                        <h3>Data Entries</h3>
                        <p className="stat-number">{Object.values(monthlyData).flat().length}</p>
                        <p className="stat-description">Monthly records</p>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-content">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-info">
                        <h3>Current Year</h3>
                        <p className="stat-number">{selectedYear}-{String(selectedYear + 1).slice(-2)}</p>
                        <p className="stat-description">Financial Year</p>
                        <div className="year-controls">
                          <button
                            className="year-btn"
                            onClick={() => changeYear(-1)}
                            aria-label="Previous financial year"
                          >
                            ← Prev
                          </button>
                          <button
                            className="year-btn"
                            onClick={() => changeYear(1)}
                            aria-label="Next financial year"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loading && kpis.length > 0 && (
                <div className="dashboard-section">
                  <h3>Quick Actions</h3>
                  <button 
                    className="action-button"
                    onClick={() => setActiveView('kpis')}
                  >
                    View All KPIs/KAIs →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {!selectedKPI ? (
                <div className="kpi-page">
                  <div className="page-header">
                    <div className="heading-section">
                      <h2>My KPIs/KAIs</h2>
                    </div>
                  </div>

                  <div className="filters-block">
                    <div className="filters-group">
                      <div className="year-filter">
                        <label htmlFor="financial-year">Financial Year:</label>
                        <select
                          id="financial-year"
                          value={selectedYear}
                          onChange={(e) => updateFinancialYear(parseInt(e.target.value))}
                          className="year-dropdown"
                        >
                          {[...Array(5)].map((_, i) => {
                            const year = selectedYear - 2 + i;
                            return <option key={year} value={year}>{year}-{String(year + 1).slice(-2)}</option>;
                          })}
                        </select>
                      </div>
                      <div className="search-filter">
                        <label htmlFor="search-kpi">Search KPI:</label>
                        <input
                          id="search-kpi"
                          type="text"
                          placeholder="Search by title..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="search-input"
                        />
                        {searchQuery && (
                          <button
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                            type="button"
                            title="Clear search"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="loading">Loading KPIs...</div>
                  ) : visibleKPIsForYear.length === 0 ? (
                    <div className="no-data">No KPIs/KAIs assigned to you for FY {getSelectedFinancialYear()}.</div>
                  ) : (
                    <div className="tree-container">
                      {getRootKPIs().map(rootKPI => 
                        renderKPINode(buildKPIHierarchy(rootKPI))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="kpi-details">
                  <div className="page-header">
                    <div className="heading-section">
                      <button 
                        className="back-btn"
                        onClick={() => setSelectedKPI(null)}
                        title="Back to KPI list"
                      >
                        ← Back
                      </button>
                      <div className="breadcrumb-container">
                        <nav className="breadcrumb" aria-label="KPI hierarchy">
                          {buildBreadcrumb(selectedKPI).map((kpi, index, array) => (
                            <span key={kpi.id} className="breadcrumb-item">
                              <span className="breadcrumb-type-badge">{getCategoryName(kpi.category_id)}</span>
                              <span className="breadcrumb-text">{kpi.title}</span>
                              {index < array.length - 1 && <span className="breadcrumb-separator">›</span>}
                            </span>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>

                  <div className="filters-block">
                    <div className="filters-group">
                      <div className="year-filter">
                        <label htmlFor="financial-year-detail">Financial Year:</label>
                        <select
                          id="financial-year-detail"
                          value={selectedYear}
                          onChange={(e) => updateFinancialYear(parseInt(e.target.value))}
                          className="year-dropdown"
                        >
                          {[...Array(5)].map((_, i) => {
                            const year = selectedYear - 2 + i;
                            return <option key={year} value={year}>{year}-{String(year + 1).slice(-2)}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="tree-container">
                    {recentlyUpdatedKPIs.length > 0 && (
                      <div className="recently-updated-kpis">
                        <h3 className="updated-kpis-title">✓ Recently Auto-Computed KPIs</h3>
                        <div className="updated-kpis-list">
                          {recentlyUpdatedKPIs.map((kpi, idx) => (
                            <div key={idx} className="updated-kpi-item">
                              <span className="updated-kpi-name">{kpi.name}:</span>
                              <span className="updated-kpi-value">
                                {formatValue(kpi.value)}
                                {kpi.unit && <span className="unit-label"> {kpi.unit}</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {renderKPIWithValues(buildKPIHierarchy(selectedKPI))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          className="scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Back to top"
        >
          ↑
        </button>
      )}

      {/* Formula Details Modal */}
      {formulaDetailsModal.show && formulaDetailsModal.data && (
        <div className="modal-overlay" onClick={() => setFormulaDetailsModal({ show: false, data: null })}>
          <div className="formula-modal" onClick={(e) => e.stopPropagation()}>
            <div className="formula-modal-header">
              <h3>Formula Details - {formulaDetailsModal.data.month}</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setFormulaDetailsModal({ show: false, data: null })}
              >
                ×
              </button>
            </div>
            <div className="formula-modal-body">
              <div className="formula-section">
                <h4>Formula:</h4>
                <code className="formula-code">{formulaDetailsModal.data.formula}</code>
              </div>
              
              {formulaDetailsModal.data.dependencies && formulaDetailsModal.data.dependencies.length > 0 && (
                <>
                  <div className="formula-section">
                    <h4>Computed With Values:</h4>
                    <code className="formula-code computed">{formulaDetailsModal.data.computedFormula}</code>
                  </div>

                  <div className="formula-section">
                    <h4>Dependent KPI Values ({formulaDetailsModal.data.month}):</h4>
                    <table className="dependencies-table">
                      <thead>
                        <tr>
                          <th>Variable</th>
                          <th>KPI Name</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formulaDetailsModal.data.dependencies.map((dep, idx) => (
                          <tr key={idx} className={dep.hasValue ? '' : 'no-data'}>
                            <td><code>v{dep.id}</code></td>
                            <td>{dep.name}</td>
                            <td>
                              {dep.hasValue ? (
                                <>
                                  {formatValue(dep.value)}
                                  {dep.unit && <span className="unit"> {dep.unit}</span>}
                                </>
                              ) : (
                                <span className="no-data-text">No data</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Monthly Data Form Component
function MonthlyDataForm({ month, monthIndex, kpiValueId, targetRequired, initialTarget, initialActual, unitSymbol, defaultTargetValue, onSubmit }) {
  const [targetValue, setTargetValue] = useState(initialTarget);
  const [actualValue, setActualValue] = useState(initialActual);
  const [isEditing, setIsEditing] = useState(false);
  const isEmptyValue = (value) => value === '' || value === null || value === undefined;

  // Helper function to format numeric values for display
  const formatDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    // Format with commas and 2 decimal places
    return numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Helper function to get target value (prioritize entered value, then default value)
  const getTargetDisplay = () => {
    if (!isEmptyValue(targetValue)) {
      return formatDisplayValue(targetValue);
    }
    if (!isEmptyValue(defaultTargetValue)) {
      return <span className="default-value-badge">{formatDisplayValue(defaultTargetValue)} <span className="badge-text">(Default)</span></span>;
    }
    return '-';
  };

  useEffect(() => {
    // Use initialTarget, or default to defaultTargetValue if initialTarget is empty
    setTargetValue(isEmptyValue(initialTarget) ? defaultTargetValue : initialTarget);
    setActualValue(initialActual);
  }, [initialTarget, initialActual, defaultTargetValue]);

  const handleSave = () => {
    const resolvedTargetValue = targetRequired
      ? (isEmptyValue(targetValue) ? (isEmptyValue(defaultTargetValue) ? null : defaultTargetValue) : targetValue)
      : null;
    onSubmit(kpiValueId, monthIndex, resolvedTargetValue, actualValue);
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
            <p className="data-row">
              <strong>Target:</strong> {getTargetDisplay()}
              {unitSymbol && <span className="unit-label"> {unitSymbol}</span>}
            </p>
          )}
          <p className="data-row">
            <strong>Actual:</strong> {formatDisplayValue(actualValue)}
            {unitSymbol && <span className="unit-label"> {unitSymbol}</span>}
          </p>
          <button className="btn-edit" onClick={() => setIsEditing(true)}>
            {!isEmptyValue(targetValue) || !isEmptyValue(actualValue) ? 'Edit' : 'Add Data'}
          </button>
        </div>
      )}
    </div>
  );
}

// Option 3: Actual manual, target computed using formula
function MonthlyDataFormOption3({ month, monthIndex, kpiValueId, initialActual, initialTarget, unitSymbol, targetFormula, onViewFormula, onSubmit }) {
  const [actualValue, setActualValue] = useState(initialActual);
  const [isEditing, setIsEditing] = useState(false);
  const isEmptyValue = (value) => value === '' || value === null || value === undefined;

  // Helper function to format numeric values for display
  const formatDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    setActualValue(initialActual);
  }, [initialActual]);

  const handleSave = () => {
    // For Option 3, we only submit the actual value; target will be computed by backend
    onSubmit(kpiValueId, monthIndex, null, actualValue);
    setIsEditing(false);
  };

  return (
    <div className="month-card option3">
      <div className="month-card-header">
        <h4>{month}</h4>
        {initialTarget !== null && initialTarget !== undefined && initialTarget !== '' && targetFormula && onViewFormula && (
          <button 
            className="formula-view-btn"
            onClick={onViewFormula}
            title="View formula details"
          >
            👁️
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="form-inputs">
          <div className="form-group">
            <label>Actual Value:</label>
            <input
              type="text"
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
              placeholder="Enter actual value"
            />
          </div>
          <div className="form-note">
            <p className="note-text">📊 Target will be automatically computed using formula</p>
            <p className="formula-text">Formula: <code>{targetFormula}</code></p>
          </div>
          <div className="form-actions">
            <button className="btn-save" onClick={handleSave}>Save</button>
            <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="data-display">
          <p className="data-row">
            <strong>Target:</strong>
            <span className="computed-value">
              {formatDisplayValue(initialTarget)}
            </span>
            {unitSymbol && <span className="unit-label"> {unitSymbol}</span>}
            <span className="computed-badge">🔧 Computed</span>
          </p>
          <p className="data-row">
            <strong>Actual:</strong> {formatDisplayValue(actualValue)}
            {unitSymbol && <span className="unit-label"> {unitSymbol}</span>}
          </p>
          <button className="btn-edit" onClick={() => setIsEditing(true)}>
            {!isEmptyValue(actualValue) ? 'Edit' : 'Add Data'}
          </button>
        </div>
      )}
    </div>
  );
}

// Option 2: Actual computed, target manual entry
function MonthlyDataFormOption2({ month, monthIndex, kpiValueId, initialActual, initialTarget, unitSymbol, formula, onViewFormula, defaultTargetValue, onSubmit }) {
  const [targetValue, setTargetValue] = useState(initialTarget);
  const [isEditing, setIsEditing] = useState(false);
  const isEmptyValue = (value) => value === '' || value === null || value === undefined;

  // Helper function to format numeric values for display
  const formatDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    // Use initialTarget, or default to defaultTargetValue if initialTarget is empty
    setTargetValue(isEmptyValue(initialTarget) ? defaultTargetValue : initialTarget);
  }, [initialTarget, defaultTargetValue]);

  const handleSave = () => {
    // For Option 2, we submit the target value; actual will be computed by backend
    const resolvedTargetValue = isEmptyValue(targetValue) ? (isEmptyValue(defaultTargetValue) ? null : defaultTargetValue) : targetValue;
    onSubmit(kpiValueId, monthIndex, resolvedTargetValue, null);
    setIsEditing(false);
  };

  return (
    <div className="month-card option2">
      <div className="month-card-header">
        <h4>{month}</h4>
        {initialActual !== null && initialActual !== undefined && initialActual !== '' && formula && onViewFormula && (
          <button 
            className="formula-view-btn"
            onClick={onViewFormula}
            title="View formula details"
          >
            👁️
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="form-inputs">
          <div className="form-group">
            <label>Target Value:</label>
            <input
              type="text"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder={defaultTargetValue ? `Default: ${defaultTargetValue}` : 'Enter target value'}
            />
          </div>
          <div className="form-note">
            <p className="note-text">📊 Actual value will be automatically computed using formula</p>
            <p className="formula-text">Formula: <code>{formula}</code></p>
          </div>
          <div className="form-actions">
            <button className="btn-save" onClick={handleSave}>Save</button>
            <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="data-display">
          <p className="data-row">
            <strong>Actual:</strong>
            <span className="computed-value">
              {formatDisplayValue(initialActual)}
            </span>
            {unitSymbol && <span className="unit-label"> {unitSymbol}</span>}
            <span className="computed-badge">🔧 Computed</span>
          </p>
          <p className="data-row">
            <strong>Target:</strong> {formatDisplayValue(targetValue)}
            {unitSymbol && <span className="unit-label"> {unitSymbol}</span>}
          </p>
          <button className="btn-edit" onClick={() => setIsEditing(true)}>
            {!isEmptyValue(targetValue) ? 'Edit' : 'Add Data'}
          </button>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
