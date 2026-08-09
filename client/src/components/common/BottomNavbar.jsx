import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiLayers, FiPackage, FiHeart, FiUser } from 'react-icons/fi';
import { useWishlist } from '../../context/WishlistContext';
import './BottomNavbar.css';

const BottomNavbar = () => {
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist ? wishlist.length : 0;

  return (
    <nav className="orderly-bottom-navbar mobile-only" aria-label="Mobile App Bottom Navigation">
      <div className="bottom-nav-container">
        {/* 1. HOME */}
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <FiHome className="bottom-nav-icon" />
          <span className="bottom-nav-label">Home</span>
        </NavLink>

        {/* 2. SHOP */}
        <NavLink 
          to="/shop" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <FiGrid className="bottom-nav-icon" />
          <span className="bottom-nav-label">Shop</span>
        </NavLink>

        {/* 3. COMBOS */}
        <NavLink 
          to="/combos" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <FiPackage className="bottom-nav-icon" />
          <span className="bottom-nav-label">Combos</span>
        </NavLink>

        {/* 5. ACCOUNT */}
        <NavLink 
          to="/login" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <FiUser className="bottom-nav-icon" />
          <span className="bottom-nav-label">Account</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNavbar;
