import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FiGrid, FiImage, FiVideo, FiSave, FiPlus, FiEdit, FiTrash2, 
  FiEye, FiEyeOff, FiArrowUp, FiArrowDown, FiLayers, FiSliders, FiFilm,
  FiVolume2, FiShare2, FiCheck, FiSearch, FiGlobe, FiInstagram, FiFacebook, FiYoutube
} from 'react-icons/fi';
import { FaWhatsapp, FaTwitter, FaPinterest } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FileUploadInput from '../../components/common/FileUploadInput';
import { getYouTubeThumbnail } from '../../utils/videoUtils';
import './HomepageSettings.css';

const DEFAULT_SECTIONS = [
  { section_key: 'hero_carousel', title: 'Hero Carousel', subtitle: 'Homepage hero banner', is_visible: true, display_order: 1 },
  { section_key: 'shop_by_category', title: 'Shop By Category', subtitle: 'EXPLORE APPAREL', is_visible: true, display_order: 2 },
  { section_key: 'video_banner', title: 'Video Showcase Carousel', subtitle: 'Homepage video films', is_visible: true, display_order: 3 },
  { section_key: 'shop_by_occasion', title: 'Shop By Occasion', subtitle: 'Occasion-based shopping', is_visible: true, display_order: 4 },
  { section_key: 'trending_arrivals', title: 'Trending & New Arrivals', subtitle: 'HANDPICKED CURATION', is_visible: true, display_order: 5 },
  { section_key: 'featured_brands', title: 'Featured Brands', subtitle: 'Curated In-House Houses', is_visible: true, display_order: 6 }
];

const emptySlideForm = {
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  badge_text: '',
  cta_primary_text: 'Discover ORDERLY',
  cta_primary_link: '/shop',
  cta_secondary_text: 'Explore Shirts',
  cta_secondary_link: '/shop?category=Shirts',
  display_order: 1
};

const emptyFilmForm = {
  title: '',
  subtitle: '',
  thumbnail: '',
  videoUrl: '',
  display_order: 1
};

const emptyOccasionForm = {
  name: '',
  slug: '',
  subtitle: '',
  image: '',
  display_order: 0
};

