import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiChevronDown, FiChevronUp, FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiLinkedin, FiShare2 
} from 'react-icons/fi';
import { FaWhatsapp, FaPinterest, FaTiktok } from 'react-icons/fa';
import { getSettings } from '../../services/api';
import logoImg from '../../assets/logo/logo.png';

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

const MobileFooterAccordion = () => {
  const [settings, setSettings] = useState(null);
  const [openSections, setOpenSections] = useState({});

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

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
    <footer className="mobile-footer-section mobile-only">
      {/* Dynamic Navigation Accordions */}
      {columns.map((col) => {
        const isOpen = !!openSections[col.id || col.title];
        return (
          <div key={col.id || col.title} className="mobile-accordion-item">
            <button 
              type="button" 
              className="mobile-accordion-btn"
              onClick={() => toggleSection(col.id || col.title)}
            >
              <span>{col.title}</span>
              {isOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {isOpen && (
              <div className="mobile-accordion-body">
                {(col.links || []).map((link) => (
                  link.url?.startsWith('http') ? (
                    <a key={link.id || link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="mobile-footer-link">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.id || link.label} to={link.url || '/shop'} className="mobile-footer-link">
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Dynamic Social Follow Us */}
      {activeSocials.length > 0 && (
        <div className="mt-4">
          <div className="font-monospace small fw-bold text-white mb-2">FOLLOW US</div>
          <div className="mobile-social-row">
            {activeSocials.map(soc => (
              <a 
                key={soc.id || soc.platform}
                href={soc.url || "#"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mobile-social-icon"
                aria-label={soc.name || soc.platform}
                title={soc.name || soc.platform}
              >
                {getSocialIcon(soc.platform)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Payment Badges & Security */}
      <div className="mt-3">
        <div className="font-monospace small fw-bold text-white mb-2">PAYMENT METHODS</div>
        <div className="mobile-payment-badges mb-2">
          {activePayments.map(pay => (
            <span key={pay.id || pay.label} className="mobile-payment-badge">
              {pay.label}
            </span>
          ))}
        </div>
        <div className="text-warning extra-small">
          🔒 {securityBadgeText}
        </div>
      </div>

      {/* Brand Footer */}
      <div className="mt-4 pt-3 border-top border-secondary">
        <img 
          src={logoImg} 
          alt="ORDERLY" 
          style={{ height: 24, objectFit: 'contain' }} 
          className="mb-2"
          onError={(e) => { e.target.src = '/logo.png'; }}
        />
        <p className="text-white-50 extra-small mb-2">
          {bioText}
        </p>
        <div className="text-white-50 extra-small">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
};

export default MobileFooterAccordion;
