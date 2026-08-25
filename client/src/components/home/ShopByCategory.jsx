import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../services/api';
import { HomeCategoryGridSkeleton } from '../common/Skeleton';
import './ShopByCategory.css';

const DEFAULT_CATEGORIES = [
  {
    name: 'SHIRTS',
    sub: 'Everyday Luxury Linen & Oxford',
    categoryQuery: 'Shirts',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop'
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
    categoryQuery: 'Tops & T-Shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'FORMAL SUITS & BLAZERS',
    sub: 'Italian Tailored Precision',
    categoryQuery: 'Blazers',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'TAILORED TROUSERS',
    sub: 'Smart Pleated & Chino Trousers',
    categoryQuery: 'Trousers',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop'
  }
];

const ShopByCategory = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categoriesData, setCategoriesData] = useState([]);

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
            image: (cat.image && cat.image.length > 10) ? cat.image : ''
          }));
          setCategoriesData(mapped.length > 0 ? mapped : DEFAULT_CATEGORIES);
        } else {
          setCategoriesData(DEFAULT_CATEGORIES);
        }
      } catch {
        setCategoriesData(DEFAULT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();

    const handleUpdated = () => loadCategories();
    window.addEventListener('orderly_categories_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('orderly_categories_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
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

        {/* 5-Column Fashion Cards Grid or Skeleton */}
        {loading ? (
          <HomeCategoryGridSkeleton />
        ) : (
          <div className="category-cards-grid">
            {categoriesData.slice(0, 5).map((cat, idx) => {
              return (
                <div 
                  key={idx}
                  className="fashion-category-card"
                  onClick={() => handleCardClick(cat.categoryQuery)}
                >
                  {/* 100% Full Card Background Cover Image */}
                  {cat.image && cat.image.length > 0 ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name}
                      className="fashion-cat-img"
                      width="400"
                      height="550"
                      loading="lazy"
                      decoding="async"
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
                      SHOP NOW <span className="cat-arrow">&rarr;</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopByCategory;
