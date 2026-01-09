import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Unauthorized.css';

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <p className="unauthorized-subtitle">Please contact your administrator if you believe this is an error.</p>
        <div className="unauthorized-actions">
          <button className="btn-primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