const HomepageSettings = ({ defaultTab = 'sections' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || defaultTab);

  useEffect(() => {
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // 1. SECTIONS CMS STATE
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [loadingSections, setLoadingSections] = useState(true);
  const [savingSections, setSavingSections] = useState(false);

  // 2. HERO SLIDES CMS STATE
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideFormData, setSlideFormData] = useState(emptySlideForm);

  // 3. VIDEO FILMS SHOWCASE CMS STATE
  const [videoFilms, setVideoFilms] = useState([]);
  const [isFilmModalOpen, setIsFilmModalOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState(null);
  const [filmFormData, setFilmFormData] = useState(emptyFilmForm);

  // 4. OCCASIONS CMS STATE
  const [occasions, setOccasions] = useState([]);
  const [loadingOccasions, setLoadingOccasions] = useState(false);
  const [occasionSearch, setOccasionSearch] = useState('');
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState(null);
  const [occasionFormData, setOccasionFormData] = useState(emptyOccasionForm);

  // 5. TOPBAR ANNOUNCEMENTS STATE
  const [announcementsText, setAnnouncementsText] = useState('');
  const [savingTopbar, setSavingTopbar] = useState(false);

  // 6. SOCIAL LINKS STATE
  const [socialLinks, setSocialLinks] = useState({
    instagram_url: '',
    facebook_url: '',
    youtube_url: '',
    whatsapp_url: '',
    twitter_url: '',
    pinterest_url: ''
  });
  const [savingSocials, setSavingSocials] = useState(false);

  // Load All Homepage & CMS Settings Data
  const loadData = async () => {
    setLoadingSections(true);
    setLoadingSlides(true);
    setLoadingOccasions(true);

    try {
      const [secRes, slidesRes, filmsRes, occRes, settingsRes] = await Promise.allSettled([
        api.get('/homepage/sections/all'),
        api.get('/hero-slides/all'),
        api.get('/homepage/video-films'),
        api.get('/occasions'),
        api.get('/settings')
      ]);

      // Process Homepage Sections
      if (secRes.status === 'fulfilled' && secRes.value.data?.success && Array.isArray(secRes.value.data.data) && secRes.value.data.data.length > 0) {
        const fetched = secRes.value.data.data;
        const merged = DEFAULT_SECTIONS.map((defItem) => {
          const match = fetched.find(s => s.section_key === defItem.section_key);
          return match ? { ...defItem, ...match } : defItem;
        });
        merged.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setSections(merged);
      } else {
        setSections(DEFAULT_SECTIONS);
      }

      // Process Hero Slides
      if (slidesRes.status === 'fulfilled' && slidesRes.value.data?.success && Array.isArray(slidesRes.value.data.data)) {
        setSlides(slidesRes.value.data.data);
      }

      // Process Video Showcase Films
      if (filmsRes.status === 'fulfilled' && filmsRes.value.data?.success && Array.isArray(filmsRes.value.data.data)) {
        setVideoFilms(filmsRes.value.data.data);
      }

      // Process Occasions
      if (occRes.status === 'fulfilled' && occRes.value.data?.success && Array.isArray(occRes.value.data.data)) {
        setOccasions(occRes.value.data.data);
      }

      // Process Settings (Announcements & Social Links)
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success && settingsRes.value.data.data) {
        const st = settingsRes.value.data.data;
        if (typeof st.announcements === 'string') {
          setAnnouncementsText(st.announcements.split('|').join('\n'));
        } else if (Array.isArray(st.announcements)) {
          setAnnouncementsText(st.announcements.join('\n'));
        }
        setSocialLinks({
          instagram_url: st.instagram_url || '',
          facebook_url: st.facebook_url || '',
          youtube_url: st.youtube_url || '',
          whatsapp_url: st.whatsapp_url || '',
          twitter_url: st.twitter_url || '',
          pinterest_url: st.pinterest_url || ''
        });
      }
    } catch (err) {
      console.warn('CMS load note:', err);
    } finally {
      setLoadingSections(false);
      setLoadingSlides(false);
      setLoadingOccasions(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Video Films state
  const saveVideoFilmsState = async (updatedList) => {
    setVideoFilms(updatedList);
    try {
      await api.put('/homepage/video-films', updatedList);
    } catch (err) {}
    window.dispatchEvent(new CustomEvent('orderly_video_films_updated'));
  };

  // --- SECTIONS CMS HANDLERS ---
  const handleSectionFieldChange = (index, field, value) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const moveSection = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      display_order: idx + 1
    }));
    setSections(reordered);
  };

  const handleSaveSections = async () => {
    setSavingSections(true);
    try {
      const payload = sections.map((s, idx) => ({
        section_key: s.section_key,
        title: s.title,
        subtitle: s.subtitle,
        is_visible: s.is_visible !== false,
        display_order: idx + 1
      }));

      await api.put('/homepage/sections', payload);
      window.dispatchEvent(new CustomEvent('orderly_homepage_sections_updated'));
      toast.success('Homepage section layout updated!');
    } catch (err) {
      toast.error('Failed to update homepage sections layout');
    } finally {
      setSavingSections(false);
    }
  };

  // --- HERO CAROUSEL HANDLERS ---
  const openAddSlideModal = () => {
    setEditingSlide(null);
    setSlideFormData({ ...emptySlideForm, display_order: slides.length + 1 });
    setIsSlideModalOpen(true);
  };

  const openEditSlideModal = (item) => {
    setEditingSlide(item);
    setSlideFormData({
      title: item.title || '',
      subtitle: item.subtitle || '',
      description: item.description || '',
      image_url: item.image_url || item.image || '',
      badge_text: item.badge_text || item.badge || '',
      cta_primary_text: item.cta_primary_text || 'Discover ORDERLY',
      cta_primary_link: item.cta_primary_link || '/shop',
      cta_secondary_text: item.cta_secondary_text || 'Explore Shirts',
      cta_secondary_link: item.cta_secondary_link || '/shop?category=Shirts',
      display_order: item.display_order || slides.length + 1
    });
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!slideFormData.image_url) {
      toast.error('Slide image URL is required');
      return;
    }
    try {
      if (editingSlide) {
        const res = await api.put(`/hero-slides/${editingSlide.id}`, slideFormData);
        if (res.data?.success) {
          setSlides(prev => prev.map(s => s.id === editingSlide.id ? res.data.data : s));
          toast.success('Hero slide updated!');
        }
      } else {
        const res = await api.post('/hero-slides', slideFormData);
        if (res.data?.success) {
          setSlides(prev => [...prev, res.data.data]);
          toast.success('New Hero slide created!');
        }
      }
      setIsSlideModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slide');
    }
  };

  const handleDeleteSlide = async (item) => {
    if (window.confirm(`Delete slide "${item.title || 'Untitled'}"?`)) {
      try {
        const res = await api.delete(`/hero-slides/${item.id}`);
        if (res.data?.success) {
          setSlides(prev => prev.filter(s => s.id !== item.id));
          toast.success('Hero slide deleted');
        }
      } catch (err) {
        toast.error('Failed to delete slide');
      }
    }
  };

  // --- VIDEO FILMS HANDLERS ---
  const openAddFilmModal = () => {
    setEditingFilm(null);
    setFilmFormData({ ...emptyFilmForm, display_order: videoFilms.length + 1 });
    setIsFilmModalOpen(true);
  };

  const openEditFilmModal = (item) => {
    setEditingFilm(item);
    setFilmFormData({
      title: item.title || '',
      subtitle: item.subtitle || '',
      thumbnail: item.thumbnail || '',
      videoUrl: item.videoUrl || item.video_url || '',
      display_order: item.display_order || 1
    });
    setIsFilmModalOpen(true);
  };

  const handleSaveFilm = (e) => {
    e.preventDefault();
    if (!filmFormData.title || !filmFormData.videoUrl) {
      toast.error('Film Title and Video URL are required');
      return;
    }

    const resolvedThumb = filmFormData.thumbnail || getYouTubeThumbnail(filmFormData.videoUrl) || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop';

    if (editingFilm) {
      const updated = videoFilms.map(f => f.id === editingFilm.id ? { ...f, ...filmFormData, thumbnail: resolvedThumb } : f);
      saveVideoFilmsState(updated);
      toast.success('Video Film updated!');
    } else {
      const newFilm = {
        id: Date.now(),
        ...filmFormData,
        thumbnail: resolvedThumb
      };
      const updated = [...videoFilms, newFilm];
      saveVideoFilmsState(updated);
      toast.success('New Video Showcase Film created!');
    }
    setIsFilmModalOpen(false);
  };

  const handleDeleteFilm = (item) => {
    if (window.confirm(`Delete film "${item.title}"?`)) {
      const updated = videoFilms.filter(f => f.id !== item.id);
      saveVideoFilmsState(updated);
      toast.success('Film deleted');
    }
  };

  // --- OCCASIONS CMS HANDLERS ---
  const openAddOccasionModal = () => {
    setEditingOccasion(null);
    setOccasionFormData({ ...emptyOccasionForm, display_order: occasions.length + 1 });
    setIsOccasionModalOpen(true);
  };

  const openEditOccasionModal = (item) => {
    setEditingOccasion(item);
    setOccasionFormData({
      name: item.name || '',
      slug: item.slug || '',
      subtitle: item.subtitle || '',
      image: item.image || '',
      display_order: item.display_order || 0
    });
    setIsOccasionModalOpen(true);
  };

  const handleSaveOccasion = async (e) => {
    e.preventDefault();
    if (!occasionFormData.name) {
      toast.error('Occasion name is required');
      return;
    }
    const payload = {
      ...occasionFormData,
      slug: occasionFormData.slug || occasionFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    try {
      if (editingOccasion) {
        const res = await api.put(`/occasions/${editingOccasion.id}`, payload);
        if (res.data?.success) {
          setOccasions(prev => prev.map(o => o.id === editingOccasion.id ? { ...o, ...res.data.data } : o));
          toast.success(`Occasion "${occasionFormData.name}" updated!`);
        }
      } else {
        const res = await api.post('/occasions', payload);
        if (res.data?.success) {
          setOccasions(prev => [...prev, res.data.data]);
          toast.success(`Occasion "${occasionFormData.name}" created!`);
        }
      }
      window.dispatchEvent(new CustomEvent('orderly_occasions_updated'));
      setIsOccasionModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save occasion');
    }
  };

  const handleDeleteOccasion = async (item) => {
    if (window.confirm(`Delete occasion "${item.name}"?`)) {
      try {
        const res = await api.delete(`/occasions/${item.id}`);
        if (res.data?.success) {
          setOccasions(prev => prev.filter(o => o.id !== item.id));
          toast.success('Occasion deleted');
          window.dispatchEvent(new CustomEvent('orderly_occasions_updated'));
        }
      } catch (err) {
        toast.error('Failed to delete occasion');
      }
    }
  };

  const handleToggleOccasionStatus = async (item) => {
    try {
      const res = await api.put(`/occasions/${item.id}`, { is_active: !item.is_active });
      if (res.data?.success) {
        setOccasions(prev => prev.map(o => o.id === item.id ? { ...o, ...res.data.data } : o));
        toast.success('Occasion status updated');
        window.dispatchEvent(new CustomEvent('orderly_occasions_updated'));
      }
    } catch (err) {
      toast.error('Failed to update occasion status');
    }
  };

  // --- TOPBAR HANDLER ---
  const handleSaveTopbar = async (e) => {
    e.preventDefault();
    setSavingTopbar(true);
    try {
      const pipeFormatted = announcementsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .join('|');

      await api.put('/settings', { announcements: pipeFormatted });
      window.dispatchEvent(new CustomEvent('orderly_settings_updated'));
      toast.success('Topbar announcement messages updated!');
    } catch (err) {
      toast.error('Failed to save topbar announcements');
    } finally {
      setSavingTopbar(false);
    }
  };

  // --- SOCIAL LINKS HANDLER ---
  const handleSaveSocials = async (e) => {
    e.preventDefault();
    setSavingSocials(true);
    try {
      await api.put('/settings', socialLinks);
      window.dispatchEvent(new CustomEvent('orderly_settings_updated'));
      toast.success('Social media profile URLs updated!');
    } catch (err) {
      toast.error('Failed to save social links');
    } finally {
      setSavingSocials(false);
    }
  };

  const filteredOccasions = occasions.filter(item => {
    const q = occasionSearch.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="homepage-settings-page p-4">
      {/* Top Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="admin-page-title d-flex align-items-center gap-2" style={{ color: '#0f172a', fontWeight: 800 }}>
            <FiSliders className="text-danger" /> Homepage & CMS Master Settings
          </h1>
          <p className="text-muted mb-0 small">Control section layouts, hero slides, video films, occasions, topbar promos, and social links live on the storefront.</p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="admin-tabs-nav mb-4">
        <button 
          className={`admin-tab-btn ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => handleTabChange('sections')}
        >
          <FiSliders /> Section Layout & Order
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'carousel' ? 'active' : ''}`}
          onClick={() => handleTabChange('carousel')}
        >
          <FiImage /> Hero Carousel ({slides.length})
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'video_films' ? 'active' : ''}`}
          onClick={() => handleTabChange('video_films')}
        >
          <FiFilm /> Video Showcase ({videoFilms.length})
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'occasions' ? 'active' : ''}`}
          onClick={() => handleTabChange('occasions')}
        >
          <FiGrid /> Shop By Occasions ({occasions.length})
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'topbar' ? 'active' : ''}`}
          onClick={() => handleTabChange('topbar')}
        >
          <FiVolume2 /> Topbar Announcements
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'social_links' ? 'active' : ''}`}
          onClick={() => handleTabChange('social_links')}
        >
          <FiShare2 /> Social Media Links
        </button>
      </div>

      {/* TAB 1: SECTIONS LAYOUT ORDER */}
      {activeTab === 'sections' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1">Homepage Sections Order & Visibility</h4>
              <p className="text-muted small mb-0">Reorder sections up and down. Toggle switch to show/hide sections instantly on the live website.</p>
            </div>
            <button className="btn-admin-red" onClick={handleSaveSections} disabled={savingSections}>
              <FiSave /> {savingSections ? 'Saving...' : 'Save Section Layout'}
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-matrix-table align-middle">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ORDER</th>
                  <th>SECTION NAME</th>
                  <th>SECTION TITLE</th>
                  <th>SUBTITLE / BADGE</th>
                  <th>VISIBILITY</th>
                  <th className="text-end pe-4">MOVE</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec, idx) => (
                  <tr key={sec.section_key}>
                    <td><strong className="text-muted">#{idx + 1}</strong></td>
                    <td><code className="cat-slug-badge">{sec.section_key}</code></td>
                    <td>
                      <input 
                        type="text" 
                        className="admin-input form-control-sm"
                        value={sec.title}
                        onChange={(e) => handleSectionFieldChange(idx, 'title', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="admin-input form-control-sm"
                        value={sec.subtitle}
                        onChange={(e) => handleSectionFieldChange(idx, 'subtitle', e.target.value)}
                      />
                    </td>
                    <td>
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          checked={sec.is_visible !== false}
                          onChange={(e) => handleSectionFieldChange(idx, 'is_visible', e.target.checked)}
                          id={`switch-${sec.section_key}`}
                        />
                        <label className="form-check-label small text-muted" htmlFor={`switch-${sec.section_key}`}>
                          {sec.is_visible !== false ? 'Visible' : 'Hidden'}
                        </label>
                      </div>
                    </td>
                    <td className="text-end pe-4">
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-secondary" 
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <FiArrowUp />
                        </button>
                        <button 
                          className="btn btn-outline-secondary" 
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === sections.length - 1}
                        >
                          <FiArrowDown />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HERO CAROUSEL BANNERS */}
      {activeTab === 'carousel' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1">Hero Carousel Slides</h4>
              <p className="text-muted small mb-0">Manage main full-width banner slides shown on the storefront homepage.</p>
            </div>
            <button className="btn-admin-red" onClick={openAddSlideModal}>
              <FiPlus /> Add New Hero Slide
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-matrix-table align-middle">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>BANNER</th>
                  <th>SLIDE TITLE</th>
                  <th>SUBTITLE & BADGE</th>
                  <th>PRIMARY CTA</th>
                  <th>ORDER</th>
                  <th className="text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {slides.map(slide => (
                  <tr key={slide.id}>
                    <td>
                      <img 
                        src={slide.image_url || slide.image} 
                        alt={slide.title} 
                        style={{ width: 64, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                      />
                    </td>
                    <td><strong className="text-dark">{slide.title || 'Untitled Banner'}</strong></td>
                    <td>
                      <span className="badge bg-danger text-white me-1">{slide.badge_text || 'PROMO'}</span>
                      <span className="text-muted small">{slide.subtitle}</span>
                    </td>
                    <td><code className="cat-slug-badge">{slide.cta_primary_text || 'Shop Now'}</code></td>
                    <td><strong>#{slide.display_order || 1}</strong></td>
                    <td className="text-end pe-4">
                      <button className="btn-admin-outline py-1 px-2 me-2" onClick={() => openEditSlideModal(slide)}>
                        <FiEdit /> Edit
                      </button>
                      <button className="btn-admin-outline py-1 px-2 text-danger" onClick={() => handleDeleteSlide(slide)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VIDEO SHOWCASE FILMS */}
      {activeTab === 'video_films' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1">Video Showcase Films</h4>
              <p className="text-muted small mb-0">Upload or link YouTube, Instagram, Facebook, and Cloudflare R2 video films for the homepage carousel.</p>
            </div>
            <button className="btn-admin-red" onClick={openAddFilmModal}>
              <FiPlus /> Add Video Film
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-matrix-table align-middle">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>THUMB</th>
                  <th>FILM TITLE</th>
                  <th>SUBTITLE</th>
                  <th>VIDEO SOURCE / URL</th>
                  <th className="text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {videoFilms.map(film => (
                  <tr key={film.id}>
                    <td>
                      <img 
                        src={film.thumbnail} 
                        alt={film.title} 
                        style={{ width: 64, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                      />
                    </td>
                    <td><strong className="text-dark">{film.title}</strong></td>
                    <td><span className="text-muted small">{film.subtitle || 'Product Showcase'}</span></td>
                    <td><code className="cat-slug-badge" style={{ maxWidth: '280px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{film.videoUrl}</code></td>
                    <td className="text-end pe-4">
                      <button className="btn-admin-outline py-1 px-2 me-2" onClick={() => openEditFilmModal(film)}>
                        <FiEdit /> Edit
                      </button>
                      <button className="btn-admin-outline py-1 px-2 text-danger" onClick={() => handleDeleteFilm(film)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SHOP BY OCCASIONS */}
      {activeTab === 'occasions' && (
        <div className="admin-card-white p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3 border-bottom pb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1">Shop By Occasions Manager</h4>
              <p className="text-muted small mb-0">Create and manage curated occasion banners displayed live on the storefront homepage.</p>
            </div>
            <button className="btn-admin-red" onClick={openAddOccasionModal}>
              <FiPlus /> Add New Occasion
            </button>
          </div>

          <div className="mb-3 position-relative" style={{ maxWidth: '400px' }}>
            <input 
              type="text" 
              className="admin-input ps-5"
              placeholder="Search occasions..."
              value={occasionSearch}
              onChange={(e) => setOccasionSearch(e.target.value)}
            />
            <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <div className="table-responsive">
            <table className="admin-matrix-table align-middle">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>BANNER</th>
                  <th>OCCASION TITLE</th>
                  <th>SUBTITLE / TAGLINE</th>
                  <th>SLUG</th>
                  <th>ORDER</th>
                  <th>STATUS</th>
                  <th className="text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOccasions.map(item => (
                  <tr key={item.id}>
                    <td>
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=200&auto=format&fit=crop'} 
                        alt={item.name} 
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td><strong className="text-dark">{item.name}</strong></td>
                    <td><span className="badge bg-danger text-white px-2 py-1 rounded-pill small">{item.subtitle || 'Shop Occasion'}</span></td>
                    <td><code className="cat-slug-badge">{item.slug}</code></td>
                    <td><span className="fw-bold text-muted">#{item.display_order || 1}</span></td>
                    <td>
                      <StatusBadge status={item.is_active !== false ? 'active' : 'inactive'} />
                    </td>
                    <td className="text-end pe-4">
                      <button className="btn-admin-outline py-1 px-2 me-2" onClick={() => handleToggleOccasionStatus(item)}>
                        {item.is_active !== false ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button className="btn-admin-outline py-1 px-2 me-2" onClick={() => openEditOccasionModal(item)}>
                        <FiEdit /> Edit
                      </button>
                      <button className="btn-admin-outline py-1 px-2 text-danger" onClick={() => handleDeleteOccasion(item)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TOPBAR ANNOUNCEMENTS */}
      {activeTab === 'topbar' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Topbar Announcement Messages</h4>
            <p className="text-muted small mb-0">Enter announcement ticker messages displayed at the very top of the website. Enter one announcement per line.</p>
          </div>

          <form onSubmit={handleSaveTopbar}>
            <div className="mb-4">
              <label className="admin-form-label">Announcement Ticker Lines (One per line)</label>
              <textarea 
                className="admin-input font-monospace"
                rows={6}
                value={announcementsText}
                onChange={(e) => setAnnouncementsText(e.target.value)}
                placeholder="⚡ FREE Express Shipping on orders above ₹1,999 | Use Code: ORDERLY20&#10;🔥 Festive Sale is Live: Save up to 40% OFF on Italian Suits&#10;✨ 15 Days Easy Returns & Exchanges Guaranteed"
              />
              <span className="form-text text-muted extra-small">Each line will automatically rotate on the storefront topbar ticker.</span>
            </div>

            <button type="submit" className="btn-admin-red" disabled={savingTopbar}>
              <FiCheck /> {savingTopbar ? 'Saving...' : 'Save Topbar Announcements'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: SOCIAL MEDIA LINKS */}
      {activeTab === 'social_links' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Social Media Profile Links</h4>
            <p className="text-muted small mb-0">Set your official social media URLs displayed in the topbar header and website footer.</p>
          </div>

          <form onSubmit={handleSaveSocials}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="admin-form-label d-flex align-items-center gap-2">
                  <FiInstagram className="text-danger" /> Instagram Profile URL
                </label>
                <input 
                  type="url"
                  className="admin-input"
                  value={socialLinks.instagram_url}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram_url: e.target.value }))}
                  placeholder="https://instagram.com/orderly_menswear"
                />
              </div>

              <div className="col-md-6">
                <label className="admin-form-label d-flex align-items-center gap-2">
                  <FiFacebook className="text-primary" /> Facebook Page URL
                </label>
                <input 
                  type="url"
                  className="admin-input"
                  value={socialLinks.facebook_url}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook_url: e.target.value }))}
                  placeholder="https://facebook.com/orderly_menswear"
                />
              </div>

              <div className="col-md-6">
                <label className="admin-form-label d-flex align-items-center gap-2">
                  <FiYoutube className="text-danger" /> YouTube Channel URL
                </label>
                <input 
                  type="url"
                  className="admin-input"
                  value={socialLinks.youtube_url}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://youtube.com/@orderly_menswear"
                />
              </div>

              <div className="col-md-6">
                <label className="admin-form-label d-flex align-items-center gap-2">
                  <FaWhatsapp className="text-success" /> WhatsApp Business Support Link
                </label>
                <input 
                  type="url"
                  className="admin-input"
                  value={socialLinks.whatsapp_url}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, whatsapp_url: e.target.value }))}
                  placeholder="https://wa.me/919876543210"
                />
              </div>

              <div className="col-md-6">
                <label className="admin-form-label d-flex align-items-center gap-2">
                  <FaTwitter className="text-info" /> Twitter / X Profile URL
                </label>
                <input 
                  type="url"
                  className="admin-input"
                  value={socialLinks.twitter_url}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter_url: e.target.value }))}
                  placeholder="https://x.com/orderly_menswear"
                />
              </div>

              <div className="col-md-6">
                <label className="admin-form-label d-flex align-items-center gap-2">
                  <FaPinterest className="text-danger" /> Pinterest Profile URL
                </label>
                <input 
                  type="url"
                  className="admin-input"
                  value={socialLinks.pinterest_url}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, pinterest_url: e.target.value }))}
                  placeholder="https://pinterest.com/orderly_menswear"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-top">
              <button type="submit" className="btn-admin-red" disabled={savingSocials}>
                <FiCheck /> {savingSocials ? 'Saving...' : 'Save Social Links'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Hero Slide */}
      <Modal isOpen={isSlideModalOpen} onClose={() => setIsSlideModalOpen(false)} title={editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}>
        <form onSubmit={handleSaveSlide}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Slide Title *</label>
              <input type="text" className="admin-input" value={slideFormData.title} onChange={(e) => setSlideFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. LUXURY RESORT COLLECTION" required />
            </div>
            <div className="col-md-6">
              <label className="admin-form-label">Badge Tag (Top Badge)</label>
              <input type="text" className="admin-input" value={slideFormData.badge_text} onChange={(e) => setSlideFormData(prev => ({ ...prev, badge_text: e.target.value }))} placeholder="e.g. NEW ARRIVALS 2026" />
            </div>
            <div className="col-12">
              <label className="admin-form-label">Subtitle Text</label>
              <input type="text" className="admin-input" value={slideFormData.subtitle} onChange={(e) => setSlideFormData(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="e.g. Handcrafted European Linen Shirts" />
            </div>
            <div className="col-12">
              <FileUploadInput value={slideFormData.image_url} onChange={(url) => setSlideFormData(prev => ({ ...prev, image_url: url }))} type="image" folder="hero" label="Hero Banner Image (Cloudflare R2 Upload)" placeholder="Upload or paste banner URL..." />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsSlideModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">Save Slide</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Video Film */}
      <Modal isOpen={isFilmModalOpen} onClose={() => setIsFilmModalOpen(false)} title={editingFilm ? 'Edit Video Film' : 'Add Video Film'}>
        <form onSubmit={handleSaveFilm}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Film Title *</label>
              <input type="text" className="admin-input" value={filmFormData.title} onChange={(e) => setFilmFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Italian Tailoring Film" required />
            </div>
            <div className="col-md-6">
              <label className="admin-form-label">Subtitle</label>
              <input type="text" className="admin-input" value={filmFormData.subtitle} onChange={(e) => setFilmFormData(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="e.g. Craftsmanship Analysis" />
            </div>
            <div className="col-12">
              <label className="admin-form-label">Video Stream / Embed URL (YouTube, Instagram, R2 Upload) *</label>
              <input type="text" className="admin-input" value={filmFormData.videoUrl} onChange={(e) => setFilmFormData(prev => ({ ...prev, videoUrl: e.target.value }))} placeholder="Paste YouTube link, Instagram Reel link, or Cloudflare R2 video MP4 link..." required />
            </div>
            <div className="col-12">
              <FileUploadInput value={filmFormData.thumbnail} onChange={(url) => setFilmFormData(prev => ({ ...prev, thumbnail: url }))} type="image" folder="thumbnails" label="Film Cover Thumbnail (Optional)" placeholder="Upload custom poster image..." />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsFilmModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">Save Video Film</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Occasion */}
      <Modal isOpen={isOccasionModalOpen} onClose={() => setIsOccasionModalOpen(false)} title={editingOccasion ? 'Edit Occasion' : 'Add Occasion'}>
        <form onSubmit={handleSaveOccasion}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Occasion Title *</label>
              <input type="text" className="admin-input" value={occasionFormData.name} onChange={(e) => setOccasionFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Wedding Collection" required />
            </div>
            <div className="col-md-6">
              <label className="admin-form-label">URL Slug</label>
              <input type="text" className="admin-input" value={occasionFormData.slug} onChange={(e) => setOccasionFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="Auto-generated from title" />
            </div>
            <div className="col-md-8">
              <label className="admin-form-label">Subtitle / Tagline</label>
              <input type="text" className="admin-input" value={occasionFormData.subtitle} onChange={(e) => setOccasionFormData(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="e.g. FOR THE BIG DAY" />
            </div>
            <div className="col-md-4">
              <label className="admin-form-label">Display Order</label>
              <input type="number" className="admin-input" value={occasionFormData.display_order} onChange={(e) => setOccasionFormData(prev => ({ ...prev, display_order: Number(e.target.value) || 0 }))} />
            </div>
            <div className="col-12">
              <FileUploadInput value={occasionFormData.image} onChange={(url) => setOccasionFormData(prev => ({ ...prev, image: url }))} type="image" folder="occasions" label="Banner Cover Image (Cloudflare R2 Upload)" placeholder="Upload banner image..." />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsOccasionModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">Save Occasion</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HomepageSettings;
