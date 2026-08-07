import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../services/api';
import './ShopByCategory.css';

const ShopByCategory = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);

  // Fetch categories managed from the Admin CMS (DB) — no static fallbacks.
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter(c => c.is_active !== false);
          const mapped = active.map(cat => ({
            name: cat.name,
            categoryQuery: cat.slug || cat.name,
            image: cat.image
          }));
          setCategoriesData(mapped);
        } else {
          setCategoriesData([]);
        }
      } catch (err) {
        console.warn('Failed to load categories from API:', err.message);
      }
    };
    loadCategories();

    window.addEventListener('orderly_categories_updated', loadCategories);
    window.addEventListener('storage', loadCategories);
    window.addEventListener('focus', loadCategories);
    return () => {
      window.removeEventListener('orderly_categories_updated', loadCategories);
      window.removeEventListener('storage', loadCategories);
      window.removeEventListener('focus', loadCategories);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setIsDragging(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    // Delay resetting dragging to prevent click navigation when dragging
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setIsDragging(true);
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCardClick = (categoryQuery) => {
    if (!isDragging) {
      navigate(`/shop?category=${encodeURIComponent(categoryQuery)}`);
    }
  };

  return (
    <section className="shop-by-category-section py-5">
      <div className="container-fluid px-lg-5">
        <div className="text-center mb-4">
          <span className="category-section-subtitle">{subtitle || 'EXPLORE APPAREL'}</span>
          <h2 className="category-section-title">{title || 'Shop By Category'}</h2>
        </div>

        {/* Drag-to-Swipe Container (No visible scrollbar) */}
        <div 
          ref={scrollRef}
          className={`category-circles-scroll-wrapper ${isMouseDown ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div className="category-circles-row">
            {categoriesData.map((cat, idx) => (
              <div 
                key={idx}
                className="category-circle-card"
                onClick={() => handleCardClick(cat.categoryQuery)}
              >
                <div className="circle-image-ring">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="circle-img" draggable={false} />
                  ) : (
                    <span className="circle-img circle-img-placeholder">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <span className="circle-label">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
