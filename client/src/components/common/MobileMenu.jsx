import React from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiChevronRight, FiHeart } from 'react-icons/fi';
import './MobileMenu.css';

const MobileMenu = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="mobile-menu-backdrop">
      <div className="mobile-menu-drawer glass-panel">
        <div className="mobile-menu-header">
          <span className="mobile-logo-text">ORDERLY</span>
          <button className="mobile-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="mobile-menu-body">
          <nav className="mobile-nav-links">
            <Link to="/" onClick={onClose} className="mobile-nav-item">
              Home <FiChevronRight />
            </Link>

            <div className="mobile-nav-section-title">Catalog</div>
            <Link to="/shop" onClick={onClose} className="mobile-nav-item">
              Shop All <FiChevronRight />
            </Link>
            <Link to="/combos" onClick={onClose} className="mobile-nav-item">
              Combos <FiChevronRight />
            </Link>

            <div className="mobile-nav-section-title">Company</div>
            <Link to="/about" onClick={onClose} className="mobile-nav-item">
              About ORDERLY <FiChevronRight />
            </Link>
            <Link to="/contact" onClick={onClose} className="mobile-nav-item">
              Contact Us <FiChevronRight />
            </Link>
          </nav>
        </div>

        <div className="mobile-menu-footer">
          <Link to="/wishlist" onClick={onClose} className="btn-outline-orderly w-100 mb-2">
            <FiHeart /> Wishlist
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
