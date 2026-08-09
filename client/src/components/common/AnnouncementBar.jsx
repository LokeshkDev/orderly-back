import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { getSettings } from '../../services/api';
import './AnnouncementBar.css';

const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [config, setConfig] = useState({ enabled: true, backgroundColor: '#000000', textColor: '#ffffff', accentColor: '#e11d48' });
  const [socialLinks, setSocialLinks] = useState({});

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (active && res && res.success && res.data) {
          const cfg = res.data.announcement_config || {};
          setConfig({
            enabled: cfg.enabled !== false,
            backgroundColor: cfg.backgroundColor || '#000000',
            textColor: cfg.textColor || '#ffffff',
            accentColor: cfg.accentColor || '#e11d48'
          });

          let items = [];
          if (cfg.message) {
            items.push(cfg.message);
          }
          if (typeof res.data.announcements === 'string') {
            const split = res.data.announcements.split('|').filter(Boolean);
            items.push(...split);
          } else if (Array.isArray(res.data.announcements)) {
            items.push(...res.data.announcements);
          }

          const uniqueItems = Array.from(new Set(items)).filter(Boolean);
          const defaultText = "COMPLIMENTARY EXPRESS SHIPPING ON ALL ORDERS ABOVE ₹2,500";
          setAnnouncements(uniqueItems.length > 0 ? uniqueItems : [defaultText]);

          setSocialLinks({
            facebook_url: res.data.facebook_url || '',
            instagram_url: res.data.instagram_url || '',
            youtube_url: res.data.youtube_url || ''
          });
          setCurrentIndex(0);
        } else {
          setAnnouncements(["COMPLIMENTARY EXPRESS SHIPPING ON ALL ORDERS ABOVE ₹2,500"]);
        }
      } catch (err) {
        setAnnouncements(["COMPLIMENTARY EXPRESS SHIPPING ON ALL ORDERS ABOVE ₹2,500"]);
      }
    };
    loadSettings();
    const onSync = () => loadSettings();
    window.addEventListener('orderly_settings_updated', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      active = false;
      window.removeEventListener('orderly_settings_updated', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (!config.enabled) return null;

  const currentText = announcements[currentIndex] || "COMPLIMENTARY EXPRESS SHIPPING ON ALL ORDERS ABOVE ₹2,500";
  
  // Helper to highlight currency amounts in RED (e.g. ₹2,500)
  const renderHighlightedAnnouncement = (text) => {
    if (!text) return null;
    const parts = text.split(/(₹\d+[\d,]*|\b\d+\s*%|\b\d+\s*DAYS\b)/gi);
    return parts.map((part, index) => {
      if (/^(₹\d+[\d,]*|\d+\s*%|\d+\s*DAYS)$/i.test(part)) {
        return <span key={index} className="announcement-red-highlight" style={{ color: config.accentColor }}>{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="orderly-announcement-bar" style={{ backgroundColor: config.backgroundColor, color: config.textColor }}>
      <div className="announcement-bar-container">
        {/* Center Promos Rotator */}
        <div className="announcement-content">
          {announcements.length > 1 && (
            <button 
              className="announcement-nav-btn" 
              onClick={() => setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length)}
              aria-label="Previous announcement"
              style={{ color: config.textColor }}
            >
              <FiChevronLeft />
            </button>
          )}
          
          <span className="announcement-text animate-fade-in" style={{ color: config.textColor }}>
            {renderHighlightedAnnouncement(currentText)}
          </span>
          
          {announcements.length > 1 && (
            <button 
              className="announcement-nav-btn" 
              onClick={() => setCurrentIndex(prev => (prev + 1) % announcements.length)}
              aria-label="Next announcement"
              style={{ color: config.textColor }}
            >
              <FiChevronRight />
            </button>
          )}
        </div>

        {/* Right Side Social Media Icons */}
        <div className="announcement-social-links">
          {socialLinks.facebook_url && (
            <a
              href={socialLinks.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-link social-facebook"
              aria-label="Facebook"
              title="Facebook"
            >
              <FaFacebookF />
            </a>
          )}
          {socialLinks.instagram_url && (
            <a
              href={socialLinks.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-link social-instagram"
              aria-label="Instagram"
              title="Instagram"
            >
              <FaInstagram />
            </a>
          )}
          {socialLinks.youtube_url && (
            <a
              href={socialLinks.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-link social-youtube"
              aria-label="YouTube"
              title="YouTube"
            >
              <FaYoutube />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
