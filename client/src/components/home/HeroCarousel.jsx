import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
import { FiArrowRight, FiCompass, FiZap, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getHeroSlides } from '../../services/api';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './HeroCarousel.css';

const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const swiperRef = useRef(null);

  const fetchSlides = async () => {
    // Fetch slides managed from the Admin CMS (DB) — no static fallbacks.
    try {
      const res = await getHeroSlides();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data
          .filter(slide => slide.is_active !== false)
          .map((slide) => ({
            id: slide.id,
            title: slide.title,
            subtitle: slide.subtitle,
            desc: slide.description || slide.desc,
            image: slide.image_url || slide.image,
            ctaPrimary: slide.cta_primary_text,
            ctaPrimaryLink: slide.cta_primary_link,
            ctaSecondary: slide.cta_secondary_text,
            ctaSecondaryLink: slide.cta_secondary_link,
            badge: slide.badge_text || slide.badge
          }));
        setSlides(formatted);
      } else {
        setSlides([]);
      }
    } catch (err) {
      console.warn('Failed to fetch hero slides:', err);
    }
  };

  useEffect(() => {
    fetchSlides();

    const handleSlidesUpdated = () => {
      fetchSlides();
    };
    window.addEventListener('orderly_hero_slides_updated', handleSlidesUpdated);
    window.addEventListener('orderly_settings_updated', handleSlidesUpdated);
    window.addEventListener('storage', handleSlidesUpdated);
    return () => {
      window.removeEventListener('orderly_hero_slides_updated', handleSlidesUpdated);
      window.removeEventListener('orderly_settings_updated', handleSlidesUpdated);
      window.removeEventListener('storage', handleSlidesUpdated);
    };
  }, []);

  if (slides.length === 0) return null;

  return (
    <div className="orderly-hero-carousel position-relative">
      <Swiper
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={800}
        autoplay={{
          delay: 4500,
          disableOnInteraction: false,
          pauseOnMouseEnter: false
        }}
        pagination={{
          clickable: true,
          el: '.custom-hero-pagination-dots'
        }}
        loop={slides.length > 1}
        className="hero-swiper"
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={slide.id || idx}>
            <div className="hero-slide-item">
              {/* Background Image */}
              <img 
                src={slide.image} 
                alt={slide.title || 'ORDERLY Menswear'} 
                className="hero-bg-img" 
              />

              {/* Dark Gradient Overlay */}
              <div className="hero-dark-overlay" />
              
              {/* High Contrast Visible Content Box */}
              <div className="container hero-content-container">
                <div className="hero-text-wrapper">
                  {slide.badge && (
                    <span className="trendy-hero-badge">
                      <FiZap /> {slide.badge}
                    </span>
                  )}

                  {slide.subtitle && <span className="hero-subtitle">{slide.subtitle}</span>}
                  {slide.title && <h1 className="hero-title">{slide.title}</h1>}
                  {slide.desc && <p className="hero-desc">{slide.desc}</p>}
                  
                  <div className="hero-btn-group">
                    <Link to={slide.ctaPrimaryLink || '/shop'} className="btn-primary-orderly">
                      {slide.ctaPrimary || 'Discover ORDERLY'} <FiArrowRight />
                    </Link>
                    <Link to={slide.ctaSecondaryLink || '/shop'} className="btn-outline-orderly">
                      <FiCompass /> {slide.ctaSecondary || 'Explore Shirts'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Prominent Visible Navigation Arrows */}
      <button 
        type="button" 
        className="custom-hero-arrow custom-hero-prev" 
        onClick={() => swiperRef.current?.slidePrev()}
        aria-label="Previous Slide"
      >
        <FiChevronLeft />
      </button>
      <button 
        type="button" 
        className="custom-hero-arrow custom-hero-next" 
        onClick={() => swiperRef.current?.slideNext()}
        aria-label="Next Slide"
      >
        <FiChevronRight />
      </button>

      {/* Prominent Visible 3-Dots Pagination */}
      <div className="custom-hero-pagination-dots" />
    </div>
  );
};

export default HeroCarousel;
