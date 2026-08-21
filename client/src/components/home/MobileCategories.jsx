import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../services/api';

const DEFAULT_MOBILE_CATS = [
  {
    name: 'SHIRTS',
    sub: 'Everyday Luxury Linen',
    categoryQuery: 'Shirts',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'DENIM',
    sub: 'Japanese Selvedge Fit',
    categoryQuery: 'Denim',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'TEES & POLOS',
    sub: 'Urban Streetwear',
    categoryQuery: 'Tops & T-Shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'BLAZERS & SUITS',
    sub: 'Italian Tailored',
    categoryQuery: 'Blazers',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'TROUSERS',
    sub: 'Pleated & Chinos',
    categoryQuery: 'Trousers',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop'
  }
];

const MobileCategories = () => {
  const [categories, setCategories] = useState(DEFAULT_MOBILE_CATS);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter(c => c.is_active !== false);
          const mapped = active.map((cat, idx) => ({
            name: (cat.name || '').toUpperCase(),
            sub: cat.description || cat.sub || DEFAULT_MOBILE_CATS[idx % DEFAULT_MOBILE_CATS.length]?.sub || 'Everyday Comfort',
            categoryQuery: cat.slug || cat.name,
            image: (cat.image && cat.image.length > 10) ? cat.image : ''
          }));
          setCategories(mapped.length > 0 ? mapped : DEFAULT_MOBILE_CATS);
        } else {
          setCategories(DEFAULT_MOBILE_CATS);
        }
      } catch (err) {
        setCategories(DEFAULT_MOBILE_CATS);
      }
    };
    loadCategories();

    window.addEventListener('orderly_categories_updated', loadCategories);
    window.addEventListener('storage', loadCategories);
    return () => {
      window.removeEventListener('orderly_categories_updated', loadCategories);
      window.removeEventListener('storage', loadCategories);
    };
  }, []);

  return (
    <section className="mobile-only py-3">
      {/* Header */}
      <div className="mobile-section-header">
        <span className="mobile-section-eyebrow">EXPLORE COLLECTIONS</span>
        <h2 className="mobile-section-title">DISCOVER YOUR STYLE</h2>
      </div>

      {/* Horizontal Touch Scrollable Category Cards */}
      <div className="mobile-categories-scroll">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            to={`/shop?category=${encodeURIComponent(cat.categoryQuery)}`}
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

export default MobileCategories;
