import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, FiTag, FiPackage, FiLayers, FiShoppingCart, FiSettings, FiSliders, FiCalendar, FiUsers, FiTruck 
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: <FiGrid />, label: 'Dashboard', exact: true },
    { path: '/homepage-settings', icon: <FiSliders />, label: 'Homepage CMS', exact: false },
    { path: '/categories', icon: <FiTag />, label: 'Categories', exact: false },
    { path: '/products', icon: <FiPackage />, label: 'Products', exact: false },
    { path: '/combos', icon: <FiLayers />, label: 'Combos', exact: false },
    { path: '/orders', icon: <FiShoppingCart />, label: 'Orders', exact: false },
    { path: '/settings/delivery', icon: <FiTruck />, label: 'Delivery Settings', exact: false },
    { path: '/coupons', icon: <FiTag />, label: 'Promo Coupons', exact: false },
    { path: '/customers', icon: <FiUsers />, label: 'Customers', exact: false },
  ];

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <h1 className="brand-title">Ordersly</h1>
        <span className="brand-sub">Admin Panel</span>
      </div>

      {/* Main Nav Items */}
      <div className="sidebar-nav-container">
        <ul className="sidebar-menu-list">
          {navItems.map((item, idx) => (
            <li key={idx}>
              <NavLink 
                to={item.path} 
                end={item.exact}
                className={({ isActive }) => `sidebar-menu-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">{item.icon}</span>
                <span className="link-text">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Settings at Bottom */}
      <div className="sidebar-footer">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-menu-link ${isActive ? 'active' : ''}`}
        >
          <span className="link-icon"><FiSettings /></span>
          <span className="link-text">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
