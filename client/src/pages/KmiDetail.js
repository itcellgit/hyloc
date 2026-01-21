import React, { useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/auth';
import '../styles/KmiDetail.css';
import '../styles/FormulaStyles.css';

function KmiDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [parentKpis, setParentKpis] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    title: '',
    fin_year: '',
    kpi_type: 'Plant KPI',
    parent_kpi_id: id || ''
  });
  const [kpiValues, setKpiValues] = useState([]);
  const [allKpiValues, setAllKpiValues] = useState([]);
  const [allKpis, setAllKpis] = useState([]);
  const [formulaVars, setFormulaVars] = useState([]); // e.g., ['v1','v2','v3'] in order
  const [varSelections, setVarSelections] = useState({}); // { v1: 123, v2: 456 }
  const [varSearchQueries, setVarSearchQueries] = useState({}); // { v1: 'availability', v2: '' }
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [units, setUnits] = useState([]);
  const [pillers, setPillers] = useState([]);
  const [valueFormData, setValueFormData] = useState({
    kpi_id: '',
    data: '',
    data_operator: '',
    target_required: true,
    uom: '',
    kpi_type: 'manual',
    piller_id: '',
    formula: '',
    source_kpi_value_ids: [],
    default_target_value: ''
  });
  const dropdownRef = useRef(null);

  const kmi = location.state?.kmi || { id, title: 'Loading...', fin_year: '' };

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/' },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments' },
    { id: 3, label: 'Users', icon: '👥', path: '/users' },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis' },
    { id: 5, label: 'Pillers', icon: '🏛️', path: '/pillers' },
    { id: 6, label: 'Roles', icon: '🎭', path: '/roles' },
    { id: 7, label: 'User Roles', icon: '🔐', path: '/user-roles' },
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

  const loadKpiValues = React.useCallback(async (kpiId) => {
    if (!kpiId) return;
    try {
      const response = await api.get(`/kpi-values?kpi_id=${kpiId}`);
      const values = response.data?.data || [];
      console.log('Loaded KPI Values:', values);
      setKpiValues(values);
    } catch (err) {
      console.error('Failed to load KPI values', err);
      setKpiValues([]);
    }
  }, []);

  React.useEffect(() => {
    // Load KPI values for the current KPI (from URL params)
    if (id) {
      loadKpiValues(id);
    }
  }, [id, loadKpiValues]);

  // Load all KPI values and KPIs so we can filter by financial year and allow cross-KPI refs
  React.useEffect(() => {
    const loadAllKpiValues = async () => {
      try {
        const response = await api.get('/kpi-values');
        setAllKpiValues(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load all KPI values', err);
        setAllKpiValues([]);
      }
    };
    const loadAllKpis = async () => {
      try {
        const response = await api.get('/kpis');
        setAllKpis(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load KPIs', err);
        setAllKpis([]);
      }
    };
    loadAllKpiValues();
    loadAllKpis();
  }, []);

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    const loadUsers = async () => {
      try {
        console.log('Fetching users...');
        const response = await api.get('/users');
        console.log('Users response:', response.data);
        setUsers(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };

    const loadUnits = async () => {
      try {
        const response = await api.get('/unit-master');
        setUnits(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load units', err);
      }
    };

    const loadPillers = async () => {
      try {
        const response = await api.get('/pillers');
        setPillers(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load pillers', err);
      }
    };

    loadCategories();
    loadUsers();
    loadUnits();
    loadPillers();
  }, []);

  const handleEditValue = (value) => {
    setEditingValue(value);
    
    // Parse formula to extract variables and set up selections
    const formula = value.formula || '';
    const sourceIds = Array.isArray(value.source_kpi_value_ids)
      ? value.source_kpi_value_ids
      : (typeof value.source_kpi_value_ids === 'string'
          ? value.source_kpi_value_ids.split(',').map((x) => Number(x)).filter((n) => !Number.isNaN(n))
          : []);
    
    // Extract variables from formula
    const tokens = [];
    const seen = new Set();
    const regex = /v(\d+)/g;
    let match;
    while ((match = regex.exec(formula)) !== null) {
      const token = `v${match[1]}`;
      if (!seen.has(token)) {
        seen.add(token);
        tokens.push(token);
      }
    }
    setFormulaVars(tokens);
    
    // Build variable selections map from the actual IDs in the formula
    const selections = {};
    tokens.forEach((tok) => {
      const idNum = parseInt(tok.substring(1));
      if (sourceIds.includes(idNum)) {
        selections[tok] = idNum;
      }
    });
    setVarSelections(selections);
    
    setValueFormData({
      kpi_id: value.kpi_id,
      data: value.data || '',
      // Backend returns column as "data operator" (with space), so normalize here
      data_operator:
        value.data_operator != null
          ? String(value.data_operator)
          : value['data operator'] != null
          ? String(value['data operator'])
          : '',
      target_required: value.target_required !== undefined ? value.target_required : true,
      uom: value.uom ? String(value.uom) : '',
      kpi_type: value.kpi_type || 'manual',
      piller_id: value.piller_id ? String(value.piller_id) : '',
      formula: formula,
      source_kpi_value_ids: sourceIds,
      default_target_value: value.default_target_value ? String(value.default_target_value) : ''
    });
    setShowValueModal(true);
  };

  const handleDeleteValue = async (valueId) => {
    if (!window.confirm('Are you sure you want to delete this KPI value?')) return;
    
    try {
      await api.delete(`/kpi-values/${valueId}`);
      await loadKpiValues(id);
      showNotification('KPI value deleted successfully!', 'success');
    } catch (err) {
      console.error('Failed to delete KPI value', err);
      showNotification('Failed to delete KPI value', 'error');
    }
  };

  const handleValueChange = (e) => {
    const { name, value } = e.target;
    setValueFormData((prev) => ({ ...prev, [name]: value }));

    // If formula changed, parse variables like v1, v2, v3
    if (name === 'formula') {
      const tokens = [];
      const seen = new Set();
      const regex = /v(\d+)/g;
      let match;
      while ((match = regex.exec(value)) !== null) {
        const token = `v${match[1]}`;
        if (!seen.has(token)) {
          seen.add(token);
          tokens.push(token);
        }
      }
      setFormulaVars(tokens);
      // Drop selections for variables no longer present
      setVarSelections((prev) => {
        const next = {};
        tokens.forEach(t => { if (prev[t] != null) next[t] = prev[t]; });
        return next;
      });
    }
  };

  // Helper: get KPI title and fin year by kpi_id
  const getKpiMeta = (kpiId) => {
    const k = allKpis.find(k => String(k.id) === String(kpiId));
    return { title: k?.title || `KPI #${kpiId}`, fin_year: k?.fin_year || '' };
  };

  // Options filtered by current KMI financial year
  const allowedValuesForYear = React.useMemo(() => {
    const year = kmi.fin_year;
    if (!year) return [];
    return allKpiValues.filter(kv => getKpiMeta(kv.kpi_id).fin_year === year);
  }, [allKpiValues, allKpis, kmi.fin_year]);

  // Replace placeholders v1/v2/... with actual v<ID> selections
  const resolveFormulaWithSelections = (formula) => {
    let resolved = formula || '';
    formulaVars.forEach((tok) => {
      const sel = varSelections[tok];
      if (sel) {
        const safeTok = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(safeTok, 'g');
        resolved = resolved.replace(re, `v${sel}`);
      }
    });
    return resolved;
  };

  const handleValueSubmit = async (e) => {
    e.preventDefault();
    try {
      // If computed, ensure variable selections are complete and build resolved formula + deps
      if (valueFormData.kpi_type === 'computed') {
        if (!valueFormData.formula || valueFormData.formula.trim() === '') {
          showNotification('Formula is required for computed KPI', 'error');
          return;
        }
        // Require selections for each variable present
        for (const tok of formulaVars) {
          if (!varSelections[tok]) {
            showNotification(`Select a KPI value for ${tok}`, 'error');
            return;
          }
        }
      }

      const payload = {
        kpi_id: valueFormData.kpi_id,
        data: valueFormData.data,
        data_operator: valueFormData.data_operator || null,
        target_required: valueFormData.target_required,
        uom: valueFormData.uom ? parseInt(valueFormData.uom) : null,
        kpi_type: valueFormData.kpi_type,
        piller_id: valueFormData.piller_id ? parseInt(valueFormData.piller_id) : null,
        formula: valueFormData.kpi_type === 'computed'
          ? resolveFormulaWithSelections(valueFormData.formula)
          : null,
        source_kpi_value_ids: valueFormData.kpi_type === 'computed'
          ? formulaVars.map(tok => Number(varSelections[tok])).filter(n => !Number.isNaN(n))
          : null,
        default_target_value: valueFormData.default_target_value ? parseInt(valueFormData.default_target_value) : null
      };

      console.log('DEBUG handleValueSubmit payload:', payload);

      if (editingValue) {
        await api.put(`/kpi-values/${editingValue.id}`, payload);
        showNotification('KPI value updated successfully!', 'success');
      } else {
        await api.post('/kpi-values', payload);
        showNotification('KPI value created successfully!', 'success');
      }

      await loadKpiValues(id);
      setShowValueModal(false);
    } catch (err) {
      console.error('Failed to save KPI value', err);
      showNotification(err.response?.data?.error || 'Failed to save KPI value', 'error');
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

  const handleAddNew = () => {
    setFormData({
      title: '',
      fin_year: kmi.fin_year || '',
      kpi_type: 'Plant KPI',
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

          <div className="kpi-details-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-title">KPI Values</h3>
              <button className="btn-primary" onClick={() => {
                setEditingValue(null);
                setValueFormData({
                  kpi_id: id,
                  data: '',
                  data_operator: '',
                  target_required: true,
                  uom: '',
                  kpi_type: 'manual',
                  piller_id: '',
                  formula: '',
                  source_kpi_value_ids: [],
                  default_target_value: ''
                });
                setFormulaVars([]);
                setVarSelections({});
                setVarSearchQueries({});
                setShowValueModal(true);
              }}>
                <span>+</span> Add Value
              </button>
            </div>

            {kpiValues.length === 0 ? (
              <div className="details-placeholder" style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ fontSize: '16px', color: '#666' }}>No values recorded yet.</p>
                <p className="details-note" style={{ fontSize: '14px', color: '#999' }}>Click "Add Value" to record target and achieved values for this KPI.</p>
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
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Actions</th>
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
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleEditValue(val)}
                              style={{
                                padding: '6px 12px',
                                marginRight: '8px',
                                border: 'none',
                                borderRadius: '4px',
                                background: '#2196f3',
                                color: '#fff',
                                cursor: 'pointer'
                              }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteValue(val.id)}
                              style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '4px',
                                background: '#f44336',
                                color: '#fff',
                                cursor: 'pointer'
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showValueModal && (
            <div className="modal-overlay" onClick={() => setShowValueModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editingValue ? 'Edit KPI Value' : 'Add KPI Value'}</h3>
                  <button className="modal-close" onClick={() => setShowValueModal(false)}>×</button>
                </div>
                <form onSubmit={handleValueSubmit}>
                  <div className="form-group">
                    <label>KPI Type *</label>
                    <select
                      name="kpi_type"
                      value={valueFormData.kpi_type}
                      onChange={handleValueChange}
                      required
                    >
                      <option value="manual">Manual</option>
                      <option value="computed">Computed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Data *</label>
                    <input
                      type="text"
                      name="data"
                      value={valueFormData.data}
                      onChange={handleValueChange}
                      required
                      placeholder="Enter data value"
                    />
                  </div>

                  {valueFormData.kpi_type === 'computed' && (
                    <>
                      <div className="reference-panel">
                        <h4>📋 Available KPI Values (for formula reference)</h4>
                        <div className="reference-table-container">
                          <table className="reference-table">
                            <thead>
                              <tr>
                                <th>Use in Formula</th>
                                <th>KPI Value Name</th>
                                <th>Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {kpiValues
                                .filter(kv => kv.id !== editingValue?.id)
                                .map((kv) => (
                                  <tr key={kv.id}>
                                    <td className="formula-ref">
                                      <code>v{kv.id}</code>
                                    </td>
                                    <td>{kv.data}</td>
                                    <td>
                                      <span className="type-badge">{kv.kpi_type}</span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Formula *</label>
                        <input
                          type="text"
                          name="formula"
                          value={valueFormData.formula || ''}
                          onChange={handleValueChange}
                          required
                          placeholder="e.g., v1*v2+v3 or AVERAGE(v1,v2,v3)"
                          className="formula-input"
                        />
                        {formulaVars.length > 0 && (
                          <div className="formula-var-mapping" style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            <strong>Assign values for:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                              {formulaVars.map((tok) => {
                                const searchQuery = varSearchQueries[tok] || '';
                                const filteredOptions = allowedValuesForYear.filter((kv) => {
                                  if (!searchQuery) return true;
                                  const meta = getKpiMeta(kv.kpi_id);
                                  const label = `v${kv.id} ${kv.data} ${meta.title}`.toLowerCase();
                                  return label.includes(searchQuery.toLowerCase());
                                });
                                const selectedKv = allowedValuesForYear.find(kv => kv.id === varSelections[tok]);
                                const selectedLabel = selectedKv 
                                  ? `v${selectedKv.id} - ${selectedKv.data} (${getKpiMeta(selectedKv.kpi_id).title})`
                                  : '';
                                
                                return (
                                  <div key={tok} style={{ background: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
                                    <label style={{ fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                                      {tok} {selectedLabel && <span style={{ fontWeight: 'normal', color: '#666' }}>→ {selectedLabel}</span>}
                                    </label>
                                    <input
                                      type="text"
                                      list={`datalist-${tok}`}
                                      placeholder={`Type to search or select ${tok}...`}
                                      value={searchQuery}
                                      onChange={(e) => {
                                        setVarSearchQueries((prev) => ({ ...prev, [tok]: e.target.value }));
                                        // Check if typed value matches an option exactly
                                        const match = allowedValuesForYear.find(kv => {
                                          const meta = getKpiMeta(kv.kpi_id);
                                          const label = `v${kv.id} - ${kv.data} (${meta.title})`;
                                          return label === e.target.value;
                                        });
                                        if (match) {
                                          setVarSelections((prev) => ({ ...prev, [tok]: match.id }));
                                        }
                                      }}
                                      onBlur={(e) => {
                                        // On blur, if a selection was made, set the display text
                                        const selectedKv = allowedValuesForYear.find(kv => kv.id === varSelections[tok]);
                                        if (selectedKv) {
                                          const meta = getKpiMeta(selectedKv.kpi_id);
                                          setVarSearchQueries((prev) => ({ 
                                            ...prev, 
                                            [tok]: `v${selectedKv.id} - ${selectedKv.data} (${meta.title})` 
                                          }));
                                        }
                                      }}
                                      onFocus={(e) => {
                                        // Clear search to show all options
                                        setVarSearchQueries((prev) => ({ ...prev, [tok]: '' }));
                                      }}
                                      style={{ 
                                        width: '100%', 
                                        padding: '8px 10px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        background: 'white'
                                      }}
                                    />
                                    <datalist id={`datalist-${tok}`}>
                                      {filteredOptions.map((kv) => {
                                        const meta = getKpiMeta(kv.kpi_id);
                                        return (
                                          <option 
                                            key={kv.id} 
                                            value={`v${kv.id} - ${kv.data} (${meta.title})`}
                                          />
                                        );
                                      })}
                                    </datalist>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ marginTop: '8px', color: '#666' }}>
                              Resolved preview: <code>{resolveFormulaWithSelections(valueFormData.formula)}</code>
                            </div>
                          </div>
                        )}
                        <div className="formula-help">
                          <p><strong>Formula Syntax:</strong></p>
                          <ul>
                            <li><code>v1, v2, v3</code> - Reference other KPI values by ID</li>
                            <li><code>v1 + v2 - v3</code> - Basic arithmetic (+, -, *, /, %)</li>
                            <li><code>AVERAGE(v1, v2, v3)</code> - Calculate average</li>
                            <li><code>SUM(v1, v2, v3)</code> - Calculate sum</li>
                            <li><code>MIN(v1, v2)</code> / <code>MAX(v1, v2)</code> - Min/Max</li>
                            <li><code>ROUND(v1, 2)</code> - Round to decimals</li>
                            <li><code>IF(v1 {'>'} 100, v2, v3)</code> - Conditional logic</li>
                          </ul>
                          <p><strong>Example:</strong> <code>v2*100/v1</code> (Percentage of v2 to v1)</p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Assign Data Operator</label>
                    <select
                      name="data_operator"
                      value={valueFormData.data_operator}
                      onChange={handleValueChange}
                    >
                      <option value="">Select User / Operator</option>
                      {users.length === 0 ? (
                        <option disabled>No users available</option>
                      ) : (
                        users.map((u) => (
                          <option key={u.empid} value={u.empid}>
                            {u.firstname} {u.lastname} ({u.empid})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unit of Measurement</label>
                    <select
                      name="uom"
                      value={valueFormData.uom}
                      onChange={handleValueChange}
                    >
                      <option value="">Select Unit</option>
                      {units.length === 0 ? (
                        <option disabled>No units available</option>
                      ) : (
                        units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Piller</label>
                    <select
                      name="piller_id"
                      value={valueFormData.piller_id}
                      onChange={handleValueChange}
                    >
                      <option value="">Select Piller (Optional)</option>
                      {pillers.length === 0 ? (
                        <option disabled>No pillers available</option>
                      ) : (
                        pillers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.piller_name} ({p.short_name})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <div className="toggle-label-group">
                      <label>Target Required</label>
                      <span className="toggle-value">{valueFormData.target_required ? 'Yes' : 'No'}</span>
                    </div>
                    <button
                      type="button"
                      className={`slider-toggle ${valueFormData.target_required ? 'on' : 'off'}`}
                      onClick={() => setValueFormData((prev) => ({ ...prev, target_required: !prev.target_required }))}
                    >
                      <span className="slider-thumb"></span>
                    </button>
                  </div>
                  {valueFormData.target_required && (
                    <div className="form-group">
                      <label>Default Target Value</label>
                      <input
                        type="number"
                        name="default_target_value"
                        value={valueFormData.default_target_value}
                        onChange={handleValueChange}
                        placeholder="Enter target value (optional)"
                      />
                    </div>
                  )}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowValueModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingValue ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
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
                      {categories.map((c) => (
                        <option key={c.id} value={c.category_name}>
                          {c.category_name}
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
