import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiYoutube, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp, FaTwitter, FaPinterest } from 'react-icons/fa';
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

  const socials = [
    { url: settings?.instagram_url, icon: <FiInstagram />, label: 'Instagram' },
    { url: settings?.facebook_url, icon: <FiFacebook />, label: 'Facebook' },
    { url: settings?.youtube_url, icon: <FiYoutube />, label: 'YouTube' },
    { url: settings?.whatsapp_url || (settings?.contact_whatsapp ? `https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}` : null), icon: <FaWhatsapp />, label: 'WhatsApp' },
    { url: settings?.twitter_url, icon: <FaTwitter />, label: 'Twitter' },
    { url: settings?.pinterest_url, icon: <FaPinterest />, label: 'Pinterest' }
  ].filter(s => s.url);

  return (
    <footer className="orderly-footer">
      <div className="container py-5">
        <div className="row g-4 mb-5">
          {/* Brand Bio */}
          <div className="col-lg-4 col-md-6">
            <div className="footer-brand mb-3">
              <img src={logoImg} alt="ORDERLY Mens Wear" className="footer-logo-img" />
            </div>
            <p className="footer-bio">
              {settings?.footer_bio || settings?.store_tagline || 'Crafting Bespoke Luxury Apparel & Italian Tailoring for the Modern Gentleman.'}
            </p>
            {socials.length > 0 && (
              <div className="footer-socials">
                {socials.map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>{s.icon}</a>
                ))}
              </div>
            )}
          </div>

          {/* Column 1: Customer Support */}
          <div className="col-lg-3 col-md-6 col-6">
            <h6 className="footer-heading">Customer Care</h6>
            <ul className="footer-links">
              <li><Link to="/contact">Contact & Store Locations</Link></li>
              <li><Link to="/shipping-policy">Shipping & Delivery</Link></li>
              <li><Link to="/returns-policy">Returns & Exchanges</Link></li>
              <li><Link to="/about">About ORDERLY</Link></li>
            </ul>
          </div>

          {/* Column 2: Contact Details */}
          <div className="col-lg-5 col-md-6">
            <h6 className="footer-heading">Concierge Desk</h6>
            <div className="footer-contact-info">
              {settings?.contact_phone && (
                <div className="contact-item">
                  <FiPhone className="icon" />
                  <a href={`tel:${settings.contact_phone}`} className="text-white text-decoration-none">{settings.contact_phone}</a>
                </div>
              )}

              {settings?.contact_whatsapp && (
                <div className="contact-item">
                  <FaWhatsapp className="icon text-success" />
                  <a href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-success text-decoration-none fw-bold">
                    WhatsApp Support ({settings.contact_whatsapp})
                  </a>
                </div>
              )}

              {settings?.contact_email && (
                <div className="contact-item">
                  <FiMail className="icon" />
                  <a href={`mailto:${settings.contact_email}`} className="text-white text-decoration-none">{settings.contact_email}</a>
                </div>
              )}

              {settings?.contact_address && (
                <div className="contact-item">
                  <FiMapPin className="icon" />
                  <span>{settings.contact_address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom pt-4 border-top border-secondary d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <p className="copyright-text mb-0">
            {settings?.footer_copyright || `© ${new Date().getFullYear()} ${settings?.store_name || 'ORDERLY Mens Wear'}. All Rights Reserved.`}
          </p>
          <div className="payment-badges">
            <span className="pay-badge">VISA</span>
            <span className="pay-badge">MASTERCARD</span>
            <span className="pay-badge">UPI</span>
            <span className="pay-badge">NETBANKING</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
