import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiUser, FiShoppingBag, FiMenu, FiSearch, FiHeart, FiX } from 'react-icons/fi';
import MobileMenu from './MobileMenu';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import logoImg from '../../assets/logo/logo.jpeg';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { totalItems, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();

  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(
    localStorage.getItem('orderly_customer_token') ||
    localStorage.getItem('orderly_logged_in_user')
  ));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    const checkAuth = () => {
      const logged = Boolean(
        localStorage.getItem('orderly_customer_token') ||
        localStorage.getItem('orderly_logged_in_user')
      );
      setIsLoggedIn(logged);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', checkAuth);
    window.addEventListener('orderly_auth_changed', checkAuth);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('orderly_auth_changed', checkAuth);
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
          <Link to="/" className="navbar-brand">
            <img src={logoImg} alt="ORDERLY Mens Wear" className="brand-logo-img" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav d-none d-lg-flex">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              HOME
            </NavLink>

            <NavLink to="/shop" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              SHOP
            </NavLink>

            <NavLink to="/combos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              COMBOS
            </NavLink>

            <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              ABOUT US
            </NavLink>

            <NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              CONTACT
            </NavLink>
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

            {/* Customer Account / Profile Icon */}
            <Link 
              to={isLoggedIn ? "/profile" : "/login"} 
              className="nav-action-btn position-relative" 
              aria-label="Customer Profile" 
              title={isLoggedIn ? "My Profile" : "Account / Login"}
            >
              <FiUser />
              {isLoggedIn && <span className="user-online-badge" />}
            </Link>

            {/* Wishlist Link Icon */}
            <Link
              to="/wishlist"
              className="nav-action-btn position-relative"
              aria-label="Wishlist"
              title="My Wishlist"
            >
              <FiHeart />
              {wishlistCount > 0 && <span className="action-badge badge-red">{wishlistCount}</span>}
            </Link>

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
            <Link 
              to="/wishlist" 
              className="nav-action-btn position-relative"
              aria-label="Wishlist"
            >
              <FiHeart />
              {wishlistCount > 0 && <span className="action-badge badge-red">{wishlistCount}</span>}
            </Link>
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
