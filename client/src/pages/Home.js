import React, { useState } from 'react';
import '../styles/Home.css';

function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 1, label: 'Dashboard', icon: '📊' },
    { id: 2, label: 'Departments', icon: '🏢' },
    { id: 3, label: 'Users', icon: '👥' },
    { id: 4, label: 'KMIs', icon: '📈' },
    { id: 7, label: 'Pillers', icon: '🏛️' },
    { id: 5, label: "KPI's", icon: '🎯' },
    { id: 6, label: "KAI's", icon: '🔑' },
  ];

  return (
    <div className="home-layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="header-title">Hyloc</h1>
          <div className="header-actions">
            <span className="user-info">Vilas Patil</span>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <a key={item.id} href="#" className="nav-item">
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`content ${sidebarOpen ? 'expanded' : 'full'}`}>
          <h1>Welcome to Hyloc</h1>
          <p>React + Node.js + PostgreSQL Application</p>
          <div className="features">
            <div className="feature">
              <h3>React Frontend</h3>
              <p>Modern UI with routing and API integration</p>
            </div>
            <div className="feature">
              <h3>Express Backend</h3>
              <p>RESTful API with MVC architecture</p>
            </div>
            <div className="feature">
              <h3>PostgreSQL</h3>
              <p>Reliable database management</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
