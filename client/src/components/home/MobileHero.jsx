import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { getHeroSlides } from '../../services/api';
import 'swiper/css';
import 'swiper/css/pagination';

const DEFAULT_MOBILE_SLIDES = [
  {
    id: 'mob-1',
    subtitle: "— PREMIUM MEN'S WEAR",
    title: "OWN YOUR\nSTYLE",
    desc: "Premium menswear crafted for confidence, comfort and timeless style.",
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    ctaPrimary: "SHOP NOW",
    ctaPrimaryLink: "/shop",
    ctaSecondary: "EXPLORE COLLECTIONS",
    ctaSecondaryLink: "/shop"
  },
  {
    id: 'mob-2',
    subtitle: "— NEW SEASON CAPSULE",
    title: "ROYAL LUXURY\nCOMBOS",
    desc: "Bespoke Italian tailoring & contemporary streetwear designed for the modern gentleman.",
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
    ctaPrimary: "EXPLORE COMBOS",
    ctaPrimaryLink: "/combos",
    ctaSecondary: "SHOP NOW",
    ctaSecondaryLink: "/shop"
  }
];

const hasText = (t) => Boolean(t && typeof t === 'string' && t.trim().length > 0);

const MobileHero = () => {
  const [slides, setSlides] = useState(DEFAULT_MOBILE_SLIDES);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await getHeroSlides();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data
            .filter(slide => slide.is_active !== false)
            .map((slide) => {
              const rawImg = slide.mobile_image_url || slide.image_url || slide.image;
              return {
                id: slide.id,
                subtitle: slide.subtitle || '',
                title: slide.title !== undefined ? slide.title : '',
                desc: (slide.description !== undefined ? slide.description : slide.desc) || '',
                image: rawImg,
                ctaPrimary: slide.cta_primary_text || "SHOP NOW",
                ctaPrimaryLink: slide.cta_primary_link || "/shop",
                ctaSecondary: slide.cta_secondary_text || "EXPLORE COLLECTIONS",
                ctaSecondaryLink: slide.cta_secondary_link || "/shop"
              };
            });
          if (formatted.length > 0) {
            setSlides(formatted);
          }
        }
      } catch {}
    };

    fetchSlides();

    const handleUpdated = () => fetchSlides();
    window.addEventListener('orderly_homepage_sections_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('orderly_homepage_sections_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  return (
    <section className="mobile-hero-section mobile-only">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={slides.length > 1}
        className="mobile-hero-swiper"
      >
        {slides.map((slide, sIdx) => {
          const hasTitle = hasText(slide.title);
          const hasDesc = hasText(slide.desc);
          const hasSubtitle = hasText(slide.subtitle);
          const showOverlay = hasTitle || hasDesc;
          const hasPrimaryCta = hasText(slide.ctaPrimary);
          const hasSecondaryCta = hasText(slide.ctaSecondary);
          const hasButtons = hasPrimaryCta || hasSecondaryCta;
          const titleParts = hasTitle ? slide.title.split('\n') : [];
          const isFirst = sIdx === 0;

          return (
            <SwiperSlide key={slide.id || sIdx}>
              <div className={`mobile-hero-card ${!showOverlay ? 'no-overlay' : ''}`}>
                {slide.image ? (
                  <img 
                    src={slide.image} 
                    alt={slide.title || 'ORDERLY Menswear'} 
                    className="mobile-hero-img"
                    width="600"
                    height="450"
                    loading={isFirst ? "eager" : "lazy"}
                    fetchPriority={isFirst ? "high" : "low"}
                    decoding={isFirst ? "sync" : "async"}
                  />
                ) : (
                  <div className="orderly-hero-fallback">ORDERLY</div>
                )}
                
                {/* Overlay MUST only be shown if there is text present in either the title or description */}
                {showOverlay && (
                  <div className="mobile-hero-overlay" />
                )}

                <div className="mobile-hero-content">
                  {showOverlay && hasSubtitle && (
                    <span className="mobile-hero-eyebrow">{slide.subtitle}</span>
                  )}
                  
                  {hasTitle && (
                    <h1 className="mobile-hero-title">
                      {titleParts[0]}
                      {titleParts[1] && (
                        <>
                          <br />
                          <span className="text-red-accent">{titleParts[1]}</span>
                        </>
                      )}
                    </h1>
                  )}

                  {hasDesc && (
                    <p className="mobile-hero-desc">{slide.desc}</p>
                  )}

                  {/* Buttons remain visible regardless of overlay state */}
                  {hasButtons && (
                    <div className="mobile-hero-btns">
                      {hasPrimaryCta && (
                        <Link to={slide.ctaPrimaryLink || '/shop'} className="btn-mobile-red-solid">
                          {slide.ctaPrimary}
                        </Link>
                      )}

                      {hasSecondaryCta && (
                        <Link to={slide.ctaSecondaryLink || '/shop'} className="btn-mobile-outline">
                          {slide.ctaSecondary}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
};

export default MobileHero;
