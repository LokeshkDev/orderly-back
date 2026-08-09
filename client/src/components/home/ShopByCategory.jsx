import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../services/api';
import './ShopByCategory.css';

const DEFAULT_CATEGORIES = [
  {
    name: 'SHIRTS',
    sub: 'Everyday Luxury Linen & Oxford',
    categoryQuery: 'Shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'DENIM & BOTTOMS',
    sub: 'Sharp & Tailored Fit',
    categoryQuery: 'Denim',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'POLOS & TEES',
    sub: 'Urban & Heavyweight Streetwear',
    categoryQuery: 'Tees',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'FORMAL SUITS & BLAZERS',
    sub: 'Italian Tailored Precision',
    categoryQuery: 'Suits',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'HERITAGE & COMBOS',
    sub: 'Bespoke Coordinated Sets',
    categoryQuery: 'Ethnic',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800&auto=format&fit=crop'
  }
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800&auto=format&fit=crop'
];

const ShopByCategory = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const [categoriesData, setCategoriesData] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter(c => c.is_active !== false);
          const mapped = active.map((cat, idx) => ({
            name: (cat.name || '').toUpperCase(),
            sub: cat.description || cat.sub || DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length]?.sub || 'Premium Collection',
            categoryQuery: cat.slug || cat.name,
            image: (cat.image && cat.image.length > 10) ? cat.image : FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]
          }));
          setCategoriesData(mapped.length > 0 ? mapped : DEFAULT_CATEGORIES);
        } else {
          setCategoriesData(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        setCategoriesData(DEFAULT_CATEGORIES);
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

  const handleCardClick = (categoryQuery) => {
    navigate(`/shop?category=${encodeURIComponent(categoryQuery)}`);
  };

  return (
    <section id="collections" className="shop-by-category-section py-5">
      <div className="container-fluid px-lg-5">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="category-eyebrow-red">
            {subtitle || 'EXPLORE COLLECTIONS'}
          </span>
          <h2 className="category-main-heading">
            {title || 'DISCOVER YOUR STYLE'}
          </h2>
        </div>

        {/* 5-Column Fashion Cards Grid */}
        <div className="category-cards-grid">
          {categoriesData.slice(0, 5).map((cat, idx) => {
            const displayImg = (cat.image && cat.image.length > 10) 
              ? cat.image 
              : FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
            return (
              <div 
                key={idx}
                className="fashion-category-card"
                onClick={() => handleCardClick(cat.categoryQuery)}
              >
                {/* 100% Full Card Background Cover Image */}
                <img 
                  src={displayImg} 
                  alt={cat.name}
                  className="fashion-cat-img"
                  onError={(e) => {
                    e.target.src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
                  }}
                />
                
                {/* Gradient Dark Overlay */}
                <div className="fashion-cat-overlay" />
                <div className="fashion-cat-red-accent" />

                {/* Bottom Aligned Text Content */}
                <div className="fashion-cat-content">
                  <h3 className="fashion-cat-title">{cat.name}</h3>
                  <p className="fashion-cat-sub">{cat.sub}</p>
                  <span className="fashion-cat-link">
                    SHOP NOW <span className="cat-arrow">&rarr;</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
