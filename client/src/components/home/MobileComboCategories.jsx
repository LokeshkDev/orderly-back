import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getComboCategories } from '../../services/api';
import { MobileCategorySkeleton } from '../common/Skeleton';

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
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

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
      } catch {
        setCategories(DEFAULT_MOBILE_COMBO_CATS);
      } finally {
        setLoading(false);
      }
    };
    loadComboCategories();

    const handleUpdated = () => loadComboCategories();
    window.addEventListener('orderly_categories_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('orderly_categories_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  return (
    <section className="mobile-only py-3">
      {/* Header */}
      <div className="mobile-section-header">
        <span className="mobile-section-eyebrow">CURATED COMBO SETS</span>
        <h2 className="mobile-section-title">EXPLORE COMBO CATEGORIES</h2>
      </div>

      {/* Horizontal Touch Scrollable Category Cards or Skeleton */}
      {loading ? (
        <MobileCategorySkeleton />
      ) : (
        <div className="mobile-categories-scroll">
          {categories.map((cat, idx) => (
            <Link 
              key={idx} 
              to={`/combos?category=${encodeURIComponent(cat.categoryQuery)}`} 
              className="mobile-category-pill"
            >
              <div className="mobile-category-avatar">
                {cat.image && cat.image.length > 0 ? (
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="mobile-category-avatar-img"
                    width="68"
                    height="68"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="mobile-category-avatar-img orderly-avatar-fallback">O</div>
                )}
              </div>
              <span className="mobile-category-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default MobileComboCategories;