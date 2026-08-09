import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiTruck, FiRotateCcw, FiShield, FiHeadphones } from 'react-icons/fi';
import { getHeroSlides } from '../../services/api';
import heroAsset from '../../assets/hero.png';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './HeroCarousel.css';

const DEFAULT_HERO_SLIDES = [
  {
    id: 'default-1',
    subtitle: "PREMIUM MEN'S WEAR",
    title: "OWN YOUR\nSTYLE",
    desc: "Discover premium menswear crafted for confidence, comfort and timeless style.",
    image: heroAsset || "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1600&auto=format&fit=crop",
    ctaPrimary: "SHOP NOW",
    ctaPrimaryLink: "/shop",
    ctaSecondary: "EXPLORE COLLECTIONS",
    ctaSecondaryLink: "/shop"
  },
  {
    id: 'default-2',
    subtitle: "NEW SEASON CAPSULE",
    title: "ELEVATE YOUR\nLOOK",
    desc: "Bespoke Italian tailoring & contemporary streetwear designed for the modern gentleman.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
    ctaPrimary: "EXPLORE NOW",
    ctaPrimaryLink: "/shop",
    ctaSecondary: "VIEW COMBOS",
    ctaSecondaryLink: "/combos"
  }
];

const HeroCarousel = () => {
  const [slides, setSlides] = useState(DEFAULT_HERO_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);

  const fetchSlides = async () => {
    try {
      const res = await getHeroSlides();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data
          .filter(slide => slide.is_active !== false)
          .map((slide, idx) => {
            const rawImg = slide.image_url || slide.image;
            const validImg = (rawImg && rawImg.length > 10) 
              ? rawImg 
              : (DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length]?.image || "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1600&auto=format&fit=crop");

            return {
              id: slide.id,
              title: slide.title,
              subtitle: slide.subtitle,
              desc: slide.description || slide.desc,
              image: validImg,
              ctaPrimary: slide.cta_primary_text || 'SHOP NOW',
              ctaPrimaryLink: slide.cta_primary_link || '/shop',
              ctaSecondary: slide.cta_secondary_text || 'EXPLORE COLLECTIONS',
              ctaSecondaryLink: slide.cta_secondary_link || '/shop',
              badge: slide.badge_text || slide.badge
            };
          });
        setSlides(formatted.length > 0 ? formatted : DEFAULT_HERO_SLIDES);
      } else {
        setSlides(DEFAULT_HERO_SLIDES);
      }
    } catch (err) {
      setSlides(DEFAULT_HERO_SLIDES);
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

  const renderTitleWithRedAccent = (titleText) => {
    if (!titleText) return null;
    if (titleText.includes('\n')) {
      const lines = titleText.split('\n');
      return (
        <>
          <span className="title-white-line">{lines[0]}</span>
          <span className="title-red-line">{lines[1]}</span>
        </>
      );
    }
    const words = titleText.trim().split(' ');
    if (words.length <= 1) return <span className="title-red-line">{titleText}</span>;
    const lastWord = words.pop();
    return (
      <>
        <span className="title-white-line">{words.join(' ')}</span>{' '}
        <span className="title-red-line">{lastWord}</span>
      </>
    );
  };

  return (
    <section className="orderly-hero-section">
      <div className="orderly-hero-carousel position-relative">
        <Swiper
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          modules={[Autoplay, EffectFade, Pagination, Navigation]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={900}
          autoplay={{
            delay: 5500,
            disableOnInteraction: false,
            pauseOnMouseEnter: false
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

                {/* Dark Cinematic Vignette Overlay */}
                <div className="hero-dark-overlay" />
                
                {/* Red Brush Accent Overlay */}
                <div className="hero-red-brush-accent" />

                {/* Content Box */}
                <div className="container hero-content-container">
                  <div className="hero-text-wrapper">
                    {/* Small Eyebrow Label with Red Line */}
                    <div className="hero-eyebrow-label">
                      <span className="hero-red-dash">—</span>
                      <span className="hero-subtitle-text">{slide.subtitle || "PREMIUM MEN'S WEAR"}</span>
                    </div>

                    {/* Headline */}
                    <h1 className="hero-title">
                      {renderTitleWithRedAccent(slide.title || "OWN YOUR\nSTYLE")}
                    </h1>

                    {/* Supporting Text */}
                    <p className="hero-desc">
                      {slide.desc || "Discover premium menswear crafted for confidence, comfort and timeless style."}
                    </p>
                    
                    {/* Buttons */}
                    <div className="hero-btn-group">
                      <Link to={slide.ctaPrimaryLink || '/shop'} className="btn-hero-solid-red">
                        {slide.ctaPrimary || 'SHOP NOW'}
                      </Link>
                      <Link to={slide.ctaSecondaryLink || '/shop'} className="btn-hero-outline">
                        {slide.ctaSecondary || 'EXPLORE COLLECTIONS'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Slide Counter / Indicators Bottom Left */}
        {slides.length > 1 && (
          <div className="hero-slide-indicators">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`indicator-num-btn ${activeIndex === i ? 'active' : ''}`}
                onClick={() => swiperRef.current?.slideToLoop(i)}
              >
                0{i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Swiper Arrow Buttons */}
        {slides.length > 1 && (
          <>
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
          </>
        )}
      </div>

      {/* Trust & Service Features Strip (Immediately Below Hero) */}
      <div className="hero-trust-features-strip">
        <div className="container-fluid px-lg-5">
          <div className="trust-features-grid">
            <div className="trust-feature-item">
              <div className="trust-icon-box">
                <FiTruck className="trust-icon-red" />
              </div>
              <div className="trust-text-box">
                <h4 className="trust-item-title">FREE SHIPPING</h4>
                <p className="trust-item-sub">On orders above ₹1499</p>
              </div>
            </div>

            <div className="trust-feature-item">
              <div className="trust-icon-box">
                <FiRotateCcw className="trust-icon-red" />
              </div>
              <div className="trust-text-box">
                <h4 className="trust-item-title">EASY RETURNS</h4>
                <p className="trust-item-sub">Within 7 days</p>
              </div>
            </div>

            <div className="trust-feature-item">
              <div className="trust-icon-box">
                <FiShield className="trust-icon-red" />
              </div>
              <div className="trust-text-box">
                <h4 className="trust-item-title">PREMIUM QUALITY</h4>
                <p className="trust-item-sub">100% Original Products</p>
              </div>
            </div>

            <div className="trust-feature-item">
              <div className="trust-icon-box">
                <FiHeadphones className="trust-icon-red" />
              </div>
              <div className="trust-text-box">
                <h4 className="trust-item-title">24/7 SUPPORT</h4>
                <p className="trust-item-sub">We're here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
