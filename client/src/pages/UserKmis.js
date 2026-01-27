import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import axios from 'axios';
import '../styles/Kmis.css';

const API_BASE_URL = 'http://localhost:5000/api';

const getInitialYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const endYear = fyStartYear + 1;
  return `${fyStartYear}-${endYear.toString().slice(-2)}`;
};

function UserKmis() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [kpiTree, setKpiTree] = useState([]);
  const [categories, setCategories] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(getInitialYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
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
    const { years } = generateFinancialYears();
    setFinancialYears(years);
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesRes = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(categoriesRes.data.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    loadCategories();
  }, []);

  const buildTree = (list, year) => {
    const filtered = year ? list.filter((kpi) => kpi.fin_year === year) : list;
    const map = new Map();
    filtered.forEach((kpi) => {
      map.set(kpi.id, { ...kpi, children: [] });
    });

    map.forEach((node) => {
      if (node.parent_kpi_id && map.has(node.parent_kpi_id)) {
        map.get(node.parent_kpi_id).children.push(node);
      }
    });

    const roots = Array.from(map.values())
      .filter((node) => !node.parent_kpi_id)
      .sort((a, b) => a.title.localeCompare(b.title));

    const sortChildren = (node) => {
      node.children.sort((a, b) => a.title.localeCompare(b.title));
      node.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);
    return roots;
  };

  const loadKpis = async (year = selectedYear) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/kpis`);
      const data = response.data.data || [];
      const tree = buildTree(data, year);
      setKpis(data);
      setKpiTree(tree);
      setExpandedNodes(new Set());
      setError('');
    } catch (err) {
      const errorMsg = 'Failed to load KMIs';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpis(selectedYear);
  }, [selectedYear]);

  const generateFinancialYears = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const currentFinYear = `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`;

    const years = [];
    for (let i = 2; i >= 1; i--) {
      const start = fyStartYear - i;
      const end = start + 1;
      years.push(`${start}-${end.toString().slice(-2)}`);
    }
    years.push(currentFinYear);
    const nextStart = fyStartYear + 1;
    const nextEnd = nextStart + 1;
    years.push(`${nextStart}-${nextEnd.toString().slice(-2)}`);

    return { years, currentFinYear };
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

  const getCategoryNameById = (id) => categories.find((c) => c.id === id)?.category_name || 'Category';

  const handleView = (kmi) => {
    navigate(`/user-kmis/${kmi.id}`, { state: { kmi } });
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

  const getFilteredTree = () => {
    if (!searchQuery.trim()) {
      return kpiTree;
    }

    const filterNode = (node) => {
      const matchesQuery = node.title.toLowerCase().includes(searchQuery.toLowerCase());
      const children = node.children || [];
      const filteredChildren = children
        .map(child => filterNode(child))
        .filter(child => child !== null);

      if (matchesQuery || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }
      return null;
    };

    return kpiTree
      .map(node => filterNode(node))
      .filter(node => node !== null);
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const nodesToExpand = new Set();
      const collectNodeIds = (node) => {
        nodesToExpand.add(node.id);
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => collectNodeIds(child));
        }
      };
      getFilteredTree().forEach(node => collectNodeIds(node));
      setExpandedNodes(nodesToExpand);
    }
  }, [searchQuery]);

  const renderNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = (node.children || []).length > 0;
    return (
      <div key={node.id} className="kpi-node" style={{ marginLeft: depth * 16 }}>
        <div className="kpi-node-header">
          <button
            className={`accordion-toggle ${hasChildren ? '' : 'empty'}`}
            onClick={() => hasChildren && toggleExpand(node.id)}
            aria-label={hasChildren ? 'Toggle children' : 'No children'}
            type="button"
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
          </button>
          <div className="kpi-node-body">
            <div className="kpi-node-title">{node.title}</div>
            <div className="kpi-node-meta">
              <span className="badge">{getCategoryNameById(node.category_id)}</span>
              {node.fin_year && <span className="pill">FY {node.fin_year}</span>}
            </div>
          </div>
          <div className="kpi-node-actions">
            <button className="btn-ghost" type="button" onClick={() => handleView(node)}>👁️</button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="kpi-children">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="kmis-layout">
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
          <div className="page-header">
            <div className="heading-section">
              <h2>Key Management Indicators (KMIs)</h2>
            </div>
          </div>

          <div className="filters-block">
            <div className="filters-group">
              <div className="year-filter">
                <label htmlFor="financial-year">Financial Year:</label>
                <select
                  id="financial-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="year-dropdown"
                >
                  {financialYears.length === 0 ? (
                    <option value="">No financial years available</option>
                  ) : (
                    financialYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="search-filter">
                <label htmlFor="search-kmi">Search KMI:</label>
                <input
                  id="search-kmi"
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

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading KMIs...</div>
          ) : (
            <div className="tree-container">
              {kpiTree.length === 0 ? (
                <div className="no-data">No KPIs found for the selected year</div>
              ) : getFilteredTree().length === 0 ? (
                <div className="no-data">No KPIs match your search: <strong>"{searchQuery}"</strong></div>
              ) : (
                getFilteredTree().map((node) => renderNode(node))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default UserKmis;
