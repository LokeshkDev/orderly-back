import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiBell, FiChevronDown, FiUser, FiLogOut, FiShoppingBag, 
  FiCheckCircle, FiX, FiMenu, FiSidebar, FiLock, FiShield, FiAlertTriangle, FiTrendingUp
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatters';
import { canAccessRoute } from '../../utils/rbac';
import { toast } from 'react-toastify';
import api from '../../services/api';
import ChangePasswordModal from '../common/ChangePasswordModal';
import './TopHeader.css';

const TopHeader = ({ isSidebarCollapsed, onToggleSidebar, onToggleMobileSidebar }) => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Generate dynamic real-time notifications from real DB orders & stock alerts
  const loadDynamicNotifications = async () => {
    try {
      const [ordersRes, prodsRes] = await Promise.allSettled([
        api.get('/orders'),
        api.get('/products?all=true')
      ]);

      const notifs = [];

      // 1. Orders notifications
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success && Array.isArray(ordersRes.value.data.data)) {
        const recentOrders = ordersRes.value.data.data.slice(0, 4);
        recentOrders.forEach(o => {
          notifs.push({
            id: `order-${o.id || o.order_number}`,
            type: 'order',
            title: `New Order: ${o.order_number || o.id}`,
            message: `${o.customer_name || 'Customer'} placed order for ${formatPrice(o.total_amount || o.total || 0)}`,
            link: `/orders/${o.id || o.order_number}`,
            time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            read: false
          });
        });
      }

      // 2. Low Stock Alerts
      if (prodsRes.status === 'fulfilled' && prodsRes.value.data?.success && Array.isArray(prodsRes.value.data.data)) {
        const lowStockProds = prodsRes.value.data.data.filter(p => {
          let totalStock = 0;
          if (p.inventory && Object.keys(p.inventory).length > 0) {
            totalStock = Object.values(p.inventory).reduce((s, v) => s + Number(v || 0), 0);
          } else {
            totalStock = Number(p.stock || 0);
          }
          return totalStock <= 3;
        }).slice(0, 3);

        lowStockProds.forEach(p => {
          notifs.push({
            id: `stock-${p.id}`,
            type: 'stock',
            title: `Low Stock Alert: ${p.name}`,
            message: 'Inventory is critically low. Restock variant matrix immediately.',
            link: '/products',
            time: 'Alert',
            read: false
          });
        });
      }

      setNotifications(notifs);
    } catch (e) {
      console.warn('Notification load error:', e.message);
    }
  };

  useEffect(() => {
    loadDynamicNotifications();

    const handleNewOrder = () => {
      loadDynamicNotifications();
      toast.info('⚡ New Live Customer Order Placed!', {
        position: 'top-right',
        autoClose: 5000
      });
    };

    window.addEventListener('orderly_new_order_placed', handleNewOrder);
    window.addEventListener('storage', handleNewOrder);
    return () => {
      window.removeEventListener('orderly_new_order_placed', handleNewOrder);
      window.removeEventListener('storage', handleNewOrder);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleToggleClick = () => {
    if (window.innerWidth < 992) {
      onToggleMobileSidebar();
    } else {
      onToggleSidebar();
    }
  };

  return (
    <header className="admin-top-header">
      {/* Left Header: Single Toggle Sidebar Button + Search */}
      <div className="d-flex align-items-center gap-3">
        <button 
          type="button" 
          className="sidebar-toggle-btn"
          onClick={handleToggleClick}
          title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          aria-label="Toggle Sidebar"
        >
          <FiMenu />
        </button>

        {/* Search Input Box */}
        <div className="header-search-container">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search orders, products..."
            className="header-search-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/orders?search=${e.target.value}`);
            }}
          />
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="header-right-actions d-flex align-items-center gap-3">
        {/* Notification Bell */}
        <div className="position-relative">
          <button 
            className="header-icon-btn notification-btn position-relative" 
            title="Live Order & Stock Notifications"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="notification-badge-count">{unreadCount}</span>
            )}
          </button>

          {showNotifMenu && (
            <div className="admin-notif-dropdown-menu shadow-lg p-3 rounded-3">
              <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-2">
                <strong className="text-dark small">Store Notifications ({notifications.length})</strong>
                {unreadCount > 0 && (
                  <button 
                    type="button" 
                    className="btn p-0 border-0 text-danger extra-small fw-semibold"
                    onClick={markAllAsRead}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="notif-list-scroll" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-muted extra-small">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`notif-item p-2 rounded mb-1 d-flex gap-2 ${notif.read ? 'opacity-75' : 'bg-light'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setShowNotifMenu(false);
                        navigate(notif.link);
                      }}
                    >
                      <div className="notif-icon-box mt-1">
                        {notif.type === 'stock' ? (
                          <FiAlertTriangle className="text-danger" size={16} />
                        ) : (
                          <FiShoppingBag className="text-success" size={16} />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-baseline">
                          <strong className="text-dark extra-small">{notif.title}</strong>
                          <span className="text-muted" style={{ fontSize: '0.65rem' }}>{notif.time}</span>
                        </div>
                        <p className="mb-0 text-muted extra-small">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-top pt-2 mt-1 text-center">
                <button 
                  type="button" 
                  className="notif-view-all-btn"
                  onClick={() => { setShowNotifMenu(false); navigate('/orders'); }}
                >
                  View All Orders in Admin Panel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="position-relative">
          <button 
            className="header-profile-btn d-flex align-items-center gap-2"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="admin-avatar-circle">
              <FiUser />
            </div>
            <div className="d-none d-sm-flex flex-column text-start">
              <span className="profile-name">{admin?.name || 'Super Admin'}</span>
              <span className="profile-role text-capitalize">{admin?.role || 'Administrator'}</span>
            </div>
            <FiChevronDown className="dropdown-arrow" />
          </button>

          {showProfileMenu && (
            <div className="admin-profile-dropdown-menu shadow-lg p-2 rounded-3">
              <div className="px-3 py-2 border-bottom mb-1">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <strong className="text-dark d-block small">{admin?.name || 'Super Admin'}</strong>
                  <span className="badge bg-danger text-uppercase extra-small" style={{ fontSize: '0.65rem' }}>
                    {admin?.role || 'Admin'}
                  </span>
                </div>
                <span className="text-muted extra-small">{admin?.email || 'admin@orderly.com'}</span>
              </div>
              <button 
                type="button" 
                className="admin-dropdown-item w-100 text-start d-flex align-items-center gap-2"
                onClick={() => { setShowProfileMenu(false); setShowChangePassword(true); }}
              >
                <FiLock /> Change Password
              </button>
              {canAccessRoute(admin?.role, '/admin-users') && (
                <button 
                  type="button" 
                  className="admin-dropdown-item w-100 text-start d-flex align-items-center gap-2"
                  onClick={() => { setShowProfileMenu(false); navigate('/admin-users'); }}
                >
                  <FiShield /> Team & Roles
                </button>
              )}
              {canAccessRoute(admin?.role, '/bi-reports') && (
                <button 
                  type="button" 
                  className="admin-dropdown-item w-100 text-start d-flex align-items-center gap-2"
                  onClick={() => { setShowProfileMenu(false); navigate('/bi-reports'); }}
                >
                  <FiTrendingUp /> BI Reports
                </button>
              )}
              {canAccessRoute(admin?.role, '/settings') && (
                <button 
                  type="button" 
                  className="admin-dropdown-item w-100 text-start d-flex align-items-center gap-2"
                  onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                >
                  <FiUser /> Account Settings
                </button>
              )}
              <div className="border-top my-1" />
              <button 
                type="button" 
                className="admin-dropdown-item w-100 text-start text-danger d-flex align-items-center gap-2"
                onClick={() => { setShowProfileMenu(false); logout(); }}
              >
                <FiLogOut /> Logout Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </header>
  );
};

export default TopHeader;
