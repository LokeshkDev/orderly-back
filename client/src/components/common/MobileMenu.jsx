import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHeart, FiShoppingBag, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import logoImg from '../../assets/logo/logo.png';
import { useCart } from '../../context/CartContext';
import { getSettings } from '../../services/api';
import './MobileMenu.css';

const DEFAULT_MOBILE_LINKS = [
  { label: 'SHOP', url: '/shop' },
  { label: 'COMBOS', url: '/combos' },
  { label: 'ABOUT US', url: '/about' },
  { label: 'CONTACT', url: '/contact' }
];

const MobileMenu = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { totalItems = 0, setIsCartOpen = () => {} } = useCart() || {};
  const [navLinks, setNavLinks] = useState(DEFAULT_MOBILE_LINKS);
  const [expandedNavs, setExpandedNavs] = useState({});

  const currentPath = location.pathname;
  const currentSearch = location.search;
  const currentFullPath = currentPath + currentSearch;

  const isLinkActive = (link, activeSubItems = []) => {
    if (activeSubItems.length > 0) {
      return activeSubItems.some(sub => {
        if (!sub.url) return false;
        return sub.url === currentFullPath || (currentSearch && sub.url === currentPath + currentSearch);
      });
    }

    if (!link.url) return false;
    if (link.url === currentFullPath) return true;
    if (currentSearch && !link.url.includes('?')) return false;
    if (!currentSearch && link.url === currentPath) return true;
    return false;
  };

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (active && res?.success && res?.data) {
          const links = res.data.header_menu_links;
          if (Array.isArray(links) && links.length > 0) {
            setNavLinks(links.filter(l => l.enabled !== false));
          }
        }
      } catch (e) {}
    };
    loadSettings();
    const onSync = () => loadSettings();
    window.addEventListener('orderly_settings_updated', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      active = false;
      window.removeEventListener('orderly_settings_updated', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  const toggleExpand = (linkIdOrIdx) => {
    setExpandedNavs(prev => ({
      ...prev,
      [linkIdOrIdx]: !prev[linkIdOrIdx]
    }));
  };

  return (
    <div className={`mobile-drawer-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mobile-drawer-header">
          <img src={logoImg} alt="ORDERLY" style={{ height: 26, objectFit: 'contain' }} />
          <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close menu" />
        </div>

        {/* Links List */}
        <nav className="mobile-drawer-nav">
          {navLinks.map((link, idx) => {
            const activeSubItems = (link.sub_items || []).filter(s => s.enabled !== false);
            const hasSubItems = activeSubItems.length > 0;
            const linkKey = link.id || idx;
            const isExpanded = !!expandedNavs[linkKey];
            const isActive = isLinkActive(link, activeSubItems);

            if (hasSubItems) {
              return (
                <div key={linkKey} className="mobile-drawer-accordion">
                  <div className="mobile-drawer-parent-row">
                    {link.url && link.url !== '#' ? (
                      <Link
                        to={link.url}
                        onClick={onClose}
                        className={`mobile-drawer-link ${isActive ? 'active' : ''}`}
                      >
                        <span>{link.label || link.title}</span>
                      </Link>
                    ) : (
                      <span 
                        className={`mobile-drawer-link ${isActive ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleExpand(linkKey)}
                      >
                        {link.label || link.title}
                      </span>
                    )}
                    <button
                      type="button"
                      className="mobile-accordion-toggle"
                      onClick={() => toggleExpand(linkKey)}
                      aria-label={`Toggle ${link.label || link.title} submenu`}
                    >
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mobile-drawer-subnav">
                      {activeSubItems.map((sub, sIdx) => {
                        const isSubActive = sub.url === currentFullPath || (!currentSearch && sub.url === currentPath);
                        return sub.url?.startsWith('http') ? (
                          <a
                            key={sub.id || sIdx}
                            href={sub.url}
                            target={sub.is_external ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            onClick={onClose}
                            className={`mobile-drawer-sublink ${isSubActive ? 'active' : ''}`}
                          >
                            {sub.label}
                          </a>
                        ) : (
                          <Link
                            key={sub.id || sIdx}
                            to={sub.url || '/shop'}
                            onClick={onClose}
                            className={`mobile-drawer-sublink ${isSubActive ? 'active' : ''}`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return link.url?.startsWith('http') ? (
              <a
                key={linkKey}
                href={link.url}
                target={link.is_external ? "_blank" : "_self"}
                rel="noopener noreferrer"
                onClick={onClose}
                className={`mobile-drawer-link ${isActive ? 'active' : ''}`}
              >
                <span>{link.label || link.title}</span>
                <FiChevronRight style={{ fontSize: '1.1rem', opacity: 0.6 }} />
              </a>
            ) : (
              <Link
                key={linkKey}
                to={link.url || link.path || '/shop'}
                onClick={onClose}
                className={`mobile-drawer-link ${isActive ? 'active' : ''}`}
              >
                <span>{link.label || link.title}</span>
                <FiChevronRight style={{ fontSize: '1.1rem', opacity: 0.6 }} />
              </Link>
            );
          })}
        </nav>

        {/* Quick Action Footer */}
        <div className="pt-3 border-top border-secondary mt-auto">
          <NavLink to="/wishlist" onClick={onClose} className="btn btn-outline-light btn-sm w-100 mb-2 d-flex align-items-center justify-content-center gap-2">
            <FiHeart /> Wishlist
          </NavLink>
          
          <button 
            type="button" 
            className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 fw-bold"
            onClick={() => {
              onClose();
              setIsCartOpen(true);
            }}
          >
            <FiShoppingBag /> View Bag ({totalItems})
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
