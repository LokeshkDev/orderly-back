import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiYoutube, FiTwitter } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { getSettings } from '../../services/api';
import logoImg from '../../assets/logo/logo.jpeg';
import './Footer.css';

const Footer = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const res = await getSettings();
      if (active && res?.success) setSettings(res.data);
    };
    load();

    const onSync = () => load();
    window.addEventListener('orderly_settings_updated', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      active = false;
      window.removeEventListener('orderly_settings_updated', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  return (
    <footer className="orderly-footer">
      <div className="container-fluid px-lg-5 py-5">
        <div className="row g-4 mb-5">
          {/* Left Column: Brand Bio */}
          <div className="col-lg-3 col-md-6">
            <div className="footer-brand mb-3">
              <img src={logoImg} alt="ORDERLY Mens Wear" className="footer-logo-img" />
            </div>
            <p className="footer-bio">
              {settings?.footer_bio || 'Orderly is your destination for premium men\'s wear. Crafted for style, built for comfort, made for you.'}
            </p>
            <div className="footer-socials">
              <a href={settings?.facebook_url || "#"} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FiFacebook />
              </a>
              <a href={settings?.instagram_url || "#"} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href={settings?.twitter_url || "#"} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href={settings?.youtube_url || "#"} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <FiYoutube />
              </a>
            </div>
          </div>

          {/* Column 1: SHOP */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="footer-heading">SHOP</h6>
            <ul className="footer-links">
              <li><Link to="/shop">All Products</Link></li>
              <li><Link to="/shop?category=Shirts">Shirts</Link></li>
              <li><Link to="/shop?category=Tees">T-Shirts</Link></li>
              <li><Link to="/shop?category=Pants">Pants</Link></li>
              <li><Link to="/shop?category=Jackets">Jackets</Link></li>
              <li><Link to="/shop?category=Accessories">Accessories</Link></li>
            </ul>
          </div>

          {/* Column 2: CUSTOMER CARE */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="footer-heading">CUSTOMER CARE</h6>
            <ul className="footer-links">
              <li><Link to="/profile">Track Order</Link></li>
              <li><Link to="/returns-policy">Returns & Refunds</Link></li>
              <li><Link to="/shipping-policy">Shipping Policy</Link></li>
              <li><Link to="/about">Size Guide</Link></li>
              <li><Link to="/contact">FAQs</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 3: COMPANY */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="footer-heading">COMPANY</h6>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/about">Careers</Link></li>
              <li><Link to="/returns-policy">Privacy Policy</Link></li>
              <li><Link to="/shipping-policy">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Column 4: PAYMENT METHODS */}
          <div className="col-lg-3 col-md-6">
            <h6 className="footer-heading">PAYMENT METHODS</h6>
            <div className="payment-badges-row mb-3">
              <span className="pay-badge">VISA</span>
              <span className="pay-badge">MASTERCARD</span>
              <span className="pay-badge">UPI</span>
              <span className="pay-badge">PAYTM</span>
            </div>
            <p className="security-text">
              🔒 100% Secure Payments
            </p>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar pt-4 border-top border-dark d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
          <p className="copyright-text mb-0">
            {settings?.footer_copyright || `© ${new Date().getFullYear()} Orderly. All Rights Reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
