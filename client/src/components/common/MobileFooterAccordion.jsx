import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiInstagram, FiFacebook, FiYoutube, FiTwitter } from 'react-icons/fi';
import logoImg from '../../assets/logo/logo.png';

const MobileFooterAccordion = () => {
  const [openSections, setOpenSections] = useState({
    shop: false,
    care: false,
    company: false
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <footer className="mobile-footer-section mobile-only">
      {/* 1. SHOP Accordion */}
      <div className="mobile-accordion-item">
        <button 
          type="button" 
          className="mobile-accordion-btn"
          onClick={() => toggleSection('shop')}
        >
          <span>SHOP</span>
          {openSections.shop ? <FiChevronUp /> : <FiChevronDown />}
        </button>

        {openSections.shop && (
          <div className="mobile-accordion-body">
            <Link to="/shop?category=Shirts" className="mobile-footer-link">Linen & Oxford Shirts</Link>
            <Link to="/shop?category=Tees" className="mobile-footer-link">Oversized T-Shirts & Polos</Link>
            <Link to="/shop?category=Denim" className="mobile-footer-link">Raw Selvedge Denim</Link>
            <Link to="/shop?category=Suits" className="mobile-footer-link">Tailored Blazers & Suits</Link>
            <Link to="/combos" className="mobile-footer-link">Coordinated Combos</Link>
          </div>
        )}
      </div>

      {/* 2. CUSTOMER CARE Accordion */}
      <div className="mobile-accordion-item">
        <button 
          type="button" 
          className="mobile-accordion-btn"
          onClick={() => toggleSection('care')}
        >
          <span>CUSTOMER CARE</span>
          {openSections.care ? <FiChevronUp /> : <FiChevronDown />}
        </button>

        {openSections.care && (
          <div className="mobile-accordion-body">
            <Link to="/contact" className="mobile-footer-link">Contact Us</Link>
            <Link to="/orders" className="mobile-footer-link">Track Order</Link>
            <Link to="/shipping-policy" className="mobile-footer-link">Shipping Policy</Link>
            <Link to="/returns-policy" className="mobile-footer-link">Returns & Exchanges</Link>
          </div>
        )}
      </div>

      {/* 3. COMPANY Accordion */}
      <div className="mobile-accordion-item">
        <button 
          type="button" 
          className="mobile-accordion-btn"
          onClick={() => toggleSection('company')}
        >
          <span>COMPANY</span>
          {openSections.company ? <FiChevronUp /> : <FiChevronDown />}
        </button>

        {openSections.company && (
          <div className="mobile-accordion-body">
            <Link to="/about" className="mobile-footer-link">About ORDERLY</Link>
            <Link to="/terms" className="mobile-footer-link">Terms & Conditions</Link>
            <Link to="/privacy" className="mobile-footer-link">Privacy Policy</Link>
          </div>
        )}
      </div>

      {/* 4. FOLLOW US */}
      <div className="mt-4">
        <div className="font-monospace small fw-bold text-white mb-2">FOLLOW US</div>
        <div className="mobile-social-row">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="mobile-social-icon"><FiFacebook /></a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="mobile-social-icon"><FiInstagram /></a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="mobile-social-icon"><FiTwitter /></a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="mobile-social-icon"><FiYoutube /></a>
        </div>
      </div>

      {/* 5. PAYMENT METHODS */}
      <div className="mt-3">
        <div className="font-monospace small fw-bold text-white mb-2">PAYMENT METHODS</div>
        <div className="mobile-payment-badges">
          <span className="mobile-payment-badge">VISA</span>
          <span className="mobile-payment-badge">MASTERCARD</span>
          <span className="mobile-payment-badge">UPI</span>
          <span className="mobile-payment-badge">RUPAY</span>
        </div>
      </div>

      {/* 6. BRAND FOOTER */}
      <div className="mt-4 pt-3 border-top border-secondary">
        <img src={logoImg} alt="ORDERLY" style={{ height: 24, objectFit: 'contain' }} className="mb-2" />
        <p className="text-white-50 extra-small mb-2">
          Orderly is your destination for premium men's wear. Crafted for style, built for comfort, made for you.
        </p>
        <div className="text-white-50 extra-small">
          © 2026 Orderly. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default MobileFooterAccordion;
