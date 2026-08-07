import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiChevronDown, FiUser, FiLogOut, FiShoppingBag, FiCheckCircle, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './TopHeader.css';

const TopHeader = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem('orderly_admin_notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        setNotifications([
          {
            id: 1,
            orderNumber: 'ORD-89421',
            customerName: 'Vikram Malhotra',
            total: 5499,
            createdAt: '10 mins ago',
            read: false
          }
        ]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadNotifications();

    const handleNewOrder = () => {
      loadNotifications();
      toast.info('⚡ New Live Customer Order Received!', {
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
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem('orderly_admin_notifications', JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <header className="admin-top-header">
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

      {/* Right Header Actions */}
      <div className="header-right-actions d-flex align-items-center gap-3">
        {/* Notification Bell */}
        <div className="position-relative">
          <button 
            className="header-icon-btn notification-btn position-relative" 
            title="Live Order Notifications"
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
                <strong className="text-dark d-flex align-items-center gap-2">
                  <FiShoppingBag className="text-danger" /> Live Order Alerts ({unreadCount})
                </strong>
                {unreadCount > 0 && (
                  <button type="button" className="notif-mark-read-btn" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`notif-item p-2 mb-2 rounded ${!n.read ? 'bg-light border-start border-3 border-danger' : ''}`}
                      onClick={() => { setShowNotifMenu(false); navigate('/orders'); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="text-dark small">{n.orderNumber}</strong>
                        <span className="text-muted extra-small">{n.createdAt}</span>
                      </div>
                      <div className="text-muted extra-small">{n.customerName} placed an order</div>
                      <div className="text-danger fw-bold extra-small">₹{Number(n.total || 0).toLocaleString()}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-muted extra-small">No new order alerts</div>
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

        {/* Admin Profile Dropdown */}
        <div className="admin-user-dropdown-wrapper">
          <button 
            className="user-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="avatar-circle">
              <FiUser />
            </div>
            <span className="user-name-text">{admin?.name || 'Super Admin'}</span>
            <FiChevronDown className="chevron-icon" />
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-user-header">
                <strong>{admin?.name || 'Super Admin'}</strong>
                <span className="text-muted small">admin@orderly.com</span>
              </div>
              <hr className="my-1 border-secondary" />
              <button className="dropdown-item text-danger" onClick={logout}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
