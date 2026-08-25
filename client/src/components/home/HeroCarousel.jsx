import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getHeroSlides } from '../../services/api';
import './HeroCarousel.css';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

const DEFAULT_HERO_SLIDES = [
  {
    id: 'default-1',
    subtitle: "PREMIUM MEN'S WEAR",
    title: "OWN YOUR\nSTYLE",
    desc: "Discover premium menswear crafted for confidence, comfort and timeless style.",
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1920&auto=format&fit=crop',
    ctaPrimary: "SHOP NOW",
    ctaPrimaryLink: "/shop",
    ctaSecondary: "EXPLORE LOOKBOOK",
    ctaSecondaryLink: "/lookbook",
    badge: "NEW SEASON '26"
  },
  {
    id: 'default-2',
    subtitle: "THE LUXURY COLLECTION",
    title: "UNMATCHED\nELEGANCE",
    desc: "Experience meticulously tailored luxury shirts and Italian-cut suits.",
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1920&auto=format&fit=crop',
    ctaPrimary: "SHOP LUXURY",
    ctaPrimaryLink: "/shop?category=Shirts",
    ctaSecondary: "VIEW COMBOS",
    ctaSecondaryLink: "/combos",
    badge: "EXCLUSIVE DROP"
  },
  {
    id: 'default-3',
    subtitle: "URBAN ESSENTIALS",
    title: "ELEVATED\nCASUALS",
    desc: "Heavyweight tees, structured cargo trousers and minimalist streetwear.",
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1920&auto=format&fit=crop',
    ctaPrimary: "EXPLORE CASUALS",
    ctaPrimaryLink: "/shop?category=T-Shirts",
    ctaSecondary: "VIEW ALL",
    ctaSecondaryLink: "/shop",
    badge: "BESTSELLERS"
  }
];

// Preload critical image for LCP
const preloadImage = (src) => {
  if (!src || typeof window === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
};

const getOptimizedImageUrl = (url) => url || '';

const HeroCarousel = () => {
  const [slides, setSlides] = useState(DEFAULT_HERO_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const swiperRef = useRef(null);
  const preloadedImages = useRef(new Set());

  const fetchSlides = useCallback(async () => {
    try {
      const res = await getHeroSlides();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data
          .filter(slide => slide.is_active !== false)
          .map((slide, idx) => {
            const rawImg = slide.image_url || slide.image;
            const validImg = (rawImg && rawImg.length > 10) 
              ? rawImg 
              : (DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length]?.image || '');

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
    } finally {
      setIsLoaded(true);
    }
  }, []);

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
  }, [fetchSlides]);

  // Preload first slide image immediately for LCP
  useEffect(() => {
    if (slides.length > 0 && slides[0].image) {
      preloadImage(slides[0].image);
      preloadedImages.current.add(slides[0].image);
    }
  }, [slides]);

  // Preload next slide on interaction
  const preloadNextSlide = useCallback((currentIndex) => {
    const nextIndex = (currentIndex + 1) % slides.length;
    if (slides[nextIndex]?.image && !preloadedImages.current.has(slides[nextIndex].image)) {
      preloadImage(slides[nextIndex].image);
      preloadedImages.current.add(slides[nextIndex].image);
    }
  }, [slides]);

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

  // Render slide with optimized image loading
  const renderSlide = (slide, idx) => {
    const isFirstSlide = idx === 0;
    const optimizedImage = getOptimizedImageUrl(slide.image, { width: 1920, quality: 82 });
    
    return (
      <SwiperSlide key={slide.id || idx}>
        <div className="hero-slide-item">
          {/* Background Image - Optimized for LCP */}
          {slide.image ? (
            <img 
              src={optimizedImage}
              alt={slide.title || 'ORDERLY Menswear'}
              className="hero-bg-img"
              // Critical LCP optimizations
              fetchPriority={isFirstSlide ? 'high' : 'low'}
              loading={isFirstSlide ? 'eager' : 'lazy'}
              // Explicit dimensions to prevent layout shift
              width={1920}
              height={1080}
              // Decode asynchronously for non-first slides
              decoding={isFirstSlide ? 'sync' : 'async'}
              onLoad={() => preloadNextSlide(idx)}
            />
          ) : (
            <div className="orderly-hero-fallback" aria-hidden="true">ORDERLY</div>
          )}

          {/* Subtle Cinematic Vignette Overlay */}
          <div className="hero-dark-overlay" aria-hidden="true" />

          {/* Content Box */}
          <div className="container hero-content-container">
            <div className="hero-text-wrapper">
              {/* Small Eyebrow Label with Red Line */}
              <div className="hero-eyebrow-label">
                <span className="hero-red-dash" aria-hidden="true">—</span>
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
                <Link 
                  to={slide.ctaPrimaryLink || '/shop'} 
                  className="btn-hero-solid-red"
                  // Preload shop page on hover
                  onMouseEnter={() => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = slide.ctaPrimaryLink || '/shop';
                    document.head.appendChild(link);
                  }}
                >
                  {slide.ctaPrimary || 'SHOP NOW'}
                </Link>
                <Link 
                  to={slide.ctaSecondaryLink || '/shop'} 
                  className="btn-hero-outline"
                  onMouseEnter={() => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = slide.ctaSecondaryLink || '/shop';
                    document.head.appendChild(link);
                  }}
                >
                  {slide.ctaSecondary || 'EXPLORE COLLECTIONS'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SwiperSlide>
    );
  };

  // Show skeleton while loading
  if (!isLoaded) {
    return (
      <section className="orderly-hero-section" aria-hidden="true">
        <div className="hero-skeleton">
          <div className="skeleton-slide">
            <div className="skeleton-overlay" />
            <div className="container">
              <div className="hero-text-wrapper">
                <div className="skeleton-eyebrow" />
                <div className="skeleton-title-line-1" />
                <div className="skeleton-title-line-2" />
                <div className="skeleton-desc" />
                <div className="skeleton-buttons">
                  <div className="skeleton-btn" />
                  <div className="skeleton-btn" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="orderly-hero-section" role="region" aria-label="Featured Collections">
      {/* Preconnect to image domains */}
      <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      
      <div className="orderly-hero-carousel position-relative">
        <Swiper
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          onSlideChange={(swiper) => {
            const newIndex = swiper.realIndex;
            setActiveIndex(newIndex);
            preloadNextSlide(newIndex);
          }}
          modules={[Autoplay, EffectFade, Navigation, A11y]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={800}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          loop={slides.length > 1}
          className="hero-swiper"
          // Accessibility
          a11y={{
            enabled: true,
            prevSlideMessage: 'Previous slide',
            nextSlideMessage: 'Next slide',
            firstSlideMessage: 'This is the first slide',
            lastSlideMessage: 'This is the last slide',
            paginationBulletMessage: 'Go to slide {{index}}'
          }}
        >
          {slides.map(renderSlide)}
        </Swiper>

        {/* Slide Counter / Indicators Bottom Left */}
        {slides.length > 1 && (
          <div className="hero-slide-indicators" role="tablist" aria-label="Slide navigation">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={activeIndex === i}
                aria-label={`Go to slide ${i + 1}`}
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
              <FiChevronLeft aria-hidden="true" />
            </button>
            <button 
              type="button" 
              className="custom-hero-arrow custom-hero-next" 
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next Slide"
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroCarousel;