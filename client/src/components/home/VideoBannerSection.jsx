import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FiPlay, FiChevronLeft, FiChevronRight, FiX, FiVolume2, FiVolumeX, FiMaximize2 } from 'react-icons/fi';
import { getVideoFilms, getSettings } from '../../services/api';
import { getYouTubeVideoId, getYouTubeThumbnail } from '../../utils/videoUtils';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './VideoBannerSection.css';

/**
 * Universal Video Embed Parser: Supports YouTube, Instagram Reels, Facebook Videos, Vimeo, and Direct Uploaded MP4s.
 */
const getEmbedInfo = (url = '', autoplay = true, muted = false) => {
  if (!url) return { type: 'mp4', src: '' };
  const str = url.trim();

  // 1. YouTube (watch?v=, shorts/, youtu.be/, embed/)
  const ytMatch = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    const autoParam = autoplay ? '1' : '0';
    const muteParam = muted ? '1' : '0';
    return {
      type: 'iframe',
      id,
      src: `https://www.youtube.com/embed/${id}?autoplay=${autoParam}&mute=${muteParam}&loop=1&playlist=${id}&rel=0&enablejsapi=1`,
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
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(str)}&show_text=false&autoplay=${autoplay}`,
      isReel: false
    };
  }

  // 4. Vimeo
  const vimeoMatch = str.match(/vimeo\.com\/(?:.*\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}`,
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

const VideoBannerSection = ({ title: propTitle, subtitle: propSubtitle }) => {
  const [activeModalVideo, setActiveModalVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [filmsList, setFilmsList] = useState([]);
  const [bannerConfig, setBannerConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('orderly_site_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.video_banner_config) {
          return {
            enabled: true,
            youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            autoplay: false,
            title: 'EXPERIENCE THE CRAFT',
            subtitle: 'CAMPAIGN FILM',
            description: '',
            cover_image: '',
            badge_text: 'EXCLUSIVE PREVIEW',
            ...parsed.video_banner_config
          };
        }
      }
    } catch {}
    return {
      enabled: true,
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      autoplay: false,
      title: 'EXPERIENCE THE CRAFT',
      subtitle: 'CAMPAIGN FILM',
      description: '',
      cover_image: '',
      badge_text: 'EXCLUSIVE PREVIEW'
    };
  });
  const swiperRef = useRef(null);

  // Load Video Banner Config from Site Settings & LocalStorage
  const loadBannerConfig = async () => {
    try {
      const cached = localStorage.getItem('orderly_site_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.video_banner_config) {
            setBannerConfig(prev => ({ ...prev, ...parsed.video_banner_config }));
          }
        } catch {}
      }

      const res = await getSettings();
      if (res?.success && res.data?.video_banner_config) {
        setBannerConfig(prev => ({ ...prev, ...res.data.video_banner_config }));
      }
    } catch {}
  };

  const loadFilms = async () => {
    try {
      const apiData = await getVideoFilms();
      const films = Array.isArray(apiData) ? apiData : apiData?.data;
      setFilmsList(Array.isArray(films) ? films : []);
    } catch (e) {
      setFilmsList([]);
    }
  };

  useEffect(() => {
    loadBannerConfig();
    loadFilms();

    const handleUpdate = () => {
      loadBannerConfig();
      loadFilms();
    };

    window.addEventListener('orderly_settings_updated', handleUpdate);
    window.addEventListener('orderly_homepage_sections_updated', handleUpdate);
    window.addEventListener('orderly_video_films_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('orderly_settings_updated', handleUpdate);
      window.removeEventListener('orderly_homepage_sections_updated', handleUpdate);
      window.removeEventListener('orderly_video_films_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const hasYoutubeBanner = Boolean(bannerConfig?.youtube_url?.trim());
  const ytVideoId = hasYoutubeBanner ? getYouTubeVideoId(bannerConfig.youtube_url) : null;
  const isAutoplay = Boolean(bannerConfig?.autoplay);

  // Custom CMS title and subtitle take priority over generic section placeholders
  const displayTitle = bannerConfig.title || propTitle || 'EXPERIENCE THE CRAFT';
  const displaySubtitle = bannerConfig.subtitle || propSubtitle || 'CAMPAIGN FILM';
  const displayDesc = bannerConfig.description || '';

  // High quality thumbnail resolution fallback
  const ytMaxThumbnail = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg` : '';
  const ytHqThumbnail = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : '';
  const posterImage = bannerConfig.cover_image || ytMaxThumbnail || ytHqThumbnail || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1920';

  const handleStartPlay = () => {
    setIsPlaying(true);
    setIsMuted(false);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const openCinemaModal = (e) => {
    if (e) e.stopPropagation();
    setActiveModalVideo({
      title: displayTitle,
      videoUrl: bannerConfig.youtube_url
    });
  };

  const closeVideoModal = () => {
    setActiveModalVideo(null);
  };

  const modalEmbed = activeModalVideo ? getEmbedInfo(activeModalVideo.videoUrl, true, false) : null;

  // Render standalone hero campaign video banner when youtube_url is present
  if (hasYoutubeBanner && ytVideoId) {
    const shouldEmbedDirectly = isAutoplay || isPlaying;
    const embedUrl = `https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=${isMuted ? '1' : '0'}&loop=1&playlist=${ytVideoId}&rel=0&enablejsapi=1&controls=1`;

    return (
      <section className="video-showcase-section py-5 position-relative" aria-label="Brand Campaign Video">
        <div className="container-fluid px-lg-5">
          {/* Section Header */}
          <div className="text-center mb-4">
            <span className="video-section-subtitle text-uppercase">
              {displaySubtitle}
            </span>
            <h2 className="video-section-title">
              {displayTitle}
            </h2>
            {displayDesc && (
              <p className="video-section-desc text-muted mx-auto mt-2 mb-0" style={{ maxWidth: '640px' }}>
                {displayDesc}
              </p>
            )}
          </div>

          {/* Cinematic 16:9 Video Canvas */}
          <div className="cinema-video-container mx-auto">
            <div className="cinema-video-card">
              {shouldEmbedDirectly ? (
                <>
                  <iframe 
                    src={embedUrl}
                    title={displayTitle}
                    className="cinema-iframe-element"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  {/* Floating Controls Overlay (Mute / Fullscreen) */}
                  <div className="cinema-controls-bar">
                    <button 
                      type="button" 
                      className="cinema-control-btn"
                      onClick={toggleMute}
                      title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                      aria-label="Toggle Sound"
                    >
                      {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                      <span className="cinema-btn-label">{isMuted ? 'Sound OFF' : 'Sound ON'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="cinema-control-btn"
                      onClick={openCinemaModal}
                      title="Cinema Theater Mode"
                      aria-label="Cinema Mode"
                    >
                      <FiMaximize2 />
                      <span className="cinema-btn-label">Expand</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Poster Image with Glowing Luxury Play Button */
                <div 
                  className="cinema-poster-wrapper"
                  onClick={handleStartPlay}
                  role="button"
                  tabIndex={0}
                  aria-label={`Play ${displayTitle}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStartPlay(); }}
                >
                  <img 
                    src={posterImage} 
                    alt={displayTitle}
                    className="cinema-poster-img"
                    onError={(e) => {
                      if (ytHqThumbnail && e.currentTarget.src !== ytHqThumbnail) {
                        e.currentTarget.src = ytHqThumbnail;
                      }
                    }}
                  />
                  <div className="cinema-poster-overlay" />

                  {/* Centered Pulsing Play Button */}
                  <div className="video-play-btn-wrapper">
                    <div className="video-play-pulse-ring" />
                    <div className="video-play-circle shadow-lg">
                      <FiPlay className="video-play-icon" />
                    </div>
                    <span className="video-play-cta-text">PLAY NOW</span>
                  </div>

                  {/* Bottom Brand Badge */}
                  <div className="cinema-bottom-badge">
                    <span className="cinema-tag">{bannerConfig.badge_text || displaySubtitle || 'CAMPAIGN FILM'}</span>
                    <h3 className="cinema-caption-title">{displayTitle}</h3>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Universal Cinema Lightbox Modal */}
        {activeModalVideo && modalEmbed && (
          <div className="video-modal-backdrop" onClick={closeVideoModal}>
            <div 
              className="video-modal-content" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="video-modal-header">
                <h4 className="video-modal-title">{activeModalVideo.title}</h4>
                <button className="video-modal-close-btn" onClick={closeVideoModal} aria-label="Close Video">
                  <FiX />
                </button>
              </div>

              <div className="video-player-wrapper ratio ratio-16x9">
                <iframe 
                  src={modalEmbed.src} 
                  title={activeModalVideo.title}
                  className="video-player-element"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // Fallback: Multiple Video Films Carousel (if video_films configured without single youtube_url)
  const totalFilms = filmsList.length;
  if (totalFilms === 0) return null;
  const isLoopable = totalFilms > 3;

  return (
    <section className="video-showcase-section py-5">
      <div className="container-fluid px-lg-5">
        {/* Section Header */}
        <div className="text-center mb-4">
          <span className="video-section-subtitle">
            {displaySubtitle}
          </span>
          <h2 className="video-section-title">
            {displayTitle}
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
                    onClick={() => setActiveModalVideo(film)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="video-thumb-wrapper">
                      {film.thumbnail ? (
                        <img 
                          src={film.thumbnail || ''} 
                          alt={film.title} 
                          className="video-thumb-img" 
                        />
                      ) : (
                        <div className="video-thumb-img orderly-img-fallback">ORDERLY</div>
                      )}
                      <div className="video-thumb-overlay" />
                      <div className="video-play-btn-wrapper">
                        <div className="video-play-circle">
                          <FiPlay className="video-play-icon" />
                        </div>
                      </div>
                    </div>

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

            {totalFilms > 1 && (
              <div className="video-pagination-dots d-flex justify-content-center gap-2 mt-4" />
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeModalVideo && modalEmbed && (
        <div className="video-modal-backdrop" onClick={closeVideoModal}>
          <div 
            className={`video-modal-content ${modalEmbed.isReel ? 'reel-mode' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <h4 className="video-modal-title">{activeModalVideo.title}</h4>
              <button className="video-modal-close-btn" onClick={closeVideoModal} aria-label="Close Video">
                <FiX />
              </button>
            </div>

            <div className="video-player-wrapper">
              <iframe 
                src={modalEmbed.src} 
                title={activeModalVideo.title}
                className="video-player-element"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoBannerSection;
