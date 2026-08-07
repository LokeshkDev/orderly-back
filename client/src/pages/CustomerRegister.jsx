import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { customerRegister } from '../services/api';
import logoImg from '../assets/logo/logo.jpeg';
import { FiUser, FiMail, FiLock, FiPhone, FiArrowRight } from 'react-icons/fi';
import './AuthPages.css';

const CustomerRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

    const res = await customerRegister({ name, email, phone, password });
    setLoading(false);

    if (res && res.success) {
      const token = res.token || `token-${Date.now()}`;
      const customerRecord = res.customer || res.data || { name, email, phone };
      localStorage.setItem('orderly_customer_token', token);
      localStorage.setItem('orderly_logged_in_user', JSON.stringify(customerRecord));
      window.dispatchEvent(new CustomEvent('orderly_auth_changed'));
      toast.success(`Welcome to ORDERLY, ${name}!`);
      navigate(redirectTarget);
    } else {
      setError(res?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      <SEO title="Create Account | ORDERLY Menswear Atelier" />
      <div className="auth-page-wrapper register-dark-bg py-5">
        <div className="auth-card glass-panel auth-card-dark fade-in-up">
          <div className="auth-header text-center mb-4">
            <Link to="/">
              <img src={logoImg} alt="ORDERLY Mens Wear" className="auth-brand-logo mb-2" />
            </Link>
            <h3 className="auth-title text-white fw-bold mt-2 mb-1">Create Account</h3>
            <p className="auth-subtitle text-muted">Join ORDERLY Privileges to unlock express checkout & tracking</p>
          </div>

          {error && <div className="auth-alert alert-danger mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group mb-3">
              <label className="form-label text-muted small fw-bold mb-1">FULL NAME *</label>
              <div className="input-group-custom">
                <FiUser className="input-icon" />
                <input 
                  type="text" 
                  className="auth-input dark-input" 
                  placeholder="e.g. Lokesh Sharma" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label text-muted small fw-bold mb-1">EMAIL ADDRESS *</label>
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

            <div className="form-group mb-3">
              <label className="form-label text-muted small fw-bold mb-1">PHONE NUMBER *</label>
              <div className="input-group-custom">
                <FiPhone className="input-icon" />
                <input 
                  type="tel" 
                  className="auth-input dark-input" 
                  placeholder="+91 98765 43210" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label text-muted small fw-bold mb-1">PASSWORD *</label>
              <div className="input-group-custom">
                <FiLock className="input-icon" />
                <input 
                  type="password" 
                  className="auth-input dark-input" 
                  placeholder="Minimum 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-orderly w-100 py-3 mb-3 fw-bold" disabled={loading}>
              {loading ? 'Creating Account...' : <>Create Account <FiArrowRight className="ms-1" /></>}
            </button>
          </form>

          <div className="auth-footer text-center mt-3 pt-3 border-top border-secondary">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="auth-switch-link text-warning fw-bold ms-1">Sign In</Link>
          </div>

          <div className="text-center mt-3">
            <Link to="/" className="back-home-link text-muted extra-small">← Return to Storefront</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerRegister;
