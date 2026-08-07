import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { getOccasions } from '../../services/api';
import './ShopByOccasion.css';

const ShopByOccasion = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const [occasionsList, setOccasionsList] = useState([]);

  // Fetch occasions managed from the Admin CMS (DB) — no static fallbacks.
  useEffect(() => {
    const loadOccasions = async () => {
      try {
        const res = await getOccasions();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter(o => o.is_active !== false);
          const mapped = active.map(occ => ({
            id: occ.id,
            tag: (occ.subtitle || '').toUpperCase(),
            title: occ.name,
            categoryQuery: occ.slug || occ.name,
            image: occ.image
          }));
          setOccasionsList(mapped);
        } else {
          setOccasionsList([]);
        }
      } catch (err) {
        console.warn('Failed to load occasions from API:', err.message);
      }
    };
    loadOccasions();

    window.addEventListener('orderly_occasions_updated', loadOccasions);
    window.addEventListener('storage', loadOccasions);
    window.addEventListener('focus', loadOccasions);
    return () => {
      window.removeEventListener('orderly_occasions_updated', loadOccasions);
      window.removeEventListener('storage', loadOccasions);
      window.removeEventListener('focus', loadOccasions);
    };
  }, []);

  return (
    <section className="shop-by-occasion-section py-5">
      <div className="container-fluid px-lg-5">
        <div className="text-center mb-4 pb-2">
          {subtitle && <span className="category-section-subtitle text-uppercase d-block mb-1">{subtitle}</span>}
          <h2 className="occasion-main-heading">{title || 'Shop By Occasion'}</h2>
        </div>

        {/* 6 Cards in 3x2 Grid layout matching screenshot */}
        <div className="row g-3 g-md-4">
          {occasionsList.map((occ) => (
            <div key={occ.id} className="col-12 col-md-4">
              <div 
                className="screenshot-occasion-card"
                onClick={() => navigate(`/shop?category=${encodeURIComponent(occ.categoryQuery)}`)}
              >
                {occ.image && <img src={occ.image} alt={occ.title} className="occasion-card-background" />}
                <div className="card-gradient-overlay" />

                <div className="card-info-bottom">
                  <span className="card-red-tag">{occ.tag}</span>
                  <h3 className="card-white-title">{occ.title}</h3>
                </div>

                <div className="card-arrow-circle">
                  <FiArrowUpRight />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByOccasion;
