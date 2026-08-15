import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, FiTag, FiPackage, FiLayers, FiShoppingCart, FiSettings, 
  FiSliders, FiCalendar, FiUsers, FiTruck, FiChevronLeft, FiChevronRight, FiX
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, isMobileOpen, onToggleCollapse, onCloseMobile }) => {
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
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <div className="sidebar-brand-info">
          {!isCollapsed ? (
            <>
              <h1 className="brand-title">
                Orders<span className="text-danger">ly</span>
              </h1>
              <span className="brand-sub">Admin Panel</span>
            </>
          ) : (
            <div className="brand-collapsed-logo" title="Ordersly Admin Panel">
              <span>O</span>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button on Sidebar Header (Desktop) */}
        <button
          type="button"
          className="sidebar-collapse-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        {/* Mobile Close Button (Mobile Only) */}
        <button
          type="button"
          className="sidebar-mobile-close-btn"
          onClick={onCloseMobile}
          aria-label="Close Mobile Menu"
        >
          <FiX />
        </button>
      </div>

      {/* Main Nav Items */}
      <div className="sidebar-nav-container">
        <ul className="sidebar-menu-list">
          {navItems.map((item, idx) => (
            <li key={idx}>
              <NavLink 
                to={item.path} 
                end={item.exact}
                onClick={onCloseMobile}
                className={({ isActive }) => `sidebar-menu-link ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="link-icon">{item.icon}</span>
                {!isCollapsed && <span className="link-text">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Settings at Bottom */}
      <div className="sidebar-footer">
        <NavLink 
          to="/settings" 
          onClick={onCloseMobile}
          className={({ isActive }) => `sidebar-menu-link ${isActive ? 'active' : ''}`}
          title={isCollapsed ? "Settings" : undefined}
        >
          <span className="link-icon"><FiSettings /></span>
          {!isCollapsed && <span className="link-text">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
