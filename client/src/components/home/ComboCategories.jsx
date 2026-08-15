import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComboCategories } from '../../services/api';
import './ShopByCategory.css';

const DEFAULT_COMBO_CATEGORIES = [
  {
    name: 'FORMAL SUITS',
    sub: 'Tailored 2 & 3-Piece Sets',
    categoryQuery: 'formal',
    image: ''
  },
  {
    name: 'CASUAL SETS',
    sub: 'Relaxed Everyday Ensembles',
    categoryQuery: 'casual',
    image: ''
  },
  {
    name: 'TROUSER + SHIRT',
    sub: 'Smart Coordinated Looks',
    categoryQuery: 'trouser',
    image: ''
  },
  {
    name: 'DENIM SETS',
    sub: 'Sharp & Tailored Pairings',
    categoryQuery: 'denim',
    image: ''
  },
  {
    name: 'SHOES & ACCESSORIES',
    sub: 'Complete The Look',
    categoryQuery: 'shoe',
    image: ''
  }
];

const ComboCategories = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const [categoriesData, setCategoriesData] = useState(DEFAULT_COMBO_CATEGORIES);

  useEffect(() => {
    const loadComboCategories = async () => {
      try {
        const res = await getComboCategories();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter(c => c.is_active !== false);
          const mapped = active.map((cat, idx) => ({
            name: (cat.name || '').toUpperCase(),
            sub: cat.description || cat.sub || DEFAULT_COMBO_CATEGORIES[idx % DEFAULT_COMBO_CATEGORIES.length]?.sub || 'Curated Combo Set',
            categoryQuery: cat.slug || cat.name,
            image: (cat.image && cat.image.length > 10) ? cat.image : ''
          }));
          setCategoriesData(mapped.length > 0 ? mapped : DEFAULT_COMBO_CATEGORIES);
        } else {
          setCategoriesData(DEFAULT_COMBO_CATEGORIES);
        }
      } catch (err) {
        setCategoriesData(DEFAULT_COMBO_CATEGORIES);
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

  const handleCardClick = (categoryQuery) => {
    navigate(`/combos?category=${encodeURIComponent(categoryQuery)}`);
  };

  return (
    <section id="combo-collections" className="shop-by-category-section py-5">
      <div className="container-fluid px-lg-5">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="category-eyebrow-red">
            {subtitle || 'CURATED COMBO SETS'}
          </span>
          <h2 className="category-main-heading">
            {title || 'EXPLORE COMBO CATEGORIES'}
          </h2>
        </div>

        {/* 5-Column Fashion Cards Grid */}
        <div className="category-cards-grid">
          {categoriesData.slice(0, 5).map((cat, idx) => {
            return (
              <div
                key={idx}
                className="fashion-category-card"
                onClick={() => handleCardClick(cat.categoryQuery)}
              >
                {cat.image && cat.image.length > 0 ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="fashion-cat-img"
                  />
                ) : (
                  <div className="fashion-cat-img orderly-img-fallback">ORDERLY</div>
                )}

                {/* Gradient Dark Overlay */}
                <div className="fashion-cat-overlay" />
                <div className="fashion-cat-red-accent" />

                {/* Bottom Aligned Text Content */}
                <div className="fashion-cat-content">
                  <h3 className="fashion-cat-title">{cat.name}</h3>
                  <p className="fashion-cat-sub">{cat.sub}</p>
                  <span className="fashion-cat-link">
                    VIEW SETS <span className="cat-arrow">&rarr;</span>
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

export default ComboCategories;