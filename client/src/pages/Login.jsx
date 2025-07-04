import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for signup success in query params
  const params = new URLSearchParams(location.search);
  const signupSuccess = params.get('signup') === 'success';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">📝</div>
        <h2 className="auth-title">Welcome Back!</h2>
        <p className="auth-subtitle">Sign in to access your notes</p>
        {signupSuccess && <div style={{ color: '#d4ffd6', marginBottom: '0.5rem' }}>Signup successful! Please sign in.</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="Email address" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
        </form>
        {error && <div style={{ color: '#ffd6d6', marginBottom: '0.5rem' }}>{error}</div>}
        <div style={{ margin: '0.5rem 0 0.5rem 0', textAlign: 'right' }}>
          <a href="/forgot-password" style={{ color: '#a770ef', textDecoration: 'underline', fontSize: 14 }}>
            Forgot password?
          </a>
        </div>
        <div className="auth-switch">
          Don't have an account? <a href="/signup">Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default Login; 