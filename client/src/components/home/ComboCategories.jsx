import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { getComboCategories } from '../../services/api';
import { HomeCategoryGridSkeleton } from '../common/Skeleton';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './ShopByCategory.css';

const DEFAULT_COMBO_CATEGORIES = [
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

const ComboCategories = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categoriesData, setCategoriesData] = useState([]);

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
            image: (cat.image && cat.image.length > 10) ? cat.image : DEFAULT_COMBO_CATEGORIES[idx % DEFAULT_COMBO_CATEGORIES.length]?.image
          }));
          setCategoriesData(mapped.length > 0 ? mapped : DEFAULT_COMBO_CATEGORIES);
        } else {
          setCategoriesData(DEFAULT_COMBO_CATEGORIES);
        }
      } catch {
        setCategoriesData(DEFAULT_COMBO_CATEGORIES);
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

        {/* 3 Cards Per Row Swiper Carousel */}
        {loading ? (
          <HomeCategoryGridSkeleton />
        ) : (
          <div className="combo-categories-carousel-wrapper position-relative">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={3}
              breakpoints={{
                320: { slidesPerView: 1.2, spaceBetween: 12 },
                480: { slidesPerView: 1.8, spaceBetween: 14 },
                768: { slidesPerView: 2.3, spaceBetween: 16 },
                1024: { slidesPerView: 3, spaceBetween: 20 }
              }}
              autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              pagination={{ clickable: true, el: '.combo-cat-pagination' }}
              className="combo-categories-swiper"
            >
              {categoriesData.map((cat, idx) => {
                return (
                  <SwiperSlide key={idx} className="combo-cat-swiper-slide">
                    <div
                      className="fashion-category-card"
                      onClick={() => handleCardClick(cat.categoryQuery)}
                    >
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
                          VIEW SETS <span className="cat-arrow">&rarr;</span>
                        </span>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            <div className="combo-cat-pagination d-flex justify-content-center gap-2 mt-4" />
          </div>
        )}
      </div>
    </section>
  );
};

export default ComboCategories;