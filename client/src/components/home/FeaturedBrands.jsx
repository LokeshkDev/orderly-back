import React, { useEffect, useState } from 'react';
import { getBrands } from '../../services/api';
import './FeaturedBrands.css';

const FeaturedBrands = ({ title, subtitle }) => {
  const [brands, setBrands] = useState([]);

  // Fetch brands managed from the Admin CMS (DB) — no static fallbacks.
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await getBrands();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter(b => b.is_active !== false);
          const mapped = active.map(b => ({
            id: b.id,
            name: b.name,
            logo: b.logo_text || b.name.toUpperCase()
          }));
          setBrands(mapped);
        } else {
          setBrands([]);
        }
      } catch (err) {
        console.warn('Failed to load brands from API:', err.message);
      }
    };
    loadBrands();

    window.addEventListener('orderly_brands_updated', loadBrands);
    window.addEventListener('storage', loadBrands);
    window.addEventListener('focus', loadBrands);
    return () => {
      window.removeEventListener('orderly_brands_updated', loadBrands);
      window.removeEventListener('storage', loadBrands);
      window.removeEventListener('focus', loadBrands);
    };
  }, []);

  return (
    <section className="orderly-featured-brands py-5">
      <div className="container">
        <div className="text-center mb-4">
          <span className="section-subtitle">{subtitle || 'Curated In-House Houses'}</span>
          {title && <h2 className="trending-section-title text-white mt-1">{title}</h2>}
        </div>

        <div className="brands-grid">
          {brands.map((brand) => (
            <div key={brand.id} className="brand-logo-card glass-card">
              <span className="brand-badge-logo">{brand.logo}</span>
              <h5 className="brand-name">{brand.name}</h5>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBrands;
