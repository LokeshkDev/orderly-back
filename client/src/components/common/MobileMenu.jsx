import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiChevronRight, FiHeart, FiShoppingBag } from 'react-icons/fi';
import logoImg from '../../assets/logo/logo.jpeg';
import { useCart } from '../../context/CartContext';
import './MobileMenu.css';

const MobileMenu = ({ isOpen, onClose }) => {
  const { totalItems, setIsCartOpen } = useCart();

  const navLinks = [
    { title: 'HOME', path: '/' },
    { title: 'SHOP', path: '/shop' },
    { title: 'COMBOS', path: '/combos' },
    { title: 'ABOUT US', path: '/about' },
    { title: 'CONTACT', path: '/contact' }
  ];

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
          {navLinks.map((link, idx) => (
            <NavLink
              key={idx}
              to={link.path}
              onClick={onClose}
              className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
            >
              <span>{link.title}</span>
              <FiChevronRight style={{ fontSize: '1.1rem', opacity: 0.6 }} />
            </NavLink>
          ))}
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
