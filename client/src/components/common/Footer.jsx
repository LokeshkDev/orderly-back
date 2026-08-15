import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiLinkedin, FiShare2 
} from 'react-icons/fi';
import { FaWhatsapp, FaPinterest, FaTiktok } from 'react-icons/fa';
import { getSettings } from '../../services/api';
import logoImg from '../../assets/logo/logo.png';
import './Footer.css';

const DEFAULT_COLUMNS = [
  {
    id: 'col-1',
    title: 'SHOP',
    links: [
      { id: 'link-1-1', label: 'All Products', url: '/shop' },
      { id: 'link-1-2', label: 'Shirts', url: '/shop?category=Shirts' },
      { id: 'link-1-3', label: 'T-Shirts', url: '/shop?category=Tees' },
      { id: 'link-1-4', label: 'Pants', url: '/shop?category=Pants' },
      { id: 'link-1-5', label: 'Jackets', url: '/shop?category=Jackets' },
      { id: 'link-1-6', label: 'Accessories', url: '/shop?category=Accessories' }
    ]
  },
  {
    id: 'col-2',
    title: 'CUSTOMER CARE',
    links: [
      { id: 'link-2-1', label: 'Track Order', url: '/contact' },
      { id: 'link-2-2', label: 'Returns & Refunds', url: '/returns-policy' },
      { id: 'link-2-3', label: 'Shipping Policy', url: '/shipping-policy' },
      { id: 'link-2-4', label: 'Size Guide', url: '/about' },
      { id: 'link-2-5', label: 'FAQs', url: '/contact' },
      { id: 'link-2-6', label: 'Contact Us', url: '/contact' }
    ]
  },
  {
    id: 'col-3',
    title: 'COMPANY',
    links: [
      { id: 'link-3-1', label: 'About Us', url: '/about' },
      { id: 'link-3-2', label: 'Our Story', url: '/about' },
      { id: 'link-3-3', label: 'Careers', url: '/about' },
      { id: 'link-3-4', label: 'Privacy Policy', url: '/returns-policy' },
      { id: 'link-3-5', label: 'Terms & Conditions', url: '/shipping-policy' }
    ]
  }
];

const DEFAULT_PAYMENTS = [
  { id: 'pay-1', label: 'VISA', enabled: true },
  { id: 'pay-2', label: 'MASTERCARD', enabled: true },
  { id: 'pay-3', label: 'UPI', enabled: true },
  { id: 'pay-4', label: 'PAYTM', enabled: true }
];

const DEFAULT_SOCIALS = [
  { id: 'soc-1', platform: 'facebook', name: 'Facebook', url: 'https://facebook.com', enabled: true },
  { id: 'soc-2', platform: 'instagram', name: 'Instagram', url: 'https://instagram.com', enabled: true },
  { id: 'soc-3', platform: 'twitter', name: 'Twitter / X', url: 'https://twitter.com', enabled: true },
  { id: 'soc-4', platform: 'youtube', name: 'YouTube', url: 'https://youtube.com', enabled: true }
];

const getSocialIcon = (platformKey) => {
  switch (platformKey) {
    case 'facebook': return <FiFacebook />;
    case 'instagram': return <FiInstagram />;
    case 'twitter': return <FiTwitter />;
    case 'youtube': return <FiYoutube />;
    case 'whatsapp': return <FaWhatsapp />;
    case 'linkedin': return <FiLinkedin />;
    case 'pinterest': return <FaPinterest />;
    case 'tiktok': return <FaTiktok />;
    default: return <FiShare2 />;
  }
};

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

  const footer = settings?.footer_settings || {};
  const bioText = footer.bio || settings?.footer_bio || "Orderly is your destination for premium men's wear. Crafted for style, built for comfort, made for you.";
  const copyrightText = footer.copyright || settings?.footer_copyright || `© ${new Date().getFullYear()} Orderly. All Rights Reserved.`;
  const columns = Array.isArray(footer.columns) && footer.columns.length > 0 ? footer.columns : DEFAULT_COLUMNS;
  const socialLinks = Array.isArray(footer.social_links) && footer.social_links.length > 0 ? footer.social_links : DEFAULT_SOCIALS;
  const activeSocials = socialLinks.filter(s => s.enabled !== false);
  const paymentMethods = Array.isArray(footer.payment_methods) && footer.payment_methods.length > 0 ? footer.payment_methods : DEFAULT_PAYMENTS;
  const activePayments = paymentMethods.filter(p => p.enabled !== false);
  const securityBadgeText = footer.security_badge_text || '100% Secure Payments';

  return (
    <footer className="orderly-footer">
      <div className="container-fluid px-lg-5 py-5">
        <div className="row g-4 mb-5">
          {/* Left Column: Brand Bio & Social Links */}
          <div className="col-lg-3 col-md-6">
            <div className="footer-brand mb-3">
              <img 
                src={logoImg} 
                alt="ORDERLY Mens Wear" 
                className="footer-logo-img"
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </div>
            <p className="footer-bio">
              {bioText}
            </p>
            <div className="footer-socials">
              {activeSocials.map(soc => (
                <a 
                  key={soc.id || soc.platform}
                  href={soc.url || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={soc.name || soc.platform}
                  title={soc.name || soc.platform}
                >
                  {getSocialIcon(soc.platform)}
                </a>
              ))}
            </div>
          </div>

          {/* Dynamic Navigation Columns */}
          {columns.map((col) => (
            <div key={col.id || col.title} className="col-lg-2 col-md-4 col-6">
              <h6 className="footer-heading">{col.title}</h6>
              <ul className="footer-links">
                {(col.links || []).map((link) => (
                  <li key={link.id || link.label}>
                    {link.url?.startsWith('http') ? (
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.url || '/shop'}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Payment Methods Column */}
          <div className="col-lg-3 col-md-6">
            <h6 className="footer-heading">PAYMENT METHODS</h6>
            <div className="payment-badges-row mb-3">
              {activePayments.map(pay => (
                <span key={pay.id || pay.label} className="pay-badge">
                  {pay.label}
                </span>
              ))}
            </div>
            <p className="security-text">
              🔒 {securityBadgeText}
            </p>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar pt-4 border-top border-dark d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
          <p className="copyright-text mb-0">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
