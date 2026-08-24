import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiDollarSign, FiPackage, FiAlertTriangle, FiTag, 
  FiPlus, FiEdit2, FiFolderPlus, FiArrowRight, FiShoppingBag, 
  FiCheckCircle, FiClock, FiRefreshCw, FiTrendingUp, FiLayers, FiEye, FiShield
} from 'react-icons/fi';
import api from '../services/api';
import { formatPrice } from '../utils/formatters';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, prodsRes, catsRes] = await Promise.allSettled([
        api.get('/orders'),
        api.get('/products?all=true'),
        api.get('/categories')
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success && Array.isArray(ordersRes.value.data.data)) {
        setOrders(ordersRes.value.data.data);
      } else {
        try {
          const savedOrders = JSON.parse(localStorage.getItem('orderly_admin_orders') || '[]');
          setOrders(savedOrders);
        } catch {}
      }

      if (prodsRes.status === 'fulfilled' && prodsRes.value.data?.success && Array.isArray(prodsRes.value.data.data)) {
        setProducts(prodsRes.value.data.data);
      }

      if (catsRes.status === 'fulfilled' && catsRes.value.data?.success && Array.isArray(catsRes.value.data.data)) {
        setCategories(catsRes.value.data.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute live dashboard KPIs
  const kpis = useMemo(() => {
    const validOrders = orders.filter(o => !['cancelled', 'returned'].includes(String(o.status || '').toLowerCase()));
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0);

    let lowStockCount = 0;
    products.forEach(p => {
      let totalStock = 0;
      if (p.inventory && Object.keys(p.inventory).length > 0) {
        totalStock = Object.values(p.inventory).reduce((s, v) => s + Number(v || 0), 0);
      } else {
        totalStock = Number(p.stock || 0);
      }
      if (totalStock <= 5) lowStockCount += 1;
    });

    return {
      totalRevenue,
      totalOrders: orders.length,
      activeProducts: products.filter(p => String(p.status || '').toLowerCase() === 'active').length,
      lowStockCount,
      categoriesCount: categories.length || 5
    };
  }, [orders, products, categories]);

  // Recent 6 Orders
  const recentOrdersList = useMemo(() => {
    return [...orders].slice(0, 6);
  }, [orders]);

  // Quick Order Status Updater
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      const res = await api.put("/orders/" + orderId, { status: newStatus });
      if (res.data && res.data.success) {
        toast.success("Order " + orderId + " updated to " + newStatus);
        setOrders(prev => prev.map(o => (o.id === orderId || o.order_number === orderId) ? { ...o, status: newStatus } : o));
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="admin-dashboard-page p-4">
      {/* Top Welcome Title */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="dash-title mb-0">Dashboard Overview</h1>
          <p className="dash-sub mb-0 mt-1">
            Live store performance, real-time incoming orders, and inventory status.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn-admin-outline"
            onClick={fetchDashboardData}
            title="Refresh Dashboard"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button 
            type="button" 
            className="btn-admin-primary d-flex align-items-center gap-2"
            onClick={() => navigate('/bi-reports')}
          >
            <FiTrendingUp /> BI Analytics Report
          </button>
        </div>
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
            <h2 className="stat-value">{formatPrice(kpis.totalRevenue)}</h2>
            <div className="stat-meta">
              <span className="trend-badge-green">📈 Live</span>
              <span className="meta-text">{kpis.totalOrders} total orders</span>
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="stat-label">ACTIVE PRODUCTS</span>
              <span className="stat-icon-wrapper"><FiPackage /></span>
            </div>
            <h2 className="stat-value">{kpis.activeProducts} Items</h2>
            <div className="stat-meta">
              <span className="trend-badge-green">Across {kpis.categoriesCount} Categories</span>
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
            <h2 className="stat-value text-danger">{kpis.lowStockCount} Items</h2>
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
            <h2 className="stat-value">{kpis.categoriesCount} Live</h2>
            <div className="stat-meta">
              <span className="meta-text">Active on storefront</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real Live Recent Orders Stream */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="dashboard-section-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold text-dark">Live Recent Customer Orders</h5>
                <span className="status-badge-pill active">Live Stream</span>
              </div>
              <button 
                type="button"
                className="btn-admin-outline py-1 px-2"
                onClick={() => navigate('/orders')}
              >
                View All Orders <FiArrowRight />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5 text-muted">
                <span className="spinner-border spinner-border-sm text-danger me-2" role="status" />
                Loading live store orders...
              </div>
            ) : recentOrdersList.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No recent orders found. Test checkout on website to see real-time orders here!
              </div>
            ) : (
              <div className="admin-table-wrapper rounded border">
                <table className="admin-table w-100">
                  <thead>
                    <tr>
                      <th>ORDER ID</th>
                      <th>CUSTOMER</th>
                      <th>TOTAL (₹)</th>
                      <th>PAYMENT</th>
                      <th>STATUS</th>
                      <th className="text-end">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrdersList.map(order => {
                      const orderId = order.order_number || order.id;
                      const customer = order.customer_name || order.shipping_address?.full_name || 'Customer';
                      const total = Number(order.total_amount || order.total || 0);
                      const payment = order.payment_method || 'Online';
                      const status = order.status || 'Pending';

                      return (
                        <tr key={orderId}>
                          <td>
                            <code className="cat-slug-badge" style={{ cursor: 'pointer' }} onClick={() => navigate("/orders/" + (order.id || orderId))}>
                              {orderId}
                            </code>
                          </td>
                          <td>
                            <strong className="text-dark d-block small">{customer}</strong>
                            <span className="text-muted extra-small">{order.customer_email || order.shipping_address?.city || ''}</span>
                          </td>
                          <td>
                            <strong className="text-danger font-monospace">{formatPrice(total)}</strong>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border extra-small text-uppercase">
                              {payment}
                            </span>
                          </td>
                          <td>
                            <select
                              className="admin-select py-1 px-2"
                              style={{ width: '120px', fontSize: '0.78rem', fontWeight: '700' }}
                              value={status}
                              onChange={(e) => handleQuickStatusChange(order.id || orderId, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn-admin-outline py-1 px-2"
                              onClick={() => navigate("/orders/" + (order.id || orderId))}
                              title="View Order Details"
                            >
                              <FiEye /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Admin Actions & Restock Pulse */}
        <div className="col-12 col-lg-4">
          <div className="dashboard-section-card h-100 d-flex flex-column">
            <h5 className="mb-3 fw-bold text-dark">Quick Shortcuts</h5>
            <div className="d-flex flex-column gap-2 mb-4">
              <button 
                type="button" 
                className="btn-quick-action"
                style={{ height: 'auto', padding: '12px 14px', justifyContent: 'space-between' }}
                onClick={() => navigate('/products')}
              >
                <div className="d-flex align-items-center gap-2 text-start">
                  <FiPlus className="text-danger" size={18} />
                  <div>
                    <strong className="d-block small text-dark">Add / Edit Products</strong>
                    <span className="text-muted extra-small">Manage variants, sizes & matrix</span>
                  </div>
                </div>
                <FiArrowRight className="text-muted" />
              </button>

              <button 
                type="button" 
                className="btn-quick-action"
                style={{ height: 'auto', padding: '12px 14px', justifyContent: 'space-between' }}
                onClick={() => navigate('/homepage-settings')}
              >
                <div className="d-flex align-items-center gap-2 text-start">
                  <FiLayers className="text-primary" size={18} />
                  <div>
                    <strong className="d-block small text-dark">Homepage CMS</strong>
                    <span className="text-muted extra-small">Customize banners & hero slides</span>
                  </div>
                </div>
                <FiArrowRight className="text-muted" />
              </button>

              <button 
                type="button" 
                className="btn-quick-action"
                style={{ height: 'auto', padding: '12px 14px', justifyContent: 'space-between' }}
                onClick={() => navigate('/admin-users')}
              >
                <div className="d-flex align-items-center gap-2 text-start">
                  <FiShield className="text-success" size={18} />
                  <div>
                    <strong className="d-block small text-dark">Team & Role Permissions</strong>
                    <span className="text-muted extra-small">Manage staff accounts & passwords</span>
                  </div>
                </div>
                <FiArrowRight className="text-muted" />
              </button>
            </div>

            <div className="mt-auto p-3 bg-light rounded border text-muted extra-small">
              🔒 <strong>Role Guard Active:</strong> Your admin workspace restricts navigation access based on your assigned staff role.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
