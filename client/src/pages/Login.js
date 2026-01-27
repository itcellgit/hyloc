import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    empid: '',
    firstname: '',
    middlename: '',
    lastname: '',
    email: '',
    department_id: '',
    phone: '',
    address: '',
    bloodgroup: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;

      if (isLogin) {
        if (!formData.empid || !formData.password) {
          throw new Error('Employee ID and password are required');
        }
        response = await authService.login(formData.empid, formData.password);
      } else {
        if (!formData.empid || !formData.firstname || !formData.lastname || !formData.email || !formData.password || !formData.confirmPassword) {
          throw new Error('empid, first name, last name, email, password, and confirm password are required');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        response = await authService.register({
          empid: formData.empid,
          firstname: formData.firstname,
          middlename: formData.middlename,
          lastname: formData.lastname,
          email: formData.email,
          department_id: formData.department_id,
          phone: formData.phone,
          address: formData.address,
          bloodgroup: formData.bloodgroup,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
      }

      if (response.data.success) {
        authService.setToken(response.data.data.token);
        const user = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Role-based redirect
        const userRoles = user.roles || [];
        const hasAdminRole = userRoles.some(r => r.role_name && r.role_name.toLowerCase() === 'admin');
        const hasEmployeeRole = userRoles.some(r => r.role_name && r.role_name.toLowerCase() === 'employee');
        const hasManagementRole = userRoles.some(r => r.role_name && ['management', 'manager'].includes(r.role_name.toLowerCase()));
        
        if (hasAdminRole) {
          navigate('/dashboard');
        } else if (hasEmployeeRole) {
          navigate('/employee-dashboard');
        } else if (hasManagementRole) {
          navigate('/user-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      } else {
        setError(response.data.error || 'An error occurred');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src="/hyloc-logo.png" alt="Hyloc Logo" className="logo-image" />
        </div>
        <h1>Hyloc Hydrotechnic Pvt Ltd</h1>
        <h2>{isLogin ? 'Login' : 'Register'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="empid"
              value={formData.empid}
              onChange={handleChange}
              placeholder="Enter your employee ID"
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middlename"
                  value={formData.middlename}
                  onChange={handleChange}
                  placeholder="Enter middle name (optional)"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  disabled={loading}
                />
              </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>

              <div className="form-group">
                <label>Department ID</label>
                <input
                  type="text"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  placeholder="Enter department ID"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <input
                  type="text"
                  name="bloodgroup"
                  value={formData.bloodgroup}
                  onChange={handleChange}
                  placeholder="Enter blood group"
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <span
                onClick={() => !loading && setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: loading ? 'default' : 'pointer',
                  fontSize: '20px',
                  userSelect: 'none',
                  opacity: loading ? 0.5 : 1
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-wrapper" style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={loading}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <span
                  onClick={() => !loading && setShowConfirmPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: loading ? 'default' : 'pointer',
                    fontSize: '20px',
                    userSelect: 'none',
                    opacity: loading ? 0.5 : 1
                  }}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="toggle-form">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({
                  empid: '',
                  firstname: '',
                  middlename: '',
                  lastname: '',
                  email: '',
                  department_id: '',
                  phone: '',
                  address: '',
                  bloodgroup: '',
                  password: '',
                  confirmPassword: ''
                });
                setError('');
              }}
              disabled={loading}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;


