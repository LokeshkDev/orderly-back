import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../services/api';

const DEFAULT_MOBILE_CATS = [
  {
    name: 'CASUAL WEAR',
    sub: 'Everyday Comfort',
    categoryQuery: 'Casual Shirts',
    image: ''
  },
  {
    name: 'FORMAL WEAR',
    sub: 'Sharp & Sophisticated',
    categoryQuery: 'Formal Shirts',
    image: ''
  },
  {
    name: 'STREET WEAR',
    sub: 'Urban & Trendy',
    categoryQuery: 'Tees',
    image: ''
  },
  {
    name: 'SPORT WEAR',
    sub: 'Performance First',
    categoryQuery: 'Activewear',
    image: ''
  },
  {
    name: 'ETHNIC WEAR',
    sub: 'Tradition Reimagined',
    categoryQuery: 'Ethnic',
    image: ''
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
