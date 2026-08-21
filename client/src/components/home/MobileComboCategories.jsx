import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getComboCategories } from '../../services/api';

const DEFAULT_MOBILE_COMBO_CATS = [
  {
    name: 'FORMAL SUITS',
    sub: 'Tailored 2 & 3-Piece Sets',
    categoryQuery: 'formal-combos',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'CASUAL SETS',
    sub: 'Relaxed Everyday Ensembles',
    categoryQuery: 'casual-combos',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'TROUSER + SHIRT',
    sub: 'Smart Coordinated Looks',
    categoryQuery: 'casual-combos',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'DENIM SETS',
    sub: 'Sharp & Tailored Pairings',
    categoryQuery: 'casual-combos',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'PARTYWEAR & EVENING',
    sub: 'Exclusive Luxury Ensembles',
    categoryQuery: 'partywear-combos',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop'
  }
];

const MobileComboCategories = () => {
  const [categories, setCategories] = useState(DEFAULT_MOBILE_COMBO_CATS);

  useEffect(() => {
    const loadComboCategories = async () => {
      try {
        const res = await getComboCategories();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter(c => c.is_active !== false);
          const mapped = active.map((cat, idx) => ({
            name: (cat.name || '').toUpperCase(),
            sub: cat.description || cat.sub || DEFAULT_MOBILE_COMBO_CATS[idx % DEFAULT_MOBILE_COMBO_CATS.length]?.sub || 'Curated Combo Set',
            categoryQuery: cat.slug || cat.name,
            image: (cat.image && cat.image.length > 10) ? cat.image : ''
          }));
          setCategories(mapped.length > 0 ? mapped : DEFAULT_MOBILE_COMBO_CATS);
        } else {
          setCategories(DEFAULT_MOBILE_COMBO_CATS);
        }
      } catch (err) {
        setCategories(DEFAULT_MOBILE_COMBO_CATS);
      }
    };
    loadComboCategories();

    window.addEventListener('orderly_categories_updated', loadComboCategories);
    window.addEventListener('storage', loadComboCategories);
    return () => {
      window.removeEventListener('orderly_categories_updated', loadComboCategories);
      window.removeEventListener('storage', loadComboCategories);
    };
  }, []);

  return (
    <section className="mobile-only py-3">
      {/* Header */}
      <div className="mobile-section-header">
        <span className="mobile-section-eyebrow">CURATED COMBO SETS</span>
        <h2 className="mobile-section-title">EXPLORE COMBO CATEGORIES</h2>
      </div>

      {/* Horizontal Touch Scrollable Category Cards */}
      <div className="mobile-categories-scroll">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            to={`/combos?category=${encodeURIComponent(cat.categoryQuery)}`}
            className="mobile-category-card"
          >
            {cat.image && cat.image.length > 0 ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="mobile-category-img"
              />
            ) : (
              <div className="mobile-category-img orderly-img-fallback">ORDERLY</div>
            )}
            <div className="mobile-category-overlay" />
            <div className="mobile-category-info">
              <div className="mobile-category-name">{cat.name}</div>
              <span className="mobile-category-sub">{cat.sub}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MobileComboCategories;