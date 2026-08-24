import logoImg from '../../assets/logo/logo.png';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, FiTag, FiPackage, FiLayers, FiShoppingCart, FiSettings, 
  FiSliders, FiCalendar, FiUsers, FiTruck, FiChevronLeft, FiChevronRight, 
  FiX, FiShield, FiTrendingUp 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoute, getRoleConfig } from '../../utils/rbac';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, isMobileOpen, onToggleCollapse, onCloseMobile }) => {
  const { admin } = useAuth();
  const roleConfig = getRoleConfig(admin?.role);

  const rawNavItems = [
    { path: '/', icon: <FiGrid />, label: 'Dashboard', exact: true },
    { path: '/bi-reports', icon: <FiTrendingUp />, label: 'BI & Analytics', exact: false },
    { path: '/homepage-settings', icon: <FiSliders />, label: 'Homepage CMS', exact: false },
    { path: '/categories', icon: <FiTag />, label: 'Categories', exact: false },
    { path: '/products', icon: <FiPackage />, label: 'Products', exact: false },
    { path: '/combos', icon: <FiLayers />, label: 'Combos', exact: false },
    { path: '/orders', icon: <FiShoppingCart />, label: 'Orders', exact: false },
    { path: '/settings/delivery', icon: <FiTruck />, label: 'Delivery Settings', exact: false },
    { path: '/coupons', icon: <FiTag />, label: 'Promo Coupons', exact: false },
    { path: '/customers', icon: <FiUsers />, label: 'Customers', exact: false },
    { path: '/admin-users', icon: <FiShield />, label: 'Admin Users & Roles', exact: false },
  ];

  // Dynamically filter nav items according to logged-in user's role permissions
  const navItems = rawNavItems.filter(item => canAccessRoute(admin?.role, item.path));

  return (
    <aside className={"admin-sidebar" + (isCollapsed ? " collapsed" : "") + (isMobileOpen ? " mobile-open" : "")}>
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <div className="sidebar-brand-info">
          {!isCollapsed ? (
            <div className="sidebar-brand-expanded">
              <NavLink to="/" className="sidebar-brand-link d-inline-block">
                <img src={logoImg} alt="ORDERLY" className="sidebar-brand-logo-img" />
              </NavLink>
              <div className="d-flex align-items-center gap-1 mt-1">
                <span className="brand-sub">Admin Panel</span>
                <span 
                  className="badge rounded-pill extra-small px-2 py-0"
                  style={{ 
                    background: roleConfig.bg, 
                    color: roleConfig.color, 
                    border: "1px solid " + roleConfig.color + "40",
                    fontSize: '0.62rem',
                    fontWeight: '700'
                  }}
                >
                  {roleConfig.label}
                </span>
              </div>
            </div>
          ) : (
            <div className="brand-collapsed-logo" title="Ordersly Admin Panel">
              <img src="/favicon.png" alt="Ordersly" className="collapsed-brand-img" />
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

      {/* Navigation List */}
      <nav className="sidebar-nav-container">
        <ul className="sidebar-menu-list">
          {navItems.map((item) => (
            <li key={item.path} className="sidebar-menu-item">
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) => "sidebar-menu-link" + (isActive ? " active" : "")}
                onClick={() => {
                  if (window.innerWidth < 992 && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="link-icon">{item.icon}</span>
                {!isCollapsed && <span className="link-text">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Settings Link (If permitted) */}
      {canAccessRoute(admin?.role, '/settings') && (
        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) => "sidebar-menu-link" + (isActive ? " active" : "")}
            title={isCollapsed ? "Site Settings" : undefined}
          >
            <span className="link-icon"><FiSettings /></span>
            {!isCollapsed && <span className="link-text">Settings</span>}
          </NavLink>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
