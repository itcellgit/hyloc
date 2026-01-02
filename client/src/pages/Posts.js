import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/api';
import { authService } from '../services/auth';
import '../styles/Posts.css';

function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setUserInfo(user);
    }
    fetchPosts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getAll();
      setPosts(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (userInfo?.firstname && userInfo?.lastname) {
      return `${userInfo.firstname} ${userInfo.lastname}`;
    }
    return userInfo?.email || 'User';
  };

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/' },
    { id: 2, label: 'Departments', icon: '🏢', path: '/departments' },
    { id: 3, label: 'Users', icon: '👥', path: '/users' },
    { id: 4, label: 'Posts', icon: '📝', path: '/posts' },
    { id: 5, label: 'KMIs', icon: '📈', path: '/kmis' },
    { id: 6, label: "KPI's", icon: '🎯', path: '#' },
    { id: 7, label: "KAI's", icon: '⭐', path: '#' },
  ];

  return (
    <div className="posts-layout">
      <header className="header">
        <div className="header-logo-section">
          <img src="/hyloc-logo.png" alt="Hyloc Logo" className="header-logo" />
          <h1 className="header-title">Hyloc Hydro technic Pvt Ltd</h1>
        </div>
        <div className="user-profile" ref={dropdownRef}>
          <button className="profile-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span>👤</span> <span>{getUserDisplayName()}</span>
          </button>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <a href="#profile" className="dropdown-item">👤 View Profile</a>
              <a href="#settings" className="dropdown-item">⚙️ Settings</a>
              <hr className="dropdown-divider" />
              <button className="dropdown-item logout-btn" onClick={handleLogout}>🚪 Logout</button>
            </div>
          )}
        </div>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
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

        <div className="content">
          <div className="content-header">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h2>Posts</h2>
          </div>

          {loading && <div className="loading">Loading posts...</div>}
          {error && <div className="error-message">Error: {error}</div>}

          {!loading && !error && (
            <div className="posts-list">
              {posts.length === 0 ? (
                <p className="no-data">No posts found</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="post-card">
                    <h3>{post.title}</h3>
                    <p>{post.content}</p>
                    <div className="post-meta">
                      <small>User ID: {post.user_id}</small>
                      <small className="post-date">Created: {new Date(post.created_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Posts;
