import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Auth.css';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/signup', { email, password });
      navigate('/login?signup=success');
    } catch (err) {
      setError(err.response?.data || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">📝</div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join us to start taking notes</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" className="auth-input" value={name} onChange={e => setName(e.target.value)} required />
          <input type="email" placeholder="Email address" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        {error && <div style={{ color: '#ffd6d6', marginBottom: '0.5rem' }}>{error}</div>}
        <div className="auth-switch">
          Already have an account? <a href="/login">Sign in</a>
        </div>
      </div>
    </div>
  );
};

export default Signup; 