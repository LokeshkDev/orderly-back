import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { customerLogin } from '../services/api';
import logoImg from '../assets/logo/logo.jpeg';
import { FiMail, FiLock, FiArrowRight, FiShield, FiEye, FiEyeOff, FiCheck, FiChevronLeft } from 'react-icons/fi';
import './AuthPages.css';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      <SEO title="Customer Sign In | ORDERLY Menswear Atelier" />
      
      <div className="auth-master-page">
        <div className="auth-split-container">
          
          {/* LEFT HERO SIDEBAR (Desktop & Tablet Layout) */}
          <div className="auth-hero-sidebar">
            <div className="auth-hero-bg" />
            <div className="auth-hero-vignette" />
            <div className="auth-hero-content">
              <Link to="/" className="auth-hero-logo-link">
                <img src={logoImg} alt="ORDERLY" className="auth-hero-logo" />
              </Link>
              
              <div className="auth-hero-badge">ORDERLY PRIVILEGES</div>
              <h1 className="auth-hero-heading">ELEVATE YOUR DAILY STYLE.</h1>
              <p className="auth-hero-text">
                Access curated luxury menswear, express 1-click checkout, and real-time order tracking.
              </p>

              <div className="auth-benefits-list">
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check"><FiCheck /></span>
                  <span>Priority Access to New Drops & Combos</span>
                </div>
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check"><FiCheck /></span>
                  <span>Instant 1-Click Express Checkout</span>
                </div>
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check"><FiCheck /></span>
                  <span>Live Dispatch & Order Tracking</span>
                </div>
              </div>

              <div className="auth-hero-footer">
                <p className="auth-quote">"Uncompromising quality in every stitch."</p>
                <span className="auth-quote-author">— ORDERLY Menswear Atelier</span>
              </div>
            </div>
          </div>

          {/* RIGHT FORM CONTAINER */}
          <div className="auth-form-panel">
            <div className="auth-form-inner">
              
              {/* Back to Home Link */}
              <div className="auth-top-nav">
                <Link to="/" className="auth-back-link">
                  <FiChevronLeft /> Back to Store
                </Link>
                <div className="auth-brand-mobile-logo d-lg-none">
                  <img src={logoImg} alt="ORDERLY" />
                </div>
              </div>

              {/* Mode Switcher Tabs (Sign In / Register) */}
              <div className="auth-mode-tabs">
                <button type="button" className="auth-mode-tab active">
                  SIGN IN
                </button>
                <Link to="/register" className="auth-mode-tab inactive">
                  CREATE ACCOUNT
                </Link>
              </div>

              {/* Header Titles */}
              <div className="auth-form-header">
                <h2 className="auth-form-title">Welcome Back</h2>
                <p className="auth-form-subtitle">Enter your details to sign in to your ORDERLY account</p>
              </div>

              {error && (
                <div className="auth-alert-error">
                  <FiShield className="me-2" /> {error}
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="auth-main-form">
                
                {/* Email Field */}
                <div className="auth-field-group">
                  <label className="auth-field-label">EMAIL ADDRESS</label>
                  <div className="auth-input-wrapper">
                    <FiMail className="auth-field-icon" />
                    <input 
                      type="email" 
                      className="auth-text-input" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="auth-field-group">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="auth-field-label mb-0">PASSWORD</label>
                    <a href="#forgot" className="auth-forgot-link">Forgot Password?</a>
                  </div>
                  <div className="auth-input-wrapper">
                    <FiLock className="auth-field-icon" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="auth-text-input" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(prev => !prev)}
                      tabIndex="-1"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="auth-options-row">
                  <label className="auth-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="auth-checkbox-input"
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="auth-spinner">Signing in...</span>
                  ) : (
                    <>SIGN IN TO ACCOUNT <FiArrowRight className="ms-2" /></>
                  )}
                </button>

              </form>

              {/* Bottom Footer Note */}
              <div className="auth-form-footer">
                <span className="text-muted">Don't have an account yet? </span>
                <Link to="/register" className="auth-switch-cta">Create Account Now</Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default CustomerLogin;
