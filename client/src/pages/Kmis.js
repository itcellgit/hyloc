import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import axios from 'axios';
import '../styles/Kmis.css';

// Determine API URL based on environment
let API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  if (hostname === 'hyloc.git.edu') {
    // Production: nginx proxies /api to backend
    API_BASE_URL = `${protocol}//${hostname}/api`;
  } else {
    // Development or Intranet: direct to port 5000
    API_BASE_URL = `${protocol}//${hostname}:5000/api`;
  }
}

// Helper function to get current financial year
const getInitialYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const endYear = fyStartYear + 1;
  return `${fyStartYear}-${endYear.toString().slice(-2)}`;
};

function Kmis() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [kpiTree, setKpiTree] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(getInitialYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKmi, setEditingKmi] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    fin_year: '',
    category_id: '',
    parent_kpi_id: null,
    department_id: null,
    emp_id: null
  });
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showReplicateModal, setShowReplicateModal] = useState(false);
  const [replicateFromYear, setReplicateFromYear] = useState('');
  const [replicateToYear, setReplicateToYear] = useState('');
  const [previousYearKpis, setPreviousYearKpis] = useState([]);
  const [previousYearTree, setPreviousYearTree] = useState([]);
  const [selectedKpisToReplicate, setSelectedKpisToReplicate] = useState(new Set());
  const [replicateLoading, setReplicateLoading] = useState(false);
  const [replicateExpandedNodes, setReplicateExpandedNodes] = useState(new Set());
  const dropdownRef = useRef(null);
  const replicationInProgressRef = useRef(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/', roles: ['Admin'] },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments', roles: ['Admin'] },
    { id: 3, label: 'Users', icon: '👥', path: '/users', roles: ['Admin'] },
    { id: 4, label: 'KMIs', icon: '📈', path: '/kmis', roles: ['Admin'] },
    { id: 6, label: 'Pillers', icon: '🏛️', path: '/pillers', roles: ['Admin'] },
    { id: 5, label: 'Roles', icon: '🎭', path: '/roles', roles: ['Admin'] },
    { id: 7, label: 'User Roles', icon: '🔐', path: '/user-roles', roles: ['Admin'] },
  ];

  useEffect(() => {
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

  // Generate financial years on component mount
  useEffect(() => {
    const { years } = generateFinancialYears();
    setFinancialYears(years);
  }, []);

  // Fetch categories, departments, and employees
  useEffect(() => {
    const loadCategoriesAndDepartments = async () => {
      try {
        const [categoriesRes, departmentsRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/categories`),
          axios.get(`${API_BASE_URL}/departments`),
          axios.get(`${API_BASE_URL}/users`)
        ]);
        setCategories(categoriesRes.data.data || []);
        const depts = departmentsRes.data.data || [];
        console.log('Departments loaded:', depts);
        setDepartments(depts);
        const emps = usersRes.data.data || [];
        console.log('Employees loaded:', emps);
        setEmployees(emps);
      } catch (err) {
        console.error('Failed to load categories, departments or employees', err);
        setError('Failed to load data');
      }
    };

    loadCategoriesAndDepartments();
  }, []);

  // Ensure form picks a sensible default category when categories load
  useEffect(() => {
    if (categories.length === 0) return;
    const defaultId = getDefaultCategoryId(categories);
    setFormData((prev) => ({
      ...prev,
      category_id: prev.category_id || defaultId,
    }));
  }, [categories]);

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

    // Get the category ID for "KMI / GLOBAL OBJECTIVES"
    const globalObjectivesCategoryId = categories.find((c) => c.category_name === 'KMI / GLOBAL OBJECTIVES')?.id;

    // If categories aren't loaded yet, fall back to all top-level KMIs
    const roots = Array.from(map.values())
      .filter((node) => !node.parent_kpi_id && (!globalObjectivesCategoryId || node.category_id === globalObjectivesCategoryId))
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
      showNotification(errorMsg, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch KPIs when selected year changes
  useEffect(() => {
    loadKpis(selectedYear);
  }, [selectedYear]);

  const categoryOrder = useMemo(() => [6, 1, 2, 3, 4, 5], []);

  const generateFinancialYears = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Determine current financial year (April - March)
    // If current month is April (3) or later, FY starts this year
    // Otherwise, FY started last year
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const currentFinYear = `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`;

    const years = [];
    // Previous 2 years
    for (let i = 2; i >= 1; i--) {
      const start = fyStartYear - i;
      const end = start + 1;
      years.push(`${start}-${end.toString().slice(-2)}`);
    }
    // Current year
    years.push(currentFinYear);
    // Next 1 year
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

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  const getDefaultCategoryId = (cats) => (
    cats.find((c) => c.category_name === 'KMI / GLOBAL OBJECTIVES')?.id ||
    cats[0]?.id ||
    ''
  );

  const getCategoryName = (categoryId) => (
    categories.find((c) => c.id === categoryId)?.category_name || ''
  );

  const getNextCategoryId = (parentCategoryId) => {
    if (!parentCategoryId) return getDefaultCategoryId(categories);
    const idx = categoryOrder.indexOf(parentCategoryId);
    if (idx === -1) return getDefaultCategoryId(categories);
    const nextIdx = Math.min(idx + 1, categoryOrder.length - 1);
    return categoryOrder[nextIdx];
  };

  const handleAddNew = () => {
    setEditingKmi(null);
    setFormData({ 
      title: '',
      fin_year: selectedYear,
      category_id: getDefaultCategoryId(categories), // This will be "KMI / GLOBAL OBJECTIVES" category
      parent_kpi_id: null,
      department_id: null,
      emp_id: null
    });
    setShowModal(true);
  };

  const handleOpenReplicateModal = async () => {
    const previousYears = financialYears.filter(year => {
      // Extract start year from format "YYYY-YY"
      const yearNum = parseInt(year.split('-')[0]);
      const selectedYearNum = parseInt(selectedYear.split('-')[0]);
      return yearNum < selectedYearNum;
    });
    if (previousYears.length === 0) {
      showNotification('No previous financial years available to replicate from', 'error');
      return;
    }
    
    // Check if current year already has KMIs
    const existingKmis = kpis.filter(k => k.fin_year === selectedYear);
    if (existingKmis.length > 0) {
      const confirmReplicate = window.confirm(
        `⚠️ Warning: ${existingKmis.length} KMI(s) already exist for ${selectedYear}.\n\n` +
        `Replicating will ADD new KMIs without removing existing ones.\n\n` +
        `For best results, delete all existing ${selectedYear} KMIs first, then replicate.\n\n` +
        `Do you want to continue anyway?`
      );
      if (!confirmReplicate) {
        return;
      }
    }
    
    // Get the most recent previous year
    setReplicateFromYear(previousYears[previousYears.length - 1]);
    await loadPreviousYearKpis(previousYears[previousYears.length - 1]);
    setReplicateToYear(selectedYear); // Default to current selected year
    setShowReplicateModal(true);
    setSelectedKpisToReplicate(new Set());
    setReplicateExpandedNodes(new Set());
  };

  const loadPreviousYearKpis = async (year) => {
    try {
      setReplicateLoading(true);
      const response = await axios.get(`${API_BASE_URL}/kpis`);
      const data = response.data.data || [];
      const filtered = data.filter(kpi => kpi.fin_year === year);
      const tree = buildTree(filtered, year);
      setPreviousYearKpis(filtered);
      setPreviousYearTree(tree);
    } catch (err) {
      showNotification('Failed to load previous year KMIs', 'error');
      console.error(err);
    } finally {
      setReplicateLoading(false);
    }
  };

  const handleEdit = (kmi) => {
    setEditingKmi(kmi);
    setFormData({
      title: kmi.title || '',
      fin_year: kmi.fin_year || selectedYear,
      category_id: kmi.category_id || getDefaultCategoryId(categories),
      parent_kpi_id: kmi.parent_kpi_id || null,
      department_id: kmi.department_id || null,
      emp_id: kmi.emp_id || null
    });
    setShowModal(true);
  };

  const handleAddChild = (parent) => {
    setEditingKmi(null);
    setFormData({
      title: '',
      fin_year: parent.fin_year || selectedYear,
      category_id: getNextCategoryId(parent.category_id),
      parent_kpi_id: parent.id,
      department_id: null,
      emp_id: null
    });
    setShowModal(true);
    setExpandedNodes((prev) => new Set(prev).add(parent.id));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this KMI?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/kpis/${id}`);
      showNotification('KMI deleted successfully!', 'success');
      loadKpis(selectedYear);
    } catch (err) {
      const errorMsg = 'Failed to delete :KMI ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleView = (kmi) => {
    navigate(`/kmis/${kmi.id}`, { state: { kmi } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let kpiId;
      
      if (editingKmi) {
        await axios.put(`${API_BASE_URL}/kpis/${editingKmi.id}`, {
          title: formData.title,
          fin_year: formData.fin_year,
          category_id: formData.category_id,
          parent_kpi_id: formData.parent_kpi_id
        });
        kpiId = editingKmi.id;
        showNotification('KPI updated successfully!', 'success');
      } else {
        const response = await axios.post(`${API_BASE_URL}/kpis`, {
          title: formData.title,
          fin_year: formData.fin_year,
          category_id: formData.category_id,
          parent_kpi_id: formData.parent_kpi_id
        });
        kpiId = response.data.data.id;
        showNotification('KMI created successfully!', 'success');
      }

      // Save KPI-Department mapping if Department KPI category is selected (category_id = 2)
      if (formData.category_id === 2 || formData.category_id === '2') {
        if (formData.department_id) {
          try {
            await axios.post(`${API_BASE_URL}/kpi-departments`, {
              kpi_id: kpiId,
              department_id: formData.department_id
            });
          } catch (err) {
            console.error('Failed to save KPI-Department mapping:', err);
            showNotification('KPI saved but failed to map department', 'error');
          }
        } else {
          showNotification('Please select a department for Department KPI', 'error');
          return;
        }
      }

      // Save KPI-Employee mapping if Employee KPI category is selected (category_id = 4)
      if (formData.category_id === 4 || formData.category_id === '4') {
        if (formData.emp_id) {
          try {
            await axios.post(`${API_BASE_URL}/kpi-employees`, {
              kpi_id: kpiId,
              emp_id: formData.emp_id
            });
          } catch (err) {
            console.error('Failed to save KPI-Employee mapping:', err);
            showNotification('KPI saved but failed to map employee', 'error');
          }
        } else {
          showNotification('Please select an employee for Employee KPI', 'error');
          return;
        }
      }

      setShowModal(false);
      loadKpis(selectedYear);
    } catch (err) {
      const errorMsg = 'Failed to save KMI: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const getCategoryNameById = (id) => categories.find((c) => c.id === id)?.category_name || 'Category';

  // Function to check if a node or its children match the search query
  const isNodeMatching = (node) => {
    if (node.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true;
    }
    if (node.children && node.children.length > 0) {
      return node.children.some(child => isNodeMatching(child));
    }
    return false;
  };

  // Filter tree based on search query
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

  // Auto-expand nodes when search is active
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
            <button className="btn-ghost" type="button" onClick={() => handleAddChild(node)}>➕</button>
            <button className="btn-ghost" type="button" onClick={() => handleEdit(node)}>✏️</button>
            <button className="btn-ghost danger" type="button" onClick={() => handleDelete(node.id)}>🗑️</button>
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

  const toggleReplicateNodeExpand = (id) => {
    setReplicateExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleReplicateNodeSelection = (id, allDescendants = []) => {
    setSelectedKpisToReplicate((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Deselect all descendants
        allDescendants.forEach(descId => next.delete(descId));
      } else {
        next.add(id);
        // Also select all descendants
        allDescendants.forEach(descId => next.add(descId));
      }
      return next;
    });
  };

  const getNodeAndDescendants = (node) => {
    const ids = [node.id];
    const collectIds = (n) => {
      if (n.children && n.children.length > 0) {
        n.children.forEach(child => {
          ids.push(child.id);
          collectIds(child);
        });
      }
    };
    collectIds(node);
    return ids;
  };

  const renderReplicateNode = (node, depth = 0) => {
    const isExpanded = replicateExpandedNodes.has(node.id);
    const hasChildren = (node.children || []).length > 0;
    const isSelected = selectedKpisToReplicate.has(node.id);
    const allDescendants = getNodeAndDescendants(node).slice(1);

    return (
      <div key={node.id} className="replicate-kpi-node" style={{ marginLeft: depth * 16 }}>
        <div className="replicate-kpi-node-header">
          <div className="replicate-node-left">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleReplicateNodeSelection(node.id, allDescendants)}
              className="node-checkbox"
            />
            <button
              className={`accordion-toggle ${hasChildren ? '' : 'empty'}`}
              onClick={() => hasChildren && toggleReplicateNodeExpand(node.id)}
              type="button"
            >
              {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
            </button>
          </div>
          <div className="replicate-kpi-node-body">
            <div className="kpi-node-title">{node.title}</div>
            <div className="kpi-node-meta">
              <span className="badge">{getCategoryNameById(node.category_id)}</span>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="replicate-kpi-children">
            {node.children.map((child) => renderReplicateNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleReplicateKmis = async () => {
    // Prevent duplicate replication
    if (replicationInProgressRef.current) {
      showNotification('Replication is already in progress. Please wait...', 'warning');
      return;
    }

    if (!replicateToYear) {
      showNotification('Please select a target financial year to replicate to', 'error');
      return;
    }

    if (selectedKpisToReplicate.size === 0) {
      showNotification('Please select at least one KMI to replicate', 'error');
      return;
    }

    // Mark replication as in progress
    replicationInProgressRef.current = true;

    // Close modal immediately and show loading notification
    setShowReplicateModal(false);
    showNotification(`🔄 Replicating ${selectedKpisToReplicate.size} KMI(s)... Please wait`, 'info');

    try {
      setReplicateLoading(true);
      
      // Map old KPI IDs to new KPI IDs for parent reference updates
      const idMapping = {};
      const kpiValueMapping = {}; // Map old KPI value IDs to new KPI value IDs
      const newKpiIds = [];
      
      // Ensure all parent KPIs are included in selection
      const ensureParentsIncluded = (kpiId, kpiList, included = new Set()) => {
        if (included.has(kpiId)) return;
        const kpi = kpiList.find(k => k.id === kpiId);
        if (!kpi) return;
        
        included.add(kpiId);
        if (kpi.parent_kpi_id) {
          ensureParentsIncluded(kpi.parent_kpi_id, kpiList, included);
        }
      };
      
      // Build complete set of KPIs to replicate (including all parents)
      const completeKpiSet = new Set(selectedKpisToReplicate);
      selectedKpisToReplicate.forEach(kpiId => {
        ensureParentsIncluded(kpiId, previousYearKpis, completeKpiSet);
      });
      
      // Calculate depth for each KPI to ensure proper sorting
      const calculateDepth = (kpiId, kpiList, memo = {}) => {
        if (memo[kpiId] !== undefined) return memo[kpiId];
        const kpi = kpiList.find(k => k.id === kpiId);
        if (!kpi || !kpi.parent_kpi_id) {
          memo[kpiId] = 0;
          return 0;
        }
        const depth = 1 + calculateDepth(kpi.parent_kpi_id, kpiList, memo);
        memo[kpiId] = depth;
        return depth;
      };
      
      const depthMemo = {};
      
      // Fetch all KPI values from previous year at once (more efficient than per-KPI requests)
      let allPreviousYearKpiValues = [];
      try {
        const allValuesRes = await axios.get(`${API_BASE_URL}/kpi-values`);
        const allValues = allValuesRes.data.data || [];
        // Filter to only values from previous year KPIs
        const previousYearKpiIds = new Set(previousYearKpis.map(k => k.id));
        allPreviousYearKpiValues = allValues.filter(v => previousYearKpiIds.has(v.kpi_id));
        console.log(`Fetched ${allPreviousYearKpiValues.length} total KPI value(s) from previous year`);
      } catch (err) {
        console.error('Failed to fetch previous year KPI values:', err);
        // Continue anyway, just won't have KPI values
      }
      
      // Sort KPIs by depth (top-level first) to ensure parents are created before children at all levels
      const sortedKpis = previousYearKpis
        .filter(kpi => completeKpiSet.has(kpi.id))
        .map(kpi => ({
          ...kpi,
          depth: calculateDepth(kpi.id, previousYearKpis, depthMemo)
        }))
        .sort((a, b) => a.depth - b.depth);

      console.log('=== REPLICATION DEBUG ===');
      console.log(`Total KPIs to replicate: ${sortedKpis.length}`);
      console.log('KPIs sorted by depth:', sortedKpis.map(k => `${k.title} (ID:${k.id}, Parent:${k.parent_kpi_id || 'none'}, Depth:${k.depth})`));

      for (const kpi of sortedKpis) {
        // Determine new parent_kpi_id using the mapping
        let newParentId = null;
        if (kpi.parent_kpi_id) {
          newParentId = idMapping[kpi.parent_kpi_id];
          if (!newParentId) {
            console.error(`❌ FATAL: Parent KPI ${kpi.parent_kpi_id} not found in mapping for KPI ${kpi.id} (${kpi.title})`);
            console.error('Available mappings:', idMapping);
            throw new Error(`Parent KPI not created before child. This should not happen.`);
          }
        }

        console.log(`Creating: "${kpi.title}" (oldID:${kpi.id}) with parent ${newParentId || 'NONE'}`);

        const response = await axios.post(`${API_BASE_URL}/kpis`, {
          title: kpi.title,
          fin_year: replicateToYear,
          category_id: kpi.category_id,
          parent_kpi_id: newParentId
        });

        const newKpiId = response.data.data.id;
        idMapping[kpi.id] = newKpiId;
        newKpiIds.push(newKpiId);
        
        console.log(`✅ Created: "${kpi.title}" newID:${newKpiId}, parent:${newParentId || 'NONE'}`);

        // Replicate KPI values for this KPI
        try {
          // Get all KPI values for this old KPI from the pre-fetched list
          const oldKpiValues = allPreviousYearKpiValues.filter(v => v.kpi_id === kpi.id);
          
          if (oldKpiValues.length > 0) {
            console.log(`Found ${oldKpiValues.length} KPI value(s) for old KPI ${kpi.id} (${kpi.title})`);

            for (const kpiValue of oldKpiValues) {
              // Create new KPI value without formula references first
              const newValuePayload = {
                data: kpiValue.data,
                kpi_id: newKpiId,
                data_operator: kpiValue.data_operator || null,
                target_required: kpiValue.target_required !== undefined ? kpiValue.target_required : true,
                uom: kpiValue.uom || null,
                kpi_type: kpiValue.kpi_type || 'manual',
                piller_id: kpiValue.piller_id || null,
                default_target_value: kpiValue.default_target_value || null,
                computation_type: kpiValue.computation_type || null,
                // Formula references will be updated in second pass
                formula: kpiValue.formula || null,
                source_kpi_value_ids: null,
                target_formula: kpiValue.target_formula || null,
                target_source_kpi_value_ids: null
              };

              const newValueRes = await axios.post(`${API_BASE_URL}/kpi-values`, newValuePayload);
              const newKpiValueId = newValueRes.data.data.id;
              kpiValueMapping[kpiValue.id] = newKpiValueId;
              
              console.log(`✅ Replicated KPI value for "${kpi.title}": ${kpiValue.data} (oldID:${kpiValue.id} -> newID:${newKpiValueId})`);
            }
          } else {
            console.log(`ℹ️  No KPI values found for old KPI ${kpi.id} (${kpi.title})`);
          }
        } catch (err) {
          console.error(`Failed to replicate KPI values for KPI ${kpi.id} (${kpi.title}):`, err);
        }

        // Replicate department mapping if exists
        if (kpi.category_id === 2 || kpi.category_id === '2') {
          try {
            const deptRes = await axios.get(`${API_BASE_URL}/kpi-departments?kpi_id=${kpi.id}`);
            const deptMappings = deptRes.data.data || [];
            for (const mapping of deptMappings) {
              // Check if mapping already exists
              const existingRes = await axios.get(`${API_BASE_URL}/kpi-departments?kpi_id=${newKpiId}&department_id=${mapping.department_id}`);
              const existing = existingRes.data.data || [];
              
              if (existing.length === 0) {
                await axios.post(`${API_BASE_URL}/kpi-departments`, {
                  kpi_id: newKpiId,
                  department_id: mapping.department_id
                });
              }
            }
          } catch (err) {
            console.error('Failed to replicate department mapping:', err);
          }
        }

        // Replicate employee mapping if exists
        if (kpi.category_id === 4 || kpi.category_id === '4') {
          try {
            const empRes = await axios.get(`${API_BASE_URL}/kpi-employees?kpi_id=${kpi.id}`);
            const empMappings = empRes.data.data || [];
            for (const mapping of empMappings) {
              // Check if mapping already exists
              const existingRes = await axios.get(`${API_BASE_URL}/kpi-employees?kpi_id=${newKpiId}&emp_id=${mapping.emp_id}`);
              const existing = existingRes.data.data || [];
              
              if (existing.length === 0) {
                await axios.post(`${API_BASE_URL}/kpi-employees`, {
                  kpi_id: newKpiId,
                  emp_id: mapping.emp_id
                });
              }
            }
          } catch (err) {
            console.error('Failed to replicate employee mapping:', err);
          }
        }
      }

      // Second pass: Update formula references in KPI values using the mapping
      console.log('=== UPDATING FORMULA REFERENCES ===');
      try {
        const allNewKpiValues = await axios.get(`${API_BASE_URL}/kpi-values`);
        const newKpiValuesList = allNewKpiValues.data.data || [];
        
        for (const newKpiId of newKpiIds) {
          const kpiNewValues = newKpiValuesList.filter(kv => kv.kpi_id === newKpiId);
          
          for (const kpiValue of kpiNewValues) {
            let needsUpdate = false;
            let updatedSourceIds = kpiValue.source_kpi_value_ids;
            let updatedTargetSourceIds = kpiValue.target_source_kpi_value_ids;

            // Update source_kpi_value_ids if they reference old value IDs
            if (kpiValue.source_kpi_value_ids && Array.isArray(kpiValue.source_kpi_value_ids)) {
              updatedSourceIds = kpiValue.source_kpi_value_ids.map(oldId => 
                kpiValueMapping[oldId] || oldId
              );
              if (JSON.stringify(updatedSourceIds) !== JSON.stringify(kpiValue.source_kpi_value_ids)) {
                needsUpdate = true;
              }
            }

            // Update target_source_kpi_value_ids if they reference old value IDs
            if (kpiValue.target_source_kpi_value_ids && Array.isArray(kpiValue.target_source_kpi_value_ids)) {
              updatedTargetSourceIds = kpiValue.target_source_kpi_value_ids.map(oldId => 
                kpiValueMapping[oldId] || oldId
              );
              if (JSON.stringify(updatedTargetSourceIds) !== JSON.stringify(kpiValue.target_source_kpi_value_ids)) {
                needsUpdate = true;
              }
            }

            if (needsUpdate) {
              await axios.put(`${API_BASE_URL}/kpi-values/${kpiValue.id}`, {
                source_kpi_value_ids: updatedSourceIds,
                target_source_kpi_value_ids: updatedTargetSourceIds
              });
              console.log(`✅ Updated formula references for KPI value ${kpiValue.id}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to update formula references:', err);
      }

      // Reload KPIs to show new data
      const response = await axios.get(`${API_BASE_URL}/kpis`);
      const allKpis = response.data.data || [];
      const yearFilteredKpis = allKpis.filter(k => k.fin_year === replicateToYear);
      const tree = buildTree(allKpis, selectedYear);
      setKpis(allKpis);
      setKpiTree(tree);
      setError('');
      
      // Clear search to show all new KMIs
      setSearchQuery('');
      
      // Auto-expand all replicated nodes to show full hierarchy
      const newExpandedSet = new Set();
      
      // Expand all newly created KMIs that have children
      newKpiIds.forEach(newId => {
        const hasChildren = yearFilteredKpis.some(k => k.parent_kpi_id === newId);
        if (hasChildren) {
          newExpandedSet.add(newId);
        }
      });
      
      setExpandedNodes(newExpandedSet);

      showNotification(`✅ Successfully replicated ${selectedKpisToReplicate.size} KMI(s)! Reloading page...`, 'success');
      
      // Reset flag and reload page after 1 second to ensure all data is synchronized
      setTimeout(() => {
        replicationInProgressRef.current = false;
        window.location.reload();
      }, 1000);
    } catch (err) {
      const errorMsg = 'Failed to replicate KMIs: ' + (err.response?.data?.error || err.message);
      showNotification(errorMsg, 'error');
      console.error(err);
      // Reset flag and reopen modal to allow retry
      replicationInProgressRef.current = false;
      setShowReplicateModal(true);
    } finally {
      setReplicateLoading(false);
    }
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
              <button className="notification-close" onClick={() => setNotification({ show: false, message: '', type: '' })}>×</button>
            </div>
          )}

          <div className="page-header">
            <div className="heading-section">
              <h2>Key Management Indicators (KMIs)</h2>
              <div className="header-buttons">
                <button className="btn-primary" onClick={handleAddNew}>
                  <span>+</span> Add KMI
                </button>
                <button className="btn-secondary" onClick={handleOpenReplicateModal}>
                  <span>📋</span> Replicate from Previous Year
                </button>
              </div>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingKmi ? 'Edit KMI' : 'Add New KMI'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Financial Year *</label>
                <select
                  name="fin_year"
                  value={formData.fin_year}
                  onChange={handleChange}
                  required
                  className="fin-year-select"
                >
                  <option value="">Select Financial Year</option>
                  {financialYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="fin-year-select"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>
              {(formData.category_id === 2 || formData.category_id === '2') && (
                <div className="form-group">
                  <label>Department * <span style={{ color: '#ff6b6b' }}>(Required for Department KPI)</span></label>
                  <select
                    name="department_id"
                    value={formData.department_id || ''}
                    onChange={handleChange}
                    required
                    className="fin-year-select"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name || dept.department_name}</option>
                    ))}
                  </select>
                </div>
              )}
              {(formData.category_id === 4 || formData.category_id === '4') && (
                <div className="form-group">
                  <label>Employee * <span style={{ color: '#ff6b6b' }}>(Required for Employee KPI)</span></label>
                  <select
                    name="emp_id"
                    value={formData.emp_id || ''}
                    onChange={handleChange}
                    required
                    className="fin-year-select"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.firstname} {emp.lastname} ({emp.empid})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Parent KPI</label>
                <select
                  name="parent_kpi_id"
                  value={formData.parent_kpi_id || ''}
                  onChange={handleChange}
                  className="fin-year-select"
                >
                  <option value="">None (Top-level KPI)</option>
                  {kpis
                    .filter((k) => 
                      k.fin_year === formData.fin_year && 
                      k.id !== editingKmi?.id
                    )
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((k) => (
                      <option key={k.id} value={k.id}>{k.title}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>KMI Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter KMI title"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingKmi ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReplicateModal && (
        <div className="modal-overlay" onClick={() => setShowReplicateModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Replicate KMIs from Previous Year</h3>
              <button className="modal-close" onClick={() => setShowReplicateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {replicateLoading ? (
                <div className="loading">Loading KMIs from {replicateFromYear}...</div>
              ) : (
                <>
                  <div className="replicate-config">
                    <div className="replicate-config-row">
                      <div className="replicate-config-item">
                        <label>Replicate From:</label>
                        <input 
                          type="text" 
                          value={replicateFromYear} 
                          disabled 
                          className="config-input-disabled"
                        />
                      </div>
                      <div className="replicate-config-item">
                        <label>Replicate To:</label>
                        <select 
                          value={replicateToYear} 
                          onChange={(e) => setReplicateToYear(e.target.value)}
                          className="config-select"
                        >
                          <option value="">-- Select Target Financial Year --</option>
                          {financialYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="replicate-info">
                    <p>Select KMIs from <strong>{replicateFromYear}</strong> to replicate into <strong>{replicateToYear || 'a year'}</strong></p>
                    <p className="info-text">✓ Selecting a parent KMI will automatically select all its child KMIs</p>
                    <p className="info-text">✓ Only KMI structure will be copied (with KPI values)</p>
                    <p className="info-text">✓ Department and Employee mappings will be replicated as well</p>
                    <p className="info-text">✓ Duplicates will be skipped if they already exist</p>
                  </div>
                  
                  {previousYearTree.length === 0 ? (
                    <div className="no-data">No KMIs available in {replicateFromYear}</div>
                  ) : (
                    <div className="replicate-tree-container">
                      {previousYearTree.map((node) => renderReplicateNode(node))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-actions">
              <div className="selection-summary">
                {selectedKpisToReplicate.size > 0 && (
                  <span>{selectedKpisToReplicate.size} KMI(s) selected</span>
                )}
              </div>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowReplicateModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleReplicateKmis}
                disabled={selectedKpisToReplicate.size === 0 || !replicateToYear || replicateLoading}
              >
                Replicate Selected KMIs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kmis;
