import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiGift, FiTag, FiArrowRight } from 'react-icons/fi';
import { getSettings } from '../../services/api';
import './PromoSection.css';

const DEFAULT_PROMOS = {
  block1: {
    title: 'COMBO OFFERS',
    subtitle: 'Style, Best Value',
    buttonText: 'EXPLORE COMBOS',
    buttonLink: '/combos'
  },
  block2: {
    tag: 'UP TO',
    discountTitle: '50% OFF',
    subtitle: 'On Selected Items',
    buttonText: 'SHOP NOW',
    buttonLink: '/shop',
    image: ''
  },
  block3: {
    title: 'NEW ARRIVALS',
    subtitle: 'Fresh Styles Just Landed',
    buttonText: 'EXPLORE NOW',
    buttonLink: '/shop'
  }
};

const PromoSection = () => {
  const [promos, setPromos] = useState(DEFAULT_PROMOS);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (active && res && res.success && res.data && res.data.promotions_config) {
          setPromos(prev => ({ ...prev, ...res.data.promotions_config }));
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

  const b1 = promos.block1 || DEFAULT_PROMOS.block1;
  const b2 = promos.block2 || DEFAULT_PROMOS.block2;
  const b3 = promos.block3 || DEFAULT_PROMOS.block3;

  return (
    <section className="orderly-promo-section py-5">
      <div className="container-fluid px-lg-5">
        <div className="row g-4 align-items-stretch">
          {/* Block 1: Combo Offers */}
          <div className="col-lg-3 col-md-6">
            <div className="promo-side-block">
              <div className="promo-icon-box">
                <FiGift className="promo-icon-red" />
              </div>
              <h3 className="promo-block-title">{b1.title || 'COMBO OFFERS'}</h3>
              <p className="promo-block-sub">{b1.subtitle || 'Style, Best Value'}</p>
              <Link to={b1.buttonLink || '/combos'} className="promo-block-link">
                {b1.buttonText || 'EXPLORE COMBOS'} <FiArrowRight className="ms-1" />
              </Link>
            </div>
          </div>

          {/* Block 2: Main Video Banner */}
          <div className="col-lg-6 col-md-12">
            <div className="promo-center-banner">
              {!b2.image && (
                <div
                  className="promo-banner-video orderly-img-fallback"
                  style={{ position: 'absolute', inset: 0, zIndex: -1 }}
                >
                  ORDERLY
                </div>
              )}
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={b2.image || ''}
                className="promo-banner-video"
              >
                <source
                  src={b2.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-man-adjusting-his-suit-jacket-42845-large.mp4'}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
              <div className="promo-banner-overlay" />
              
              <div className="promo-banner-content">
                <span className="promo-upto-tag">{b2.tag || 'UP TO'}</span>
                <h2 className="promo-discount-title">{b2.discountTitle || '50% OFF'}</h2>
                <p className="promo-discount-sub">{b2.subtitle || 'On Selected Items'}</p>
                <Link to={b2.buttonLink || '/shop'} className="btn-promo-solid-red">
                  {b2.buttonText || 'SHOP NOW'}
                </Link>
              </div>
            </div>
          </div>

          {/* Block 3: New Arrivals */}
          <div className="col-lg-3 col-md-6">
            <div className="promo-side-block">
              <div className="promo-icon-box">
                <FiTag className="promo-icon-red" />
              </div>
              <h3 className="promo-block-title">{b3.title || 'NEW ARRIVALS'}</h3>
              <p className="promo-block-sub">{b3.subtitle || 'Fresh Styles Just Landed'}</p>
              <Link to={b3.buttonLink || '/shop'} className="promo-block-link">
                {b3.buttonText || 'EXPLORE NOW'} <FiArrowRight className="ms-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
