import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiMenu, FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import MobileMenu from './MobileMenu';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getSettings } from '../../services/api';
import logoImg from '../../assets/logo/logo.png';
import './Navbar.css';

const DEFAULT_HEADER_LINKS = [
  { id: 'nav-1', label: 'SHOP', url: '/shop' },
  { id: 'nav-2', label: 'COMBOS', url: '/combos' }
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [headerLinks, setHeaderLinks] = useState(DEFAULT_HEADER_LINKS);

  const { totalItems = 0, setIsCartOpen = () => {} } = useCart() || {};
  const { wishlistCount = 0 } = useWishlist() || {};

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (active && res?.success && res?.data) {
          const links = res.data.header_menu_links;
          if (Array.isArray(links) && links.length > 0) {
            setHeaderLinks(links.filter(l => l.enabled !== false));
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className={`orderly-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Mobile Menu Hamburger Trigger */}
          <button 
            className="mobile-menu-trigger d-lg-none"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <FiMenu />
          </button>

          {/* Logo */}
          <Link to="/" className="navbar-brand" aria-label="ORDERLY Mens Wear Home">
            <img 
              src={logoImg} 
              alt="ORDERLY Mens Wear" 
              className="brand-logo-img" 
              width="160" 
              height="42" 
              decoding="async" 
            />
          </Link>

          {/* Dynamic Desktop Nav Links with Sub-Menu Dropdowns */}
          <nav className="desktop-nav d-none d-lg-flex">
            {headerLinks.map((link, idx) => {
              const activeSubItems = (link.sub_items || []).filter(s => s.enabled !== false);
              const hasDropdown = activeSubItems.length > 0;
              const isActive = isLinkActive(link, activeSubItems);

              if (hasDropdown) {
                return (
                  <div key={link.id || idx} className="nav-dropdown-wrapper">
                    <Link 
                      to={link.url || '/shop'} 
                      className={isActive ? 'nav-link active d-inline-flex align-items-center' : 'nav-link d-inline-flex align-items-center'}
                    >
                      <span>{link.label}</span>
                      <FiChevronDown className="ms-1 dropdown-arrow" />
                    </Link>

                    <div className="nav-dropdown-menu">
                      {activeSubItems.map((sub, sIdx) => {
                        const isSubActive = sub.url === currentFullPath || (!currentSearch && sub.url === currentPath);
                        return sub.url?.startsWith('http') ? (
                          <a 
                            key={sub.id || sIdx}
                            href={sub.url}
                            target={sub.is_external ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            className={isSubActive ? "nav-dropdown-item active" : "nav-dropdown-item"}
                          >
                            {sub.label}
                          </a>
                        ) : (
                          <Link 
                            key={sub.id || sIdx}
                            to={sub.url || '/shop'}
                            className={isSubActive ? "nav-dropdown-item active" : "nav-dropdown-item"}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return link.url?.startsWith('http') ? (
                <a 
                  key={link.id || idx} 
                  href={link.url} 
                  target={link.is_external ? "_blank" : "_self"} 
                  rel="noopener noreferrer" 
                  className={isActive ? "nav-link active" : "nav-link"}
                >
                  {link.label}
                </a>
              ) : (
                <Link 
                  key={link.id || idx} 
                  to={link.url || '/shop'} 
                  className={isActive ? 'nav-link active' : 'nav-link'}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Icons */}
          <div className="navbar-actions d-none d-lg-flex">
            {/* Search Trigger Icon */}
            <button 
              className="nav-action-btn"
              onClick={() => setIsSearchOpen(prev => !prev)}
              aria-label="Search catalog"
              title="Search products"
            >
              <FiSearch />
            </button>

            {/* Cart Trigger */}
            <button 
              className="nav-action-btn cart-btn-trigger position-relative"
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart drawer"
              title="Shopping Cart"
            >
              <FiShoppingBag />
              {totalItems > 0 && <span className="action-badge badge-red">{totalItems}</span>}
            </button>
          </div>

          {/* Mobile Header Actions */}
          <div className="navbar-actions-mobile d-lg-none d-flex align-items-center gap-3">
            <button 
              className="nav-action-btn"
              onClick={() => setIsSearchOpen(prev => !prev)}
              aria-label="Search catalog"
            >
              <FiSearch />
            </button>
            <button 
              className="nav-action-btn cart-btn-trigger position-relative"
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart drawer"
            >
              <FiShoppingBag />
              {totalItems > 0 && <span className="action-badge badge-red">{totalItems}</span>}
            </button>
          </div>
        </div>

        {/* Expandable Search Overlay */}
        {isSearchOpen && (
          <div className="navbar-search-overlay">
            <div className="container">
              <form onSubmit={handleSearchSubmit} className="search-overlay-form">
                <FiSearch className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search shirts, denim, jackets, oversized tees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="search-overlay-input"
                />
                <button type="button" className="search-close-btn" onClick={() => setIsSearchOpen(false)}>
                  <FiX />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Slide-overs */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};

export default Navbar;
