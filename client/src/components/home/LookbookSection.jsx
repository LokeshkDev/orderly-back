import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../../services/api';
import './LookbookSection.css';

const DEFAULT_LOOKBOOK = {
  title: 'THE LOOKBOOK',
  year: '2026',
  description: 'Elevate your wardrobe with the latest styles designed for the modern man.',
  buttonText: 'EXPLORE NOW',
  buttonLink: '/shop',
  image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1600&auto=format&fit=crop'
};

const LookbookSection = () => {
  const [config, setConfig] = useState(DEFAULT_LOOKBOOK);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (active && res && res.success && res.data && res.data.lookbook_config) {
          setConfig(prev => ({ ...prev, ...res.data.lookbook_config }));
        }
      } catch (err) {}
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

  return (
    <section className="orderly-lookbook-section py-5">
      <div className="container-fluid px-lg-5">
        <div className="lookbook-banner-card">
          <img 
            src={config.image || DEFAULT_LOOKBOOK.image} 
            alt={config.title || 'The Lookbook Fashion Campaign'} 
            className="lookbook-bg-img" 
          />
          <div className="lookbook-overlay" />

          <div className="lookbook-content-box">
            <h2 className="lookbook-main-title">{config.title || 'THE LOOKBOOK'}</h2>
            <div className="lookbook-year-red">{config.year || new Date().getFullYear()}</div>
            <p className="lookbook-sub-desc">
              {config.description || 'Elevate your wardrobe with the latest styles designed for the modern man.'}
            </p>
            <Link to={config.buttonLink || '/shop'} className="btn-lookbook-white">
              {config.buttonText || 'EXPLORE NOW'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LookbookSection;
