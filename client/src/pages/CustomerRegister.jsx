import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { customerRegister } from '../services/api';
import logoImg from '../assets/logo/logo.jpeg';
import { FiUser, FiMail, FiLock, FiPhone, FiArrowRight, FiShield, FiEye, FiEyeOff, FiCheck, FiChevronLeft } from 'react-icons/fi';
import './AuthPages.css';

const CustomerRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please accept the Terms of Service to create an account.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await customerRegister({ name, email, phone, password });
    setLoading(false);

    if (res && res.success) {
      const token = res.token || `token-${Date.now()}`;
      const customerRecord = res.customer || res.data || { name, email, phone };
      localStorage.setItem('orderly_customer_token', token);
      localStorage.setItem('orderly_logged_in_user', JSON.stringify(customerRecord));
      window.dispatchEvent(new CustomEvent('orderly_auth_changed'));
      navigate(redirectTarget);
    } else {
      setError(res?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      <SEO title="Create Account | ORDERLY Menswear Atelier" />

      <div className="auth-master-page">
        <div className="auth-split-container">
          
          {/* LEFT HERO SIDEBAR (Desktop & Tablet Layout) */}
          <div className="auth-hero-sidebar register-hero">
            <div className="auth-hero-bg register-bg" />
            <div className="auth-hero-vignette" />
            <div className="auth-hero-content">
              <Link to="/" className="auth-hero-logo-link">
                <img src={logoImg} alt="ORDERLY" className="auth-hero-logo" />
              </Link>
              
              <div className="auth-hero-badge">JOIN THE CLUB</div>
              <h1 className="auth-hero-heading">UNLOCK EXCLUSIVE PRIVILEGES.</h1>
              <p className="auth-hero-text">
                Create your ORDERLY account to experience bespoke menswear shopping with VIP benefits.
              </p>

              <div className="auth-benefits-list">
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check"><FiCheck /></span>
                  <span>₹500 Welcome Voucher on First Order</span>
                </div>
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check"><FiCheck /></span>
                  <span>Instant Order Status & Tracking</span>
                </div>
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check"><FiCheck /></span>
                  <span>Easy 7-Day Hassle-Free Returns</span>
                </div>
              </div>

              <div className="auth-hero-footer">
                <p className="auth-quote">"Modern elegance meets master craftsmanship."</p>
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
                <Link to="/login" className="auth-mode-tab inactive">
                  SIGN IN
                </Link>
                <button type="button" className="auth-mode-tab active">
                  CREATE ACCOUNT
                </button>
              </div>

              {/* Header Titles */}
              <div className="auth-form-header">
                <h2 className="auth-form-title">Create Account</h2>
                <p className="auth-form-subtitle">Fill in your details below to set up your ORDERLY account</p>
              </div>

              {error && (
                <div className="auth-alert-error">
                  <FiShield className="me-2" /> {error}
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="auth-main-form">
                
                {/* Full Name */}
                <div className="auth-field-group">
                  <label className="auth-field-label">FULL NAME *</label>
                  <div className="auth-input-wrapper">
                    <FiUser className="auth-field-icon" />
                    <input 
                      type="text" 
                      className="auth-text-input" 
                      placeholder="e.g. Lokesh Sharma" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="auth-field-group">
                  <label className="auth-field-label">EMAIL ADDRESS *</label>
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

                {/* Phone Number */}
                <div className="auth-field-group">
                  <label className="auth-field-label">PHONE NUMBER *</label>
                  <div className="auth-input-wrapper">
                    <FiPhone className="auth-field-icon" />
                    <input 
                      type="tel" 
                      className="auth-text-input" 
                      placeholder="+91 98765 43210" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="auth-field-group">
                  <label className="auth-field-label">PASSWORD *</label>
                  <div className="auth-input-wrapper">
                    <FiLock className="auth-field-icon" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="auth-text-input" 
                      placeholder="Minimum 6 characters" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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

                {/* Terms Agreement */}
                <div className="auth-options-row">
                  <label className="auth-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="auth-checkbox-input"
                    />
                    <span>I agree to ORDERLY <a href="#terms" className="text-danger">Terms & Privacy Policy</a></span>
                  </label>
                </div>

                {/* Submit Button */}
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="auth-spinner">Creating Account...</span>
                  ) : (
                    <>CREATE ACCOUNT NOW <FiArrowRight className="ms-2" /></>
                  )}
                </button>

              </form>

              {/* Bottom Footer Note */}
              <div className="auth-form-footer">
                <span className="text-muted">Already have an account? </span>
                <Link to="/login" className="auth-switch-cta">Sign In Here</Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default CustomerRegister;
