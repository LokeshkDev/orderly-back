const fs = require('fs');
const path = require('path');

const baseDir = "c:/Users/Lokesh/Desktop/E-commerce/orderly/admin/src/pages";
const files = {};

// 1. Login.jsx & Login.css
files["Login.jsx"] = `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/login', { email, password });
      if (res.data.success) {
        toast.success('Login successful');
        navigate('/');
      } else {
        setError(res.data.message || 'Login failed');
        toast.error(res.data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      toast.error('Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Mock Google Login call
      const res = await api.post('/admin/google-login');
      if (res.data.success) {
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
        <p className="brand-subtitle">Admin Panel</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
`;

files["Login.css"] = `.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #0F1117;
  color: #F1F5F9;
}
.login-card {
  background-color: #1A1D27;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(255,255,255,0.08);
}
.brand-title {
  text-align: center;
  color: #C1121F;
  margin-bottom: 0.5rem;
}
.brand-subtitle {
  text-align: center;
  color: #94A3B8;
  margin-bottom: 2rem;
}
.input-group {
  margin-bottom: 1rem;
}
.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #94A3B8;
}
.input-group input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  background-color: #0F1117;
  border: 1px solid rgba(255,255,255,0.08);
  color: #F1F5F9;
}
.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #C1121F;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.btn-google {
  width: 100%;
  padding: 0.75rem;
  background-color: transparent;
  color: #F1F5F9;
  border: 1px solid #F1F5F9;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.divider {
  text-align: center;
  margin: 1.5rem 0;
  color: #94A3B8;
}
.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
`;

// 2. Dashboard.jsx & Dashboard.css
files["Dashboard.jsx"] = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, totalProducts: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.data.stats);
        setRecentOrders(res.data.data.recentOrders);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total', render: (val) => \`₹\${val}\` },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'date', label: 'Date' }
  ];

  return (
    <div className="dashboard-page">
      <div className="header-actions">
        <h2>Dashboard</h2>
        <div className="quick-actions">
          <button className="btn-primary" onClick={() => navigate('/products/new')}>Add Product</button>
          <button className="btn-secondary" onClick={() => navigate('/orders')}>View Orders</button>
          <button className="btn-secondary" onClick={() => navigate('/combos/new')}>Add Combo</button>
        </div>
      </div>
      
      <div className="stats-grid">
        <StatsCard title="Total Orders" value={stats.totalOrders} />
        <StatsCard title="Revenue" value={\`₹\${stats.revenue}\`} />
        <StatsCard title="Total Products" value={stats.totalProducts} />
        <StatsCard title="Pending Orders" value={stats.pendingOrders} />
      </div>

      <div className="recent-orders">
        <h3>Recent Orders</h3>
        <DataTable columns={columns} data={recentOrders} loading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;
`;

files["Dashboard.css"] = `.dashboard-page {
  padding: 1.5rem;
  color: #F1F5F9;
}
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.quick-actions {
  display: flex;
  gap: 1rem;
}
.btn-primary {
  padding: 0.5rem 1rem;
  background-color: #C1121F;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-secondary {
  padding: 0.5rem 1rem;
  background-color: #1A1D27;
  color: #F1F5F9;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  cursor: pointer;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.recent-orders {
  background-color: #1A1D27;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
}
`;

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log("Generated part 1");
