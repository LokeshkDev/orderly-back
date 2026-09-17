import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiPackage, FiShoppingBag, FiHeadphones, FiPhoneCall, FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { getSettings } from '../../services/api';
import './BottomNavbar.css';

const BottomNavbar = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [contactDetails, setContactDetails] = useState({
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210'
  });

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (active && res?.success && res?.data) {
          setContactDetails({
            phone: res.data.contact_phone || '+91 98765 43210',
            whatsapp: res.data.contact_whatsapp || res.data.contact_phone || '+91 98765 43210'
          });
        }
      } catch (e) {}
    };
    loadSettings();
    window.addEventListener('orderly_settings_updated', loadSettings);
    return () => {
      active = false;
      window.removeEventListener('orderly_settings_updated', loadSettings);
    };
  }, []);

  const cleanPhone = (num) => String(num || '').replace(/[^0-9+]/g, '');
  const cleanWhatsapp = (num) => String(num || '').replace(/[^0-9]/g, '');

  return (
    <>
      {/* Support Popover Drawer / Sheet */}
      {isSupportOpen && (
        <div className="support-popover-backdrop" onClick={() => setIsSupportOpen(false)}>
          <div className="support-popover-card" onClick={(e) => e.stopPropagation()}>
            <div className="support-popover-header">
              <div className="d-flex align-items-center gap-2">
                <div className="support-icon-badge">
                  <FiHeadphones />
                </div>
                <div>
                  <h6 className="support-popover-title">Customer Support Desk</h6>
                  <p className="support-popover-sub">How can we assist you today?</p>
                </div>
              </div>
              <button 
                type="button" 
                className="support-popover-close" 
                onClick={() => setIsSupportOpen(false)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="support-options-grid">
              {/* WhatsApp Option */}
              <a 
                href={`https://wa.me/${cleanWhatsapp(contactDetails.whatsapp)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="support-option-btn whatsapp-btn"
                onClick={() => setIsSupportOpen(false)}
              >
                <div className="support-btn-icon-wrap whatsapp">
                  <FaWhatsapp />
                </div>
                <div className="support-btn-info">
                  <span className="support-btn-label">WhatsApp Concierge</span>
                  <span className="support-btn-val">{contactDetails.whatsapp}</span>
                </div>
              </a>

              {/* Phone Option */}
              <a 
                href={`tel:${cleanPhone(contactDetails.phone)}`} 
                className="support-option-btn phone-btn"
                onClick={() => setIsSupportOpen(false)}
              >
                <div className="support-btn-icon-wrap phone">
                  <FiPhoneCall />
                </div>
                <div className="support-btn-info">
                  <span className="support-btn-label">Direct Phone Call</span>
                  <span className="support-btn-val">{contactDetails.phone}</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Bottom Navigation Bar */}
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

          {/* 3. CENTER HIGHLIGHTED CART / BAG */}
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
            <span className="bottom-nav-label center-cart-label">Cart</span>
          </button>

          {/* 4. COMBOS */}
          <NavLink 
            to="/combos" 
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <FiPackage className="bottom-nav-icon" />
            <span className="bottom-nav-label">Combos</span>
          </NavLink>

          {/* 5. SUPPORT (REPLACES WISHLIST) */}
          <button 
            type="button" 
            className={`bottom-nav-item ${isSupportOpen ? 'active' : ''}`}
            onClick={() => setIsSupportOpen(prev => !prev)}
            aria-label="Contact Support"
          >
            <FiHeadphones className="bottom-nav-icon" />
            <span className="bottom-nav-label">Support</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNavbar;
