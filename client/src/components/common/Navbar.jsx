import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiUser, FiShoppingBag, FiMenu } from 'react-icons/fi';
import MobileMenu from './MobileMenu';
import { useCart } from '../../context/CartContext';
import logoImg from '../../assets/logo/logo.jpeg';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { totalItems, setIsCartOpen } = useCart();

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
              Home
            </NavLink>

            <NavLink to="/shop" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Shop
            </NavLink>

            <NavLink to="/combos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Combos
            </NavLink>

            <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              About Us
            </NavLink>

            <NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Contact Us
            </NavLink>
          </nav>

          {/* Desktop Action Icons */}
          <div className="navbar-actions d-none d-lg-flex">
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

            <button 
              className="nav-action-btn cart-btn-trigger"
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart drawer"
            >
              <FiShoppingBag />
              {totalItems > 0 && <span className="action-badge badge-red">{totalItems}</span>}
            </button>
          </div>

          {/* Mobile / Tablet Header Actions */}
          <div className="navbar-actions-mobile d-lg-none">
            <Link 
              to={isLoggedIn ? "/profile" : "/login"} 
              className="nav-action-btn position-relative" 
              aria-label="Customer Profile" 
              title={isLoggedIn ? "My Profile" : "Account / Login"}
            >
              <FiUser />
              {isLoggedIn && <span className="user-online-badge" />}
            </Link>
          </div>
        </div>
      </header>

      {/* Slide-overs */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};

export default Navbar;
