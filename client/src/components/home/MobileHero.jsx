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
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop',
    ctaPrimary: "EXPLORE COMBOS",
    ctaPrimaryLink: "/combos",
    ctaSecondary: "SHOP NOW",
    ctaSecondaryLink: "/shop"
  }
];

const MobileHero = () => {
  const [slides, setSlides] = useState(DEFAULT_MOBILE_SLIDES);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await getHeroSlides();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data
            .filter(slide => slide.is_active !== false)
            .map((slide, idx) => {
              const rawImg = slide.mobile_image_url || slide.image_url || slide.image;
              const validImg = (rawImg && rawImg.length > 10)
                ? rawImg
                : (DEFAULT_MOBILE_SLIDES[idx % DEFAULT_MOBILE_SLIDES.length]?.image || '');

              return {
                id: slide.id,
                subtitle: slide.subtitle || "— PREMIUM MEN'S WEAR",
                title: slide.title || "OWN YOUR\nSTYLE",
                desc: slide.description || slide.desc || "Premium menswear crafted for confidence, comfort and timeless style.",
                image: validImg,
                ctaPrimary: slide.cta_primary_text || "SHOP NOW",
                ctaPrimaryLink: slide.cta_primary_link || "/shop",
                ctaSecondary: slide.cta_secondary_text || "EXPLORE COLLECTIONS",
                ctaSecondaryLink: slide.cta_secondary_link || "/shop"
              };
            });
          setSlides(formatted.length > 0 ? formatted : DEFAULT_MOBILE_SLIDES);
        } else {
          setSlides(DEFAULT_MOBILE_SLIDES);
        }
      } catch (err) {
        setSlides(DEFAULT_MOBILE_SLIDES);
      }
    };
    fetchSlides();

    window.addEventListener('orderly_hero_slides_updated', fetchSlides);
    window.addEventListener('storage', fetchSlides);
    return () => {
      window.removeEventListener('orderly_hero_slides_updated', fetchSlides);
      window.removeEventListener('storage', fetchSlides);
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
        {slides.map((slide) => {
          const titleParts = (slide.title || 'OWN YOUR\nSTYLE').split('\n');
          return (
            <SwiperSlide key={slide.id}>
              <div className="mobile-hero-card">
                {slide.image ? (
                  <img src={slide.image} alt={slide.title} className="mobile-hero-img" />
                ) : (
                  <div className="orderly-hero-fallback">ORDERLY</div>
                )}
                <div className="mobile-hero-overlay" />

                <div className="mobile-hero-content">
                  <span className="mobile-hero-eyebrow">{slide.subtitle}</span>
                  
                  <h1 className="mobile-hero-title">
                    {titleParts[0]}
                    {titleParts[1] && (
                      <>
                        <br />
                        <span className="text-red-accent">{titleParts[1]}</span>
                      </>
                    )}
                  </h1>

                  <p className="mobile-hero-desc">{slide.desc}</p>

                  <div className="mobile-hero-btns">
                    <Link to={slide.ctaPrimaryLink || '/shop'} className="btn-mobile-red-solid">
                      {slide.ctaPrimary}
                    </Link>

                    <Link to={slide.ctaSecondaryLink || '/shop'} className="btn-mobile-outline">
                      {slide.ctaSecondary}
                    </Link>
                  </div>
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
