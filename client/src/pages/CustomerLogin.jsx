import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { customerLogin } from '../services/api';
import logoImg from '../assets/logo/logo.jpeg';
import { FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';
import './AuthPages.css';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await customerLogin({ email, password });
    setLoading(false);

    if (res && res.success) {
      navigate(redirectTarget);
    } else {
      setError(res?.message || 'Invalid credentials. Please check your email and password.');
    }
  };

  return (
    <>
      <SEO title="Customer Login | ORDERLY Menswear Atelier" />
      <div className="auth-page-wrapper login-bg-overlay">
        <div className="auth-card glass-panel auth-card-dark fade-in-up">
          <div className="auth-header text-center mb-4">
            <Link to="/">
              <img src={logoImg} alt="ORDERLY Mens Wear" className="auth-brand-logo mb-2" />
            </Link>
            <h3 className="auth-title text-white fw-bold mt-2 mb-1">Welcome Back</h3>
            <p className="auth-subtitle text-muted">Sign in to your ORDERLY account to manage orders & express checkout</p>
          </div>

          {error && <div className="auth-alert alert-danger mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group mb-3">
              <label className="form-label text-muted small fw-bold">EMAIL ADDRESS</label>
              <div className="input-group-custom">
                <FiMail className="input-icon" />
                <input 
                  type="email" 
                  className="auth-input dark-input" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-muted small fw-bold mb-0">PASSWORD</label>
                <a href="#forgot" className="forgot-link text-danger">Forgot?</a>
              </div>
              <div className="input-group-custom">
                <FiLock className="input-icon" />
                <input 
                  type="password" 
                  className="auth-input dark-input" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-orderly w-100 py-3 mb-3 fw-bold" disabled={loading}>
              {loading ? 'Signing in...' : <>Sign In To Account <FiArrowRight className="ms-1" /></>}
            </button>
          </form>

          <div className="auth-footer text-center mt-3 pt-3 border-top border-secondary">
            <span className="text-muted small">Don't have an account? </span>
            <Link to="/register" className="auth-switch-link text-warning fw-bold ms-1">Create Account</Link>
          </div>

          <div className="text-center mt-4">
            <Link to="/" className="back-home-link text-muted extra-small">← Return to Storefront</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerLogin;
