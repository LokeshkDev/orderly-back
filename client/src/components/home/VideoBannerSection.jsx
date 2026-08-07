import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FiPlay, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { getVideoFilms } from '../../services/api';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './VideoBannerSection.css';

const DEFAULT_VIDEO_FILMS = [
  {
    id: 1,
    title: 'Product Film',
    subtitle: 'Italian Tailoring & Craftsmanship',
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-black-jacket-41551-large.mp4'
  },
  {
    id: 2,
    title: 'Expert Review Highlights',
    subtitle: 'Selvedge Denim & Fit Analysis',
    thumbnail: 'https://images.unsplash.com/photo-1490578474895-699bc4e2cf59?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-model-posing-in-a-fashion-photoshoot-42847-large.mp4'
  },
  {
    id: 3,
    title: 'Introduction Film',
    subtitle: 'ORDERLY Brand Heritage',
    thumbnail: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-jacket-on-his-shoulder-42761-large.mp4'
  }
];

/**
 * Universal Video Embed Parser: Supports YouTube, Instagram Reels, Facebook Videos, Vimeo, and Direct Uploaded MP4s.
 */
const getEmbedInfo = (url = '') => {
  if (!url) return { type: 'mp4', src: '' };
  const str = url.trim();

  // 1. YouTube (watch?v=, shorts/, youtu.be/, embed/)
  const ytMatch = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&enablejsapi=1`,
      isReel: false
    };
  }

  // 2. Instagram Reels / Posts / IGTV
  const instaMatch = str.match(/(?:instagram\.com|instagr\.am)\/(?:reel|p|tv)\/([a-zA-Z0-9_\-]+)/i);
  if (instaMatch && instaMatch[1]) {
    return {
      type: 'iframe',
      src: `https://www.instagram.com/p/${instaMatch[1]}/embed/`,
      isReel: true
    };
  }

  // 3. Facebook Video / Reel
  if (str.includes('facebook.com') || str.includes('fb.watch')) {
    return {
      type: 'iframe',
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(str)}&show_text=false&autoplay=true`,
      isReel: false
    };
  }

  // 4. Vimeo
  const vimeoMatch = str.match(/vimeo\.com\/(?:.*\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      isReel: false
    };
  }

  // 5. Generic external iframe URL if it contains 'embed' or 'player'
  if (str.includes('/embed') || str.includes('player.')) {
    return {
      type: 'iframe',
      src: str,
      isReel: false
    };
  }

  // 6. Direct MP4 / R2 Video Upload
  return {
    type: 'mp4',
    src: str,
    isReel: false
  };
};

const VideoBannerSection = ({ title, subtitle }) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [filmsList, setFilmsList] = useState(DEFAULT_VIDEO_FILMS);
  const swiperRef = useRef(null);

  useEffect(() => {
    const loadFilms = async () => {
      try {
        const apiData = await getVideoFilms();
        if (Array.isArray(apiData) && apiData.length > 0) {
          setFilmsList(apiData);
          return;
        }
      } catch (e) {}

      try {
        const saved = localStorage.getItem('orderly_video_films');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFilmsList(parsed);
            return;
          }
        }
      } catch (e) {}
    };
    loadFilms();

    window.addEventListener('orderly_video_films_updated', loadFilms);
    window.addEventListener('storage', loadFilms);
    window.addEventListener('focus', loadFilms);
    return () => {
      window.removeEventListener('orderly_video_films_updated', loadFilms);
      window.removeEventListener('storage', loadFilms);
      window.removeEventListener('focus', loadFilms);
    };
  }, []);

  const openVideoModal = (film) => {
    setActiveVideo(film);
  };

  const closeVideoModal = () => {
    setActiveVideo(null);
  };

  const totalFilms = filmsList.length;
  const isLoopable = totalFilms > 3;
  const embedData = activeVideo ? getEmbedInfo(activeVideo.videoUrl) : null;

  return (
    <section className="video-showcase-section py-5">
      <div className="container-fluid px-lg-5">
        {/* Section Header */}
        <div className="text-center mb-4">
          <span className="video-section-subtitle">
            {subtitle || "NOW IT'S A STATEMENT"}
          </span>
          <h2 className="video-section-title">
            {title || 'Campaign Films & Video Showcase'}
          </h2>
        </div>

        {totalFilms > 0 && (
          <div className="video-carousel-container position-relative px-md-5">
            {/* Custom Navigation Arrows */}
            {totalFilms > 1 && (
              <>
                <button 
                  type="button" 
                  className="video-nav-arrow video-nav-prev"
                  onClick={() => swiperRef.current?.slidePrev()}
                  aria-label="Previous Videos"
                >
                  <FiChevronLeft />
                </button>

                <button 
                  type="button" 
                  className="video-nav-arrow video-nav-next"
                  onClick={() => swiperRef.current?.slideNext()}
                  aria-label="Next Videos"
                >
                  <FiChevronRight />
                </button>
              </>
            )}

            <Swiper
              key={`films-swiper-${totalFilms}`}
              modules={[Navigation, Pagination, Autoplay]}
              onBeforeInit={(swiper) => {
                swiperRef.current = swiper;
              }}
              spaceBetween={24}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: Math.min(2, totalFilms), spaceBetween: 20 },
                992: { slidesPerView: Math.min(3, totalFilms), spaceBetween: 24 }
              }}
              loop={isLoopable}
              autoplay={totalFilms > 1 ? { delay: 6000, disableOnInteraction: false } : false}
              pagination={totalFilms > 1 ? { clickable: true, el: '.video-pagination-dots' } : false}
              className="video-cards-swiper"
            >
              {filmsList.map((film) => (
                <SwiperSlide key={film.id}>
                  <div 
                    className="video-showcase-card"
                    onClick={() => openVideoModal(film)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Thumbnail Container */}
                    <div className="video-thumb-wrapper">
                      <img 
                        src={film.thumbnail || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'} 
                        alt={film.title} 
                        className="video-thumb-img" 
                      />
                      <div className="video-thumb-overlay" />
                      
                      {/* Centered Circular Play Button */}
                      <div className="video-play-btn-wrapper">
                        <div className="video-play-circle">
                          <FiPlay className="video-play-icon" />
                        </div>
                      </div>
                    </div>

                    {/* Card Title Label Below */}
                    <div className="video-card-caption text-center mt-3">
                      <h3 className="video-card-title">{film.title}</h3>
                      {film.subtitle && (
                        <p className="video-card-sub text-muted extra-small mb-0">{film.subtitle}</p>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Pagination Dots Container */}
            {totalFilms > 1 && (
              <div className="video-pagination-dots d-flex justify-content-center gap-2 mt-4" />
            )}
          </div>
        )}
      </div>

      {/* Universal Video Lightbox Modal */}
      {activeVideo && embedData && (
        <div className="video-modal-backdrop" onClick={closeVideoModal}>
          <div 
            className={`video-modal-content ${embedData.isReel ? 'reel-mode' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <h4 className="video-modal-title">{activeVideo.title}</h4>
              <button className="video-modal-close-btn" onClick={closeVideoModal} aria-label="Close Video">
                <FiX />
              </button>
            </div>

            <div className="video-player-wrapper">
              {embedData.type === 'iframe' ? (
                <iframe 
                  src={embedData.src} 
                  title={activeVideo.title}
                  className="video-player-element"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video 
                  src={embedData.src} 
                  controls 
                  autoPlay 
                  className="video-player-element"
                >
                  Your browser does not support HTML5 video.
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoBannerSection;
