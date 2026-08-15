import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../../services/api';

const DEFAULT_LOOKBOOK = {
  title: 'THE LOOKBOOK',
  year: '2026',
  description: 'Elevate your wardrobe with the latest trends designed for the modern man.',
  buttonText: 'EXPLORE NOW',
  buttonLink: '/shop',
  image: ''
};

const MobileLookbook = () => {
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
    <section className="mobile-only py-4">
      <div className="mobile-lookbook-card">
        {config.mobile_image || config.image ? (
          <img 
            src={config.mobile_image || config.image || ''} 
            alt={config.title || 'The Lookbook'} 
            className="mobile-lookbook-img" 
          />
        ) : (
          <div className="mobile-lookbook-img orderly-img-fallback">ORDERLY</div>
        )}
        <div className="mobile-lookbook-overlay" />
        
        <div className="mobile-lookbook-content">
          <h3 className="mobile-lookbook-title">{config.title || 'THE LOOKBOOK'}</h3>
          <div className="mobile-lookbook-year">{config.year || '2026'}</div>
          <p className="text-white-50 small mb-3">
            {config.description || 'Elevate your wardrobe with the latest trends designed for the modern man.'}
          </p>
          <Link to={config.buttonLink || '/shop'} className="btn-mobile-white">
            {config.buttonText || 'EXPLORE NOW'}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MobileLookbook;
