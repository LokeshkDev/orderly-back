import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      if (res && res.success) {
        toast.success('Login successful! Welcome back.');
        navigate('/');
      } else {
        const msg = res?.message || 'Invalid credentials';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setError('Invalid email or password');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await googleLogin();
      if (res && res.success) {
        toast.success('Google Login successful');
        navigate('/');
      }
    } catch (err) {
      toast.error('Google Login error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="brand-title">ORDERLY</h1>
        <p className="brand-subtitle">Admin Panel CMS</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@orderly.com" 
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="divider">or</div>
        <button onClick={handleGoogleLogin} className="btn-google">
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
