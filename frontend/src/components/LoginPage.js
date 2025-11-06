import React, { useState } from 'react';
import { Users, Shield } from 'lucide-react';
import { authAPI } from '../services/api';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [userType, setUserType] = useState('admin');
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(
        credentials.email,
        credentials.password,
        userType
      );

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userType', response.data.userType);

      // Call onLogin with user data
      onLogin(response.data.userType, response.data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Rest of your login page JSX stays the same */}
      <div className="login-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">AP</div>
            <h1>Akshar Paaul</h1>
            <p>AksharSetu - Volunteer Management Portal</p>
          </div>

          <div className="user-type-selector">
            <button
              className={`type-btn ${userType === 'admin' ? 'active' : ''}`}
              onClick={() => setUserType('admin')}
            >
              <Shield size={24} />
              <span>Admin Login</span>
            </button>
            <button
              className={`type-btn ${userType === 'volunteer' ? 'active' : ''}`}
              onClick={() => setUserType('volunteer')}
            >
              <Users size={24} />
              <span>Volunteer Login</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login as {userType === 'admin' ? 'Admin' : 'Volunteer'}</span>
              )}
            </button>
          </form>

          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            <div className="demo-info">
              <div>
                <strong>Admin:</strong> admin@akshar.com / admin123
              </div>
              <div>
                <strong>Volunteer:</strong> Use any volunteer's email / same as email
              </div>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>© 2024 Akshar Paaul. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;