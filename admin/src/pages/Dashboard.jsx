import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiDollarSign, FiPackage, FiAlertTriangle, FiTag, 
  FiPlus, FiEdit2, FiFolderPlus, FiArrowRight, FiShoppingBag, FiCheckCircle, FiClock 
} from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const recentOrders = [
    {
      id: 'ORD-9821',
      customer: 'Rahul Sharma',
      items: 'Essential Cotton Crewneck Tee (M)',
      total: '₹1,499.00',
      status: 'Completed',
      date: '10 mins ago'
    },
    {
      id: 'ORD-9820',
      customer: 'Vikram Malhotra',
      items: 'Structured Linen Resort Shirt (L)',
      total: '₹3,299.00',
      status: 'Processing',
      date: '35 mins ago'
    },
    {
      id: 'ORD-9819',
      customer: 'Arjun Verma',
      items: 'Japanese Selvedge Tapered Denim (32)',
      total: '₹4,499.00',
      status: 'Pending',
      date: '2 hrs ago'
    }
  ];

  return (
    <div className="admin-dashboard-page p-4">
      {/* Top Welcome Title */}
      <div className="dashboard-header mb-4">
        <h1 className="dash-title">Dashboard Overview</h1>
        <p className="dash-sub">Welcome back. Here's what's happening across your store today.</p>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="row g-4 mb-4">
        {/* Total Sales */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="stat-label">TOTAL REVENUE</span>
              <span className="stat-icon-wrapper"><FiDollarSign /></span>
            </div>
            <h2 className="stat-value">₹2,45,800</h2>
            <div className="stat-meta">
              <span className="trend-badge-green">📈 +18.4%</span>
              <span className="meta-text">from last week</span>
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="stat-label">CATALOG PRODUCTS</span>
              <span className="stat-icon-wrapper"><FiPackage /></span>
            </div>
            <h2 className="stat-value">10 Items</h2>
            <div className="stat-meta">
              <span className="trend-badge-green">Across 5 Categories</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card-white alert-border-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="stat-label text-danger">LOW STOCK ALERTS</span>
              <span className="stat-icon-wrapper icon-danger"><FiAlertTriangle /></span>
            </div>
            <h2 className="stat-value">3 Items</h2>
            <div className="stat-meta">
              <button className="restock-link-btn" onClick={() => navigate('/products')}>
                View restock matrix <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        {/* Total Categories */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="stat-label">STORE CATEGORIES</span>
              <span className="stat-icon-wrapper"><FiTag /></span>
            </div>
            <h2 className="stat-value">5 Main</h2>
            <div className="stat-meta">
              <span className="meta-text">Tops, Shirts, Denim, Trousers, Blazers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Recent Orders Table & Quick Actions */}
      <div className="row g-4">
        {/* Recent Orders Table */}
        <div className="col-lg-8">
          <div className="dashboard-section-card">
            <div className="card-header-row d-flex align-items-center justify-content-between mb-3">
              <h3 className="card-section-title mb-0 d-flex align-items-center gap-2">
                <FiShoppingBag className="text-danger" /> Recent Orders
              </h3>
              <button className="btn-view-all" onClick={() => navigate('/orders')}>View All Orders</button>
            </div>

            <div className="table-responsive">
              <table className="admin-matrix-table align-middle">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(ord => (
                    <tr key={ord.id}>
                      <td><code className="cat-slug-badge">{ord.id}</code></td>
                      <td><strong style={{ color: '#0f172a' }}>{ord.customer}</strong></td>
                      <td><span style={{ fontSize: '0.85rem', color: '#475569' }}>{ord.items}</span></td>
                      <td><strong>{ord.total}</strong></td>
                      <td>
                        <span className={`status-badge-pill ${ord.status.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td><span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{ord.date}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-lg-4">
          <div className="dashboard-section-card">
            <h3 className="card-section-title mb-3">Quick Actions</h3>
            <div className="d-flex flex-column gap-3">
              <button 
                className="btn-quick-action"
                onClick={() => navigate('/products/new')}
              >
                <FiPlus /> Add Product
              </button>
              
              <button 
                className="btn-quick-action"
                onClick={() => navigate('/categories')}
              >
                <FiFolderPlus /> Manage Categories & Popups
              </button>

              <button 
                className="btn-quick-action"
                onClick={() => navigate('/products')}
              >
                <FiPackage /> View Inventory Matrix
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
