import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiGift, FiTag, FiArrowRight } from 'react-icons/fi';
import { getSettings } from '../../services/api';

const DEFAULT_PROMOS = {
  block1: {
    title: 'COMBO OFFERS',
    subtitle: 'Best Style, Best Value',
    buttonText: 'EXPLORE COMBOS',
    buttonLink: '/combos'
  },
  block2: {
    tag: 'UP TO',
    discountTitle: '50% OFF',
    subtitle: 'On Selected Items',
    buttonText: 'SHOP NOW',
    buttonLink: '/shop',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
  },
  block3: {
    title: 'NEW ARRIVALS',
    subtitle: 'Fresh Styles Just Landed',
    buttonText: 'EXPLORE NOW',
    buttonLink: '/shop'
  }
};

const MobilePromotions = () => {
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
    <section className="mobile-only py-4">
      <div className="mobile-promotions-container">
        {/* Card 1: Combo Offers */}
        <div className="mobile-promo-block">
          <FiGift className="mobile-promo-icon-red" />
          <h3 className="mobile-promo-title">{b1.title || 'COMBO OFFERS'}</h3>
          <p className="mobile-promo-sub">{b1.subtitle || 'Best Style, Best Value'}</p>
          <Link to={b1.buttonLink || '/combos'} className="mobile-promo-link">
            {b1.buttonText || 'EXPLORE COMBOS'} <FiArrowRight />
          </Link>
        </div>

        {/* Card 2: 50% OFF Center Video Banner */}
        <div className="mobile-promo-banner-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={b2.image || DEFAULT_PROMOS.block2.image}
            className="mobile-promo-banner-video"
          >
            <source
              src={b2.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-man-adjusting-his-suit-jacket-42845-large.mp4'}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
          <div className="mobile-promo-banner-overlay" />
          <div className="mobile-promo-banner-content">
            <span className="mobile-promo-tag">{b2.tag || 'UP TO'}</span>
            <h2 className="mobile-promo-discount">{b2.discountTitle || '50% OFF'}</h2>
            <p className="mobile-promo-sub mb-3">{b2.subtitle || 'On Selected Items'}</p>
            <div>
              <Link to={b2.buttonLink || '/shop'} className="btn-mobile-red-solid py-2 px-3">
                {b2.buttonText || 'SHOP NOW'}
              </Link>
            </div>
          </div>
        </div>

        {/* Card 3: New Arrivals */}
        <div className="mobile-promo-block">
          <FiTag className="mobile-promo-icon-red" />
          <h3 className="mobile-promo-title">{b3.title || 'NEW ARRIVALS'}</h3>
          <p className="mobile-promo-sub">{b3.subtitle || 'Fresh Styles Just Landed'}</p>
          <Link to={b3.buttonLink || '/shop'} className="mobile-promo-link">
            {b3.buttonText || 'EXPLORE NOW'} <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MobilePromotions;
