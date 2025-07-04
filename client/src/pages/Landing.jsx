import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="landing-hero-bg">
      <div className="landing-hero-content">
        <div className="landing-hero-icon">✨</div>
        <h1 className="landing-hero-title">Notes App</h1>
        <p className="landing-hero-subtitle">Your beautiful, colorful note-taking companion</p>
        <button className="landing-hero-btn" onClick={() => navigate('/login')}>Get Started</button>
      </div>
    </div>
  );
};

export default Landing; 