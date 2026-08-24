import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { getSettings } from '../../services/api';
import './AnnouncementBar.css';

const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [config, setConfig] = useState({ enabled: true, backgroundColor: '#000000', textColor: '#ffffff', accentColor: '#dc2626' });
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
            accentColor: cfg.accentColor || '#dc2626'
          });

          // Support new announcements array format (preferred) and legacy single message format
          let items = [];
          if (Array.isArray(cfg.announcements) && cfg.announcements.length > 0) {
            items = cfg.announcements
              .filter(a => a && (typeof a === 'string' ? a.trim() : (a.message && a.message.trim())))
              .map(a => typeof a === 'string' ? { message: a, highlightedText: '', link: '' } : a);
          }
          // Fallback to legacy single message
          if (items.length === 0 && cfg.message) {
            items.push({ message: cfg.message, highlightedText: cfg.highlightedText || '', link: cfg.link || '' });
          }
          // Fallback to old announcements field
          if (items.length === 0) {
            if (typeof res.data.announcements === 'string') {
              const split = res.data.announcements.split('|').filter(Boolean);
              items = split.map(msg => ({ message: msg, highlightedText: '', link: '' }));
            } else if (Array.isArray(res.data.announcements)) {
              items = res.data.announcements.map(a => typeof a === 'string' ? { message: a, highlightedText: '', link: '' } : a);
            }
          }

          setAnnouncements(items);

          setSocialLinks({
            facebook_url: res.data.facebook_url || '',
            instagram_url: res.data.instagram_url || '',
            youtube_url: res.data.youtube_url || ''
          });
          setCurrentIndex(0);
        } else {
          setAnnouncements([]);
        }
      } catch (err) {
        setAnnouncements([]);
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

  if (!config.enabled || announcements.length === 0) return null;
  
  const currentItem = announcements[currentIndex] || announcements[0];
  
  // Helper to highlight multiple custom words/phrases + fallback currency in RED
  const renderHighlightedAnnouncement = (item) => {
    if (!item) return null;
    const message = typeof item === 'string' ? item : (item.message || '');
    const customHighlights = typeof item === 'object' && item.highlightedText ? item.highlightedText : '';
    
    // Parse custom tokens (comma, pipe, or semicolon separated)
    const customTokens = customHighlights
      ? customHighlights.split(/[,|;]+/).map(s => s.trim()).filter(Boolean)
      : [];

    const escapeRegex = (s) => s.replace(/[.*+?^$\{\}()|[\]\\\\]/g, '\\$&');

    const regexParts = [];
    customTokens.forEach(tok => {
      regexParts.push(escapeRegex(tok));
    });
    // Add standard currency amounts / % / DAYS patterns
    regexParts.push('₹\\d+[\\d,]*');
    regexParts.push('\\b\\d+\\s*%');
    regexParts.push('\\b\\d+\\s*DAYS\\b');

    const combinedRegex = new RegExp(`(${regexParts.join('|')})`, 'gi');
    const parts = message.split(combinedRegex);

    return parts.map((part, index) => {
      if (!part) return null;
      const isCustomMatch = customTokens.some(tok => tok.toLowerCase() === part.toLowerCase());
      const isPatternMatch = /^(₹\d+[\d,]*|\d+\s*%|\d+\s*DAYS)$/i.test(part);

      if (isCustomMatch || isPatternMatch) {
        return (
          <span 
            key={index} 
            className="announcement-red-highlight" 
            style={{ color: config.accentColor || '#dc2626', fontWeight: '800' }}
          >
            {part}
          </span>
        );
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
            {currentItem.link ? (
              <a href={currentItem.link} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                {renderHighlightedAnnouncement(currentItem)}
              </a>
            ) : (
              renderHighlightedAnnouncement(currentItem)
            )}
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
