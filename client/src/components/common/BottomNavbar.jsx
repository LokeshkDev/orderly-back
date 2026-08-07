import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingBag, FiLayers, FiUser } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import './BottomNavbar.css';

const BottomNavbar = () => {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <nav className="orderly-bottom-navbar d-lg-none" aria-label="Mobile Bottom Navigation">
      <div className="bottom-nav-container">
        {/* 1. Home */}
        <NavLink 
          to="/" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <FiHome className="bottom-nav-icon" />
          <span className="bottom-nav-label">Home</span>
        </NavLink>

        {/* 2. Shop */}
        <NavLink 
          to="/shop" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <FiGrid className="bottom-nav-icon" />
          <span className="bottom-nav-label">Shop</span>
        </NavLink>

        {/* 3. CENTER HIGHLIGHTED FLOATING CART / BAG BUTTON */}
        <button 
          type="button" 
          className="bottom-nav-item center-cart-highlight"
          onClick={() => setIsCartOpen(true)}
          aria-label="Open Shopping Bag"
        >
          <div className="center-cart-circle">
            <FiShoppingBag className="center-cart-icon" />
            {totalItems > 0 && <span className="center-cart-badge">{totalItems}</span>}
          </div>
          <span className="bottom-nav-label center-cart-label">Bag</span>
        </button>

        {/* 4. Combos */}
        <NavLink 
          to="/combos" 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <FiLayers className="bottom-nav-icon" />
          <span className="bottom-nav-label">Combos</span>
        </NavLink>

        {/* 5. Account */}
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
