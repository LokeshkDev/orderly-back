import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { getSettings } from '../../services/api';
import './AnnouncementBar.css';

const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (active && res && res.success && res.data) {
          const parsed = typeof res.data.announcements === 'string'
            ? res.data.announcements.split('|').filter(Boolean)
            : Array.isArray(res.data.announcements) ? res.data.announcements : [];
          setAnnouncements(parsed);
          setSocialLinks({
            facebook_url: res.data.facebook_url || '',
            instagram_url: res.data.instagram_url || '',
            youtube_url: res.data.youtube_url || ''
          });
          setCurrentIndex(0);
        }
      } catch (err) {
        console.warn('Failed to load settings:', err.message);
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
    if (announcements.length === 0) {
      setCurrentIndex(0);
      return undefined;
    }
    setCurrentIndex(prev => (prev >= announcements.length ? 0 : prev));
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  return (
    <div className="orderly-announcement-bar">
      <div className="announcement-bar-container">
        {/* Center Promos Rotator */}
        <div className="announcement-content">
          <button 
            className="announcement-nav-btn" 
            onClick={() => setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length)}
            aria-label="Previous announcement"
          >
            <FiChevronLeft />
          </button>
          
          <span className="announcement-text animate-fade-in">
            {announcements[currentIndex]}
          </span>
          
          <button 
            className="announcement-nav-btn" 
            onClick={() => setCurrentIndex(prev => (prev + 1) % announcements.length)}
            aria-label="Next announcement"
          >
            <FiChevronRight />
          </button>
        </div>

        {/* Right Side Social Media Icons (Authentic Original Brand Colors) */}
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
