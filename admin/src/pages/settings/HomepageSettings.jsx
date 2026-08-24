import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FiGrid, FiImage, FiVideo, FiSave, FiPlus, FiEdit, FiTrash2, 
  FiEye, FiEyeOff, FiArrowUp, FiArrowDown, FiLayers, FiSliders, FiFilm,
  FiVolume2, FiShare2, FiCheck, FiSearch, FiGlobe, FiInstagram, FiFacebook, FiYoutube,
  FiShoppingBag, FiTruck, FiRotateCcw, FiShield, FiHeadphones, FiExternalLink, FiSettings, FiTag, FiGift, FiFileText,
  FiMonitor, FiSmartphone, FiX
} from 'react-icons/fi';
import { FaWhatsapp, FaTwitter, FaPinterest } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import Modal from '../../components/common/Modal';
import FileUploadInput from '../../components/common/FileUploadInput';
import StatusBadge from '../../components/common/StatusBadge';
import { getYouTubeThumbnail } from '../../utils/videoUtils';
import './HomepageSettings.css';

const DEFAULT_SECTIONS = [
  { section_key: 'hero_carousel', title: 'Hero Carousel', subtitle: 'Main editorial hero slider', is_visible: true, display_order: 1 },
  { section_key: 'trust_features', title: 'Trust & Service Features Bar', subtitle: 'Free Shipping, Easy Returns, Premium Quality & Support', is_visible: true, display_order: 2 },
  { section_key: 'shop_by_category', title: 'Shop by Category (Collections)', subtitle: 'Discover Your Style categories grid', is_visible: true, display_order: 3 },
  { section_key: 'combo_categories', title: 'Shop by Combo Category', subtitle: 'Curated combo category grid', is_visible: true, display_order: 4 },
  { section_key: 'trending_arrivals', title: 'Best Selling Products', subtitle: 'Handpicked products grid', is_visible: true, display_order: 5 },
  { section_key: 'promo_offers', title: 'Promotional Offers (3 Blocks)', subtitle: 'Combo offers, 50% Off banner, New arrivals', is_visible: true, display_order: 6 },
  { section_key: 'lookbook_banner', title: 'The Lookbook Editorial', subtitle: 'Large luxury editorial campaign banner', is_visible: true, display_order: 7 },
  { section_key: 'newsletter_section', title: 'Newsletter VIP Club', subtitle: 'Email subscription CTA banner', is_visible: true, display_order: 8 },
  { section_key: 'video_banner', title: 'Video Campaign Showcase', subtitle: 'Brand film carousel', is_visible: false, display_order: 9 },
  { section_key: 'shop_by_occasion', title: 'Shop By Occasion', subtitle: 'Occasion-based shopping grid', is_visible: false, display_order: 10 },
  { section_key: 'featured_brands', title: 'Catchy Combo Bundles', subtitle: 'Multi-piece bundle deals', is_visible: false, display_order: 11 }
];

const emptySlideForm = {
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  badge_text: '',
  cta_primary_text: 'SHOP NOW',
  cta_primary_link: '/shop',
  cta_secondary_text: 'EXPLORE COLLECTIONS',
  cta_secondary_link: '/shop',
  display_order: 1
};

const emptyFeatureForm = {
  icon: 'FiTruck',
  title: '',
  description: '',
  enabled: true,
  order: 1
};

const HomepageSettings = ({ defaultTab = 'sections' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || defaultTab);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // State Management
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [sectionDeviceTab, setSectionDeviceTab] = useState('desktop');
  const [savingSections, setSavingSections] = useState(false);

  const [slides, setSlides] = useState([]);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideFormData, setSlideFormData] = useState(emptySlideForm);

  // Announcement Bar State
  const [announcementConfig, setAnnouncementConfig] = useState({
    enabled: true,
    announcements: [
      {
        id: 'ann-1',
        message: 'FREE SHIPPING ON ORDERS ABOVE ₹1499 | EASY 7 DAYS RETURNS',
        highlightedText: '₹1499',
        link: ''
      }
    ],
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    accentColor: '#E50914'
  });

  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({
    message: '',
    highlightedText: '',
    link: ''
  });

  // Service Features State
  const [serviceFeatures, setServiceFeatures] = useState([
    { icon: 'FiTruck', title: 'FREE SHIPPING', description: 'On orders above ₹1499', enabled: true, order: 1 },
    { icon: 'FiRotateCcw', title: 'EASY RETURNS', description: 'Within 7 days', enabled: true, order: 2 },
    { icon: 'FiShield', title: 'PREMIUM QUALITY', description: '100% Original Products', enabled: true, order: 3 },
    { icon: 'FiHeadphones', title: '24/7 SUPPORT', description: "We're here to help", enabled: true, order: 4 }
  ]);

  // Collections Config State
  const [collectionsConfig, setCollectionsConfig] = useState({
    eyebrow: 'EXPLORE COLLECTIONS',
    heading: 'DISCOVER YOUR STYLE',
    selectedCategories: ['Casual Shirts', 'Formal Shirts', 'Tees & Polos', 'Activewear', 'Ethnic'],
    displayLimit: 5
  });
  const [dbCategories, setDbCategories] = useState([]);

  // Best Sellers Config State
  const [bestSellersConfig, setBestSellersConfig] = useState({
    eyebrow: 'TRENDING NOW',
    heading: 'BEST SELLING PRODUCTS',
    productSource: 'Best Selling',
    selectedProducts: [],
    productLimit: 5,
    showRating: true,
    showWishlist: true,
    showAddToCart: true
  });
  const [dbProducts, setDbProducts] = useState([]);

  // Promo Blocks Config State
  const [promotionsConfig, setPromotionsConfig] = useState({
    block1: {
      title: 'COMBO OFFERS',
      subtitle: 'Style, Best Value',
      buttonText: 'EXPLORE COMBOS',
      buttonLink: '/combos',
      icon: 'FiGift'
    },
    block2: {
      tag: 'UP TO',
      discountTitle: '50% OFF',
      subtitle: 'On Selected Items',
      buttonText: 'SHOP NOW',
      buttonLink: '/shop',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
    },
    block3: {
      title: 'NEW ARRIVALS',
      subtitle: 'Fresh Styles Just Landed',
      buttonText: 'EXPLORE NOW',
      buttonLink: '/shop',
      icon: 'FiTag'
    }
  });

  // Lookbook Config State
  const [lookbookConfig, setLookbookConfig] = useState({
    enabled: true,
    title: 'THE LOOKBOOK',
    year: '2026',
    description: 'Elevate your wardrobe with the latest styles designed for the modern man.',
    buttonText: 'EXPLORE NOW',
    buttonLink: '/shop',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1600&auto=format&fit=crop'
  });

  // Newsletter Config State
  const [newsletterConfig, setNewsletterConfig] = useState({
    enabled: true,
    title: 'STAY IN THE LOOP',
    description: 'Subscribe to get updates on new arrivals, exclusive offers and more.',
    placeholder: 'Enter your email',
    buttonText: 'SUBSCRIBE',
    discountCode: 'ORDERLY10'
  });

  // Footer Config State
  const [footerConfig, setFooterConfig] = useState({
    bio: "Orderly is your destination for premium men's wear. Crafted for style, built for comfort, made for you.",
    copyright: '© 2026 Orderly. All Rights Reserved.',
    socials: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com',
      youtube: 'https://youtube.com'
    }
  });

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    primaryColor: '#050505',
    accentColor: '#E50914',
    textColor: '#FFFFFF',
    stickyHeader: true,
    seoTitle: "ORDERLY Mens Wear | Luxury Men's Apparel & Fashion Store",
    seoDescription: "Discover luxury men's fashion by ORDERLY. Shop shirts, oversized tees, selvedge denim, and blazers."
  });

  const [savingAll, setSavingAll] = useState(false);

  // Load All Config Data from Database API
  const loadData = async () => {
    try {
      const [secRes, slidesRes, catsRes, prodsRes, settingsRes] = await Promise.allSettled([
        api.get('/homepage/sections/all'),
        api.get('/hero-slides/all'),
        api.get('/categories'),
        api.get('/products?all=true'),
        api.get('/settings')
      ]);

      // 1. Sections
      if (secRes.status === 'fulfilled' && secRes.value.data?.success && Array.isArray(secRes.value.data.data) && secRes.value.data.data.length > 0) {
        const fetched = secRes.value.data.data;
        const merged = DEFAULT_SECTIONS.map((defItem) => {
          const match = fetched.find(s => s.section_key === defItem.section_key);
          return match ? { ...defItem, ...match } : defItem;
        });
        merged.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setSections(merged);
      }

      // 2. Hero Slides
      if (slidesRes.status === 'fulfilled' && slidesRes.value.data?.success && Array.isArray(slidesRes.value.data.data)) {
        setSlides(slidesRes.value.data.data);
      }

      // 3. Database Categories
      if (catsRes.status === 'fulfilled' && catsRes.value.data?.success && Array.isArray(catsRes.value.data.data)) {
        setDbCategories(catsRes.value.data.data);
      }

      // 4. Database Products
      if (prodsRes.status === 'fulfilled' && prodsRes.value.data?.success && Array.isArray(prodsRes.value.data.data)) {
        setDbProducts(prodsRes.value.data.data);
      }

      // 5. Site Settings
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success && settingsRes.value.data.data) {
        const st = settingsRes.value.data.data;
        if (st.announcement_config) {
          const loadedConfig = { ...st.announcement_config };
          // Normalize announcements array to ensure all fields are defined strings
          if (Array.isArray(loadedConfig.announcements)) {
            loadedConfig.announcements = loadedConfig.announcements.map(a => ({
              id: a.id || `ann-${Date.now()}-${Math.random()}`,
              message: a.message || '',
              highlightedText: a.highlightedText || '',
              link: a.link || ''
            }));
          }
          setAnnouncementConfig(prev => ({ ...prev, ...loadedConfig }));
        }
        if (st.service_features) setServiceFeatures(st.service_features);
        if (st.collections_config) setCollectionsConfig(prev => ({ ...prev, ...st.collections_config }));
        if (st.best_sellers_config) setBestSellersConfig(prev => ({ ...prev, ...st.best_sellers_config }));
        if (st.promotions_config) setPromotionsConfig(prev => ({ ...prev, ...st.promotions_config }));
        if (st.lookbook_config) setLookbookConfig(prev => ({ ...prev, ...st.lookbook_config }));
        if (st.newsletter_config) setNewsletterConfig(prev => ({ ...prev, ...st.newsletter_config }));
        if (st.footer_config) setFooterConfig(prev => ({ ...prev, ...st.footer_config }));
        if (st.global_homepage_settings) setGlobalSettings(prev => ({ ...prev, ...st.global_homepage_settings }));
      }
    } catch (err) {
      console.warn('CMS load note:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save / Publish All Homepage Configurations to DB
  const handlePublishHomepage = async () => {
    setSavingAll(true);
    try {
      // 1. Save Section Order & Visibility
      const sectionsPayload = sections.map((s, idx) => ({
        section_key: s.section_key,
        title: s.title,
        subtitle: s.subtitle,
        is_visible: s.is_visible !== false,
        display_order: idx + 1
      }));
      await api.put('/homepage/sections', sectionsPayload);

      // 2. Save JSON Configurations into SiteSetting DB Table
      const settingsPayload = {
        announcement_config: announcementConfig,
        service_features: serviceFeatures,
        collections_config: collectionsConfig,
        best_sellers_config: bestSellersConfig,
        promotions_config: promotionsConfig,
        lookbook_config: lookbookConfig,
        newsletter_config: newsletterConfig,
        footer_config: footerConfig,
        global_homepage_settings: globalSettings
      };
      await api.put('/settings', settingsPayload);

      // Also save to localStorage for client-side instant synchronization
      localStorage.setItem('orderly_site_settings', JSON.stringify(settingsPayload));
      localStorage.setItem('orderly_homepage_sections', JSON.stringify(sectionsPayload));
      localStorage.setItem('orderly_last_settings_update', Date.now().toString());

      // Dispatch custom events to trigger live synchronization on customer website
      window.dispatchEvent(new CustomEvent('orderly_homepage_sections_updated'));
      window.dispatchEvent(new CustomEvent('orderly_settings_updated'));
      window.dispatchEvent(new CustomEvent('orderly_hero_slides_updated'));

      toast.success('🚀 Homepage successfully published to live website!');
    } catch (err) {
      toast.error('Failed to publish homepage configurations');
    } finally {
      setSavingAll(false);
    }
  };

  // Announcement Bar Handlers
  const openAddAnnouncementModal = () => {
    setEditingAnnouncement(null);
    setAnnouncementFormData({ message: '', highlightedText: '', link: '' });
    setIsAnnouncementModalOpen(true);
  };

  const openEditAnnouncementModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementFormData({
      message: announcement.message,
      highlightedText: announcement.highlightedText,
      link: announcement.link
    });
    setIsAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementFormData.message.trim()) {
      toast.error('Announcement message is required');
      return;
    }

    if (editingAnnouncement) {
      setAnnouncementConfig(prev => ({
        ...prev,
        announcements: prev.announcements.map(a =>
          a.id === editingAnnouncement.id ? { ...a, ...announcementFormData } : a
        )
      }));
      toast.success('Announcement updated');
    } else {
      const newAnnouncement = {
        id: `ann-${Date.now()}`,
        ...announcementFormData
      };
      setAnnouncementConfig(prev => ({
        ...prev,
        announcements: [...prev.announcements, newAnnouncement]
      }));
      toast.success('Announcement added');
    }
    setIsAnnouncementModalOpen(false);
  };

  const handleDeleteAnnouncement = (id) => {
    if (window.confirm('Delete this announcement?')) {
      setAnnouncementConfig(prev => ({
        ...prev,
        announcements: prev.announcements.filter(a => a.id !== id)
      }));
      toast.info('Announcement removed');
    }
  };

  // Sections Order handlers
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

  // Hero Slide Handlers
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
      mobile_image_url: item.mobile_image_url || '',
      badge_text: item.badge_text || item.badge || '',
      cta_primary_text: item.cta_primary_text || 'SHOP NOW',
      cta_primary_link: item.cta_primary_link || '/shop',
      cta_secondary_text: item.cta_secondary_text || 'EXPLORE COLLECTIONS',
      cta_secondary_link: item.cta_secondary_link || '/shop',
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

  return (
    <div className="homepage-settings-page p-4">
      {/* Control Header Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 p-3 bg-white border rounded-3 shadow-sm">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="admin-page-title m-0 text-dark fw-bold fs-4">
              <FiSliders className="text-danger me-1" /> Homepage Content Control Center
            </h1>
            <span className="badge bg-success px-2 py-1 align-middle ms-2">● Live Sync</span>
          </div>
          <p className="text-muted mb-0 small">Manage all customer homepage sections, hero slides, promotions, collections, and global settings dynamically from the database.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <a 
            href="http://localhost:5173" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-admin-outline d-flex align-items-center gap-1"
          >
            <FiExternalLink /> Preview Homepage
          </a>

          <button 
            className="btn-admin-red d-flex align-items-center gap-1 px-3 fw-bold"
            onClick={handlePublishHomepage}
            disabled={savingAll}
          >
            <FiSave /> {savingAll ? 'Publishing...' : 'Publish Homepage'}
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="admin-tabs-nav mb-4">
        <button className={`admin-tab-btn ${activeTab === 'sections' ? 'active' : ''}`} onClick={() => handleTabChange('sections')}>
          <FiSliders /> Section Order & Visibility
        </button>
        <button className={`admin-tab-btn ${activeTab === 'announcement' ? 'active' : ''}`} onClick={() => handleTabChange('announcement')}>
          <FiVolume2 /> Announcement Bar
        </button>
        <button className={`admin-tab-btn ${activeTab === 'carousel' ? 'active' : ''}`} onClick={() => handleTabChange('carousel')}>
          <FiImage /> Hero Slider ({slides.length})
        </button>
        <button className={`admin-tab-btn ${activeTab === 'service_features' ? 'active' : ''}`} onClick={() => handleTabChange('service_features')}>
          <FiShield /> Service Features
        </button>
        <button className={`admin-tab-btn ${activeTab === 'collections' ? 'active' : ''}`} onClick={() => handleTabChange('collections')}>
          <FiGrid /> Collections Grid
        </button>
        <button className={`admin-tab-btn ${activeTab === 'best_sellers' ? 'active' : ''}`} onClick={() => handleTabChange('best_sellers')}>
          <FiShoppingBag /> Best Selling Products
        </button>
        <button className={`admin-tab-btn ${activeTab === 'promotions' ? 'active' : ''}`} onClick={() => handleTabChange('promotions')}>
          <FiGift /> Promo Blocks
        </button>
        <button className={`admin-tab-btn ${activeTab === 'lookbook' ? 'active' : ''}`} onClick={() => handleTabChange('lookbook')}>
          <FiFileText /> Lookbook 2026
        </button>
        <button className={`admin-tab-btn ${activeTab === 'newsletter' ? 'active' : ''}`} onClick={() => handleTabChange('newsletter')}>
          <FiTag /> Newsletter VIP
        </button>
        <button className={`admin-tab-btn ${activeTab === 'footer' ? 'active' : ''}`} onClick={() => handleTabChange('footer')}>
          <FiShare2 /> Footer Links
        </button>
        <button className={`admin-tab-btn ${activeTab === 'global' ? 'active' : ''}`} onClick={() => handleTabChange('global')}>
          <FiSettings /> Global & SEO
        </button>
      </div>

      {/* TAB 1: SECTIONS LAYOUT ORDER */}
      {activeTab === 'sections' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1">Homepage Section Order & Visibility Management</h4>
              <p className="text-muted small mb-0">Control the top-to-bottom section rendering sequence and visibility for both Desktop and Mobile experiences.</p>
            </div>
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Layout
            </button>
          </div>

          {/* Desktop vs Mobile Section Sub-Tabs */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <button
              type="button"
              className={`btn btn-sm d-inline-flex align-items-center gap-2 ${sectionDeviceTab === 'desktop' ? 'btn-danger text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setSectionDeviceTab('desktop')}
            >
              <FiMonitor /> Desktop Layout ({sections.length} Sections)
            </button>
            <button
              type="button"
              className={`btn btn-sm d-inline-flex align-items-center gap-2 ${sectionDeviceTab === 'mobile' ? 'btn-danger text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setSectionDeviceTab('mobile')}
            >
              <FiSmartphone /> Mobile Layout ({sections.length} Sections)
            </button>
          </div>

          <div className="alert alert-light border d-flex align-items-center justify-content-between py-2 px-3 mb-3 small">
            <div>
              <strong>{sectionDeviceTab === 'desktop' ? '🖥️ Desktop Browser Layout' : '📱 Mobile App & Browser Layout'}</strong>: 
              <span className="text-muted ms-1">
                {sectionDeviceTab === 'desktop' 
                  ? 'Showing live section sequencing for desktop viewports. Same order & visibility sync across desktop and mobile.' 
                  : 'Showing live section sequencing for mobile smartphones. Same order & visibility sync across desktop and mobile.'}
              </span>
            </div>
            <span className="badge bg-dark text-white text-uppercase">{sections.filter(s => s.is_visible !== false).length} Active Sections</span>
          </div>

          <div className="table-responsive">
            <table className="admin-matrix-table align-middle">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ORDER</th>
                  <th>SECTION KEY</th>
                  <th>SECTION TITLE</th>
                  <th>SUBTITLE</th>
                  <th>VISIBILITY</th>
                  <th className="text-end pe-4">MOVE ORDER</th>
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
                        <label className="form-check-label small text-muted ms-1" htmlFor={`switch-${sec.section_key}`}>
                          {sec.is_visible !== false ? 'Enabled' : 'Disabled'}
                        </label>
                      </div>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-1">
                        <button 
                          type="button"
                          className="btn-admin-outline" 
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <FiArrowUp /> Move Up
                        </button>
                        <button 
                          type="button"
                          className="btn-admin-outline" 
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === sections.length - 1}
                        >
                          <FiArrowDown /> Move Down
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

      {/* TAB 2: ANNOUNCEMENT BAR */}
      {activeTab === 'announcement' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1">Top Announcement Bar Settings</h4>
              <p className="text-muted small mb-0">Configure the top notification message strip shown above the main website header.</p>
            </div>
            <button className="btn-admin-red" onClick={openAddAnnouncementModal}>
              <FiPlus /> Add Announcement
            </button>
          </div>

          <div className="form-check form-switch mb-3">
            <input 
              className="form-check-input" 
              type="checkbox"
              checked={announcementConfig.enabled}
              onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              id="announcement-enabled-toggle"
            />
            <label className="form-check-label fw-bold text-dark" htmlFor="announcement-enabled-toggle">
              Enable Announcement Bar on Homepage
            </label>
          </div>

          {/* Announcements List */}
          <div className="mb-4">
            <label className="admin-form-label mb-2">Announcement Messages (Auto-rotates if multiple)</label>
            {announcementConfig.announcements.length === 0 ? (
              <div className="text-muted text-center py-4">No announcements yet. Click "Add Announcement" to create one.</div>
            ) : (
              <div className="table-responsive">
                <table className="admin-matrix-table align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Message</th>
                      <th>Highlighted Text</th>
                      <th>Link</th>
                      <th className="text-end" style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcementConfig.announcements.map((ann, idx) => (
                      <tr key={ann.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div className="fw-medium text-dark" style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ann.message}
                          </div>
                        </td>
                        <td><code className="cat-slug-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>{ann.highlightedText || '—'}</code></td>
                        <td>{ann.link ? <a href={ann.link} target="_blank" rel="noopener" className="text-primary">{ann.link}</a> : <span className="text-muted">—</span>}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <button 
                              className="btn-admin-outline py-1 px-2"
                              onClick={() => openEditAnnouncementModal(ann)}
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                            <button 
                              className="btn-admin-outline py-1 px-2 text-danger"
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Styling Options */}
          <div className="row g-3 mt-3 pt-3 border-top">
            <div className="col-md-4">
              <label className="admin-form-label">Background Color</label>
              <input 
                type="color" 
                className="form-control form-control-color w-100" 
                value={announcementConfig.backgroundColor}
                onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
              />
            </div>

            <div className="col-md-4">
              <label className="admin-form-label">Text Color</label>
              <input 
                type="color" 
                className="form-control form-control-color w-100" 
                value={announcementConfig.textColor}
                onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, textColor: e.target.value }))}
              />
            </div>

            <div className="col-md-4">
              <label className="admin-form-label">Highlight Accent Color</label>
              <input 
                type="color" 
                className="form-control form-control-color w-100" 
                value={announcementConfig.accentColor}
                onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, accentColor: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Announcement Bar
            </button>
          </div>

          {/* Announcement Modal */}
          {isAnnouncementModalOpen && (
            <div className="admin-modal-backdrop" onClick={() => setIsAnnouncementModalOpen(false)}>
              <div className="admin-modal-box" style={{ width: '560px', maxWidth: '96vw' }} onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header d-flex align-items-center justify-content-between pb-3 border-bottom">
                  <h3 className="mb-0 font-weight-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                    <FiVolume2 className="text-danger" /> {editingAnnouncement ? 'Edit Announcement' : 'Add Announcement'}
                  </h3>
                  <button className="close-modal-btn" onClick={() => setIsAnnouncementModalOpen(false)}><FiX /></button>
                </div>
                <form onSubmit={handleSaveAnnouncement} className="admin-modal-body py-3">
                  <div className="row g-3" style={{ margin: 0 }}>
                    <div className="col-12">
                      <label className="admin-form-label">Announcement Message *</label>
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={announcementFormData.message}
                        onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="FREE SHIPPING ON ORDERS ABOVE ₹1499 | EASY 7 DAYS RETURNS"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="admin-form-label">Highlighted Words / Numbers (Red)</label>
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={announcementFormData.highlightedText}
                        onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, highlightedText: e.target.value }))}
                        placeholder="e.g. ₹1499, 7 DAYS, FREE SHIPPING"
                      />
                      <div className="text-muted extra-small mt-1">Separate multiple words/phrases with commas (e.g. <code>₹1499, 7 DAYS</code>)</div>
                    </div>

                    <div className="col-md-6">
                      <label className="admin-form-label">Link URL (Optional)</label>
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={announcementFormData.link}
                        onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, link: e.target.value }))}
                        placeholder="https://example.com/offer"
                      />
                    </div>
                  </div>

                  <div className="admin-modal-footer d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                    <button type="button" className="btn-admin-outline" onClick={() => setIsAnnouncementModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn-admin-red d-flex align-items-center gap-2">
                      <FiCheck /> {editingAnnouncement ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HERO SLIDES */}
      {activeTab === 'carousel' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1">Hero Slider Slides</h4>
              <p className="text-muted small mb-0">Add, edit, or remove full-width editorial hero slides.</p>
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
                  <th>TITLE LINE 1 & 2</th>
                  <th>EYEBROW & BADGE</th>
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
                        style={{ width: 64, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                      />
                    </td>
                    <td><strong className="text-dark">{slide.title || 'OWN YOUR STYLE'}</strong></td>
                    <td>
                      <span className="badge bg-danger text-white me-1">{slide.badge_text || 'HERO'}</span>
                      <span className="text-muted small">{slide.subtitle}</span>
                    </td>
                    <td>
                      <div><code className="cat-slug-badge">{slide.cta_primary_text || 'SHOP NOW'}</code></div>
                      <div className="small text-muted mt-1">
                        <span className="me-2">{slide.cta_secondary_text || 'EXPLORE COLLECTIONS'}</span>
                        {slide.cta_primary_link && <code className="cat-slug-badge">{slide.cta_primary_link}</code>}
                      </div>
                    </td>
                    <td><strong>#{slide.display_order || 1}</strong></td>
                    <td className="text-end pe-4">
                      <button className="btn-admin-outline me-2" onClick={() => openEditSlideModal(slide)}>
                        <FiEdit /> Edit
                      </button>
                      <button className="btn-admin-outline text-danger" onClick={() => handleDeleteSlide(slide)}>
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

      {/* TAB 4: SERVICE FEATURES */}
      {activeTab === 'service_features' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Service & Trust Feature Blocks</h4>
            <p className="text-muted small mb-0">Configure the 4 horizontal trust features displayed immediately below the hero slider.</p>
          </div>

          <div className="row g-3">
            {serviceFeatures.map((item, idx) => (
              <div key={idx} className="col-md-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-dark">Feature #{idx + 1}</span>
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input"
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(e) => {
                          const updated = [...serviceFeatures];
                          updated[idx].enabled = e.target.checked;
                          setServiceFeatures(updated);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="admin-form-label small">Feature Title</label>
                    <input 
                      type="text" 
                      className="admin-input form-control-sm"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...serviceFeatures];
                        updated[idx].title = e.target.value;
                        setServiceFeatures(updated);
                      }}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label small">Feature Description</label>
                    <input 
                      type="text" 
                      className="admin-input form-control-sm"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...serviceFeatures];
                        updated[idx].description = e.target.value;
                        setServiceFeatures(updated);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Service Features
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: COLLECTIONS / CATEGORIES */}
      {activeTab === 'collections' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Collections (Discover Your Style) Configuration</h4>
            <p className="text-muted small mb-0">Select existing database categories to feature on the homepage.</p>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Section Eyebrow Label</label>
              <input 
                type="text" 
                className="admin-input"
                value={collectionsConfig.eyebrow}
                onChange={(e) => setCollectionsConfig(prev => ({ ...prev, eyebrow: e.target.value }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Section Main Heading</label>
              <input 
                type="text" 
                className="admin-input"
                value={collectionsConfig.heading}
                onChange={(e) => setCollectionsConfig(prev => ({ ...prev, heading: e.target.value }))}
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Available Categories in Database</label>
              <div className="d-flex flex-wrap gap-2 p-3 border rounded bg-light">
                {dbCategories.map(cat => {
                  const isSelected = collectionsConfig.selectedCategories?.includes(cat.name);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={isSelected ? 'btn-admin-red' : 'btn-admin-outline'}
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                      onClick={() => {
                        setCollectionsConfig(prev => {
                          const current = prev.selectedCategories || [];
                          const updated = isSelected ? current.filter(c => c !== cat.name) : [...current, cat.name];
                          return { ...prev, selectedCategories: updated };
                        });
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{cat.name}
                    </button>
                  );
                })}
              </div>
              <span className="form-text text-muted extra-small">Click categories to toggle their selection on the homepage.</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Collections
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: BEST SELLING PRODUCTS */}
      {activeTab === 'best_sellers' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Best Selling Products Section</h4>
            <p className="text-muted small mb-0">Configure product section headers and display options.</p>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Section Eyebrow</label>
              <input 
                type="text" 
                className="admin-input"
                value={bestSellersConfig.eyebrow}
                onChange={(e) => setBestSellersConfig(prev => ({ ...prev, eyebrow: e.target.value }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Section Main Heading</label>
              <input 
                type="text" 
                className="admin-input"
                value={bestSellersConfig.heading}
                onChange={(e) => setBestSellersConfig(prev => ({ ...prev, heading: e.target.value }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Product Display Limit</label>
              <input 
                type="number" 
                className="admin-input"
                value={bestSellersConfig.productLimit}
                onChange={(e) => setBestSellersConfig(prev => ({ ...prev, productLimit: Number(e.target.value) || 5 }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Product Source Strategy</label>
              <select 
                className="form-select admin-input"
                value={bestSellersConfig.productSource}
                onChange={(e) => setBestSellersConfig(prev => ({ ...prev, productSource: e.target.value }))}
              >
                <option value="Best Selling">Best Selling Products</option>
                <option value="Latest Products">Latest Products</option>
                <option value="Featured Products">Featured Products</option>
              </select>
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Best Sellers
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: PROMO BLOCKS */}
      {activeTab === 'promotions' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Three-Block Promotional Area</h4>
            <p className="text-muted small mb-0">Configure titles, discount text, and images for the 3 promo cards.</p>
          </div>

          <div className="row g-4">
            {/* Block 1 */}
            <div className="col-md-4">
              <div className="p-3 border rounded-3 bg-light">
                <h6 className="fw-bold text-dark mb-3">Block 1 (Left - Combo Offers)</h6>
                <div className="mb-2">
                  <label className="admin-form-label small">Title</label>
                  <input 
                    type="text" 
                    className="admin-input form-control-sm"
                    value={promotionsConfig.block1?.title}
                    onChange={(e) => setPromotionsConfig(prev => ({ ...prev, block1: { ...prev.block1, title: e.target.value } }))}
                  />
                </div>
                <div className="mb-2">
                  <label className="admin-form-label small">Subtitle</label>
                  <input 
                    type="text" 
                    className="admin-input form-control-sm"
                    value={promotionsConfig.block1?.subtitle}
                    onChange={(e) => setPromotionsConfig(prev => ({ ...prev, block1: { ...prev.block1, subtitle: e.target.value } }))}
                  />
                </div>
                <div>
                  <label className="admin-form-label small">Button Link</label>
                  <input 
                    type="text" 
                    className="admin-input form-control-sm"
                    value={promotionsConfig.block1?.buttonLink}
                    onChange={(e) => setPromotionsConfig(prev => ({ ...prev, block1: { ...prev.block1, buttonLink: e.target.value } }))}
                  />
                </div>
              </div>
            </div>

            {/* Block 2 */}
            <div className="col-md-4">
              <div className="p-3 border rounded-3 bg-light">
                <h6 className="fw-bold text-dark mb-3">Block 2 (Center Banner - 50% OFF)</h6>
                <div className="mb-2">
                  <label className="admin-form-label small">Discount Title</label>
                  <input 
                    type="text" 
                    className="admin-input form-control-sm"
                    value={promotionsConfig.block2?.discountTitle}
                    onChange={(e) => setPromotionsConfig(prev => ({ ...prev, block2: { ...prev.block2, discountTitle: e.target.value } }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="admin-form-label small">Subtitle</label>
                  <input 
                    type="text" 
                    className="admin-input form-control-sm"
                    value={promotionsConfig.block2?.subtitle}
                    onChange={(e) => setPromotionsConfig(prev => ({ ...prev, block2: { ...prev.block2, subtitle: e.target.value } }))}
                  />
                </div>
                
                {/* Upload Image (Cover Image) */}
                <div className="mb-3">
                  <FileUploadInput 
                    value={promotionsConfig.block2?.image || ''}
                    onChange={(url) => setPromotionsConfig(prev => ({ ...prev, block2: { ...prev.block2, image: url } }))}
                    type="image"
                    folder="hero"
                    label="COVER IMAGE (Upload Cover Image)"
                    recommendedSize="Recommended: 1200 x 800 px (3:2 Aspect Ratio, Max 10MB)"
                  />
                </div>

                {/* Upload Video (Autoplay Video) */}
                <div>
                  <FileUploadInput 
                    value={promotionsConfig.block2?.videoUrl || ''}
                    onChange={(url) => setPromotionsConfig(prev => ({ ...prev, block2: { ...prev.block2, videoUrl: url } }))}
                    type="video"
                    folder="videos"
                    label="BACKGROUND VIDEO (Upload Video)"
                    recommendedSize="Recommended: 1920 x 1080 px (16:9 Full HD MP4/WebM, Max 50MB)"
                  />
                </div>
              </div>
            </div>

            {/* Block 3 */}
            <div className="col-md-4">
              <div className="p-3 border rounded-3 bg-light">
                <h6 className="fw-bold text-dark mb-3">Block 3 (Right - New Arrivals)</h6>
                <div className="mb-2">
                  <label className="admin-form-label small">Title</label>
                  <input 
                    type="text" 
                    className="admin-input form-control-sm"
                    value={promotionsConfig.block3?.title}
                    onChange={(e) => setPromotionsConfig(prev => ({ ...prev, block3: { ...prev.block3, title: e.target.value } }))}
                  />
                </div>
                <div className="mb-2">
                  <label className="admin-form-label small">Subtitle</label>
                  <input 
                    type="text" 
                    className="admin-input form-control-sm"
                    value={promotionsConfig.block3?.subtitle}
                    onChange={(e) => setPromotionsConfig(prev => ({ ...prev, block3: { ...prev.block3, subtitle: e.target.value } }))}
                  />
                </div>
                <div>
                  <label className="admin-form-label small">Button Link</label>
                  <input 
                    type="text" 
                    className="admin-input form-control-sm"
                    value={promotionsConfig.block3?.buttonLink}
                    onChange={(e) => setPromotionsConfig(prev => ({ ...prev, block3: { ...prev.block3, buttonLink: e.target.value } }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Promo Blocks
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: LOOKBOOK 2026 */}
      {activeTab === 'lookbook' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Lookbook Editorial Section</h4>
            <p className="text-muted small mb-0">Configure title, year highlight, description, and editorial banner image.</p>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Lookbook Title</label>
              <input 
                type="text" 
                className="admin-input"
                value={lookbookConfig.title}
                onChange={(e) => setLookbookConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Highlight Year Text (Highlighted in RED)</label>
              <input 
                type="text" 
                className="admin-input"
                value={lookbookConfig.year}
                onChange={(e) => setLookbookConfig(prev => ({ ...prev, year: e.target.value }))}
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Description Text</label>
              <input 
                type="text" 
                className="admin-input"
                value={lookbookConfig.description}
                onChange={(e) => setLookbookConfig(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="col-12">
              <FileUploadInput 
                value={lookbookConfig.image} 
                onChange={(url) => setLookbookConfig(prev => ({ ...prev, image: url }))} 
                type="image" 
                folder="lookbook" 
                label="Editorial Banner Image" 
                placeholder="Upload or paste image URL..." 
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Lookbook
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: NEWSLETTER */}
      {activeTab === 'newsletter' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Newsletter VIP Club</h4>
            <p className="text-muted small mb-0">Configure title, description, and discount coupon code awarded upon subscription.</p>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Newsletter Title</label>
              <input 
                type="text" 
                className="admin-input"
                value={newsletterConfig.title}
                onChange={(e) => setNewsletterConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Discount Code Awarded</label>
              <input 
                type="text" 
                className="admin-input"
                value={newsletterConfig.discountCode}
                onChange={(e) => setNewsletterConfig(prev => ({ ...prev, discountCode: e.target.value }))}
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Description Text</label>
              <input 
                type="text" 
                className="admin-input"
                value={newsletterConfig.description}
                onChange={(e) => setNewsletterConfig(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Newsletter Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 10: FOOTER LINKS */}
      {activeTab === 'footer' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Footer Content & Social Links</h4>
            <p className="text-muted small mb-0">Manage footer brand bio, copyright text, and social profiles.</p>
          </div>

          <div className="row g-3">
            <div className="col-12">
              <label className="admin-form-label">Footer Brand Bio</label>
              <textarea 
                className="admin-input"
                rows={3}
                value={footerConfig.bio}
                onChange={(e) => setFooterConfig(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Copyright Notice Text</label>
              <input 
                type="text" 
                className="admin-input"
                value={footerConfig.copyright}
                onChange={(e) => setFooterConfig(prev => ({ ...prev, copyright: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Footer
            </button>
          </div>
        </div>
      )}

      {/* TAB 11: GLOBAL & SEO */}
      {activeTab === 'global' && (
        <div className="admin-card-white p-4">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold text-dark mb-1">Global Theme Colors & SEO Metadata</h4>
            <p className="text-muted small mb-0">Configure primary theme colors, sticky header, and meta tags for search engines.</p>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">SEO Page Title</label>
              <input 
                type="text" 
                className="admin-input"
                value={globalSettings.seoTitle}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, seoTitle: e.target.value }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">SEO Meta Description</label>
              <input 
                type="text" 
                className="admin-input"
                value={globalSettings.seoDescription}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, seoDescription: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Global Settings
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Hero Slide Form */}
      <Modal isOpen={isSlideModalOpen} onClose={() => setIsSlideModalOpen(false)} title={editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}>
        <form onSubmit={handleSaveSlide}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Headline Title (Use \n for line break) *</label>
              <input type="text" className="admin-input" value={slideFormData.title} onChange={(e) => setSlideFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. OWN YOUR\nSTYLE" required />
            </div>
            <div className="col-md-6">
              <label className="admin-form-label">Eyebrow Subtitle</label>
              <input type="text" className="admin-input" value={slideFormData.subtitle} onChange={(e) => setSlideFormData(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="PREMIUM MEN'S WEAR" />
            </div>
            <div className="col-12">
              <label className="admin-form-label">Supporting Description</label>
              <input type="text" className="admin-input" value={slideFormData.description} onChange={(e) => setSlideFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Premium menswear crafted for confidence, comfort and timeless style." />
            </div>
            <div className="col-md-6">
              <FileUploadInput value={slideFormData.image_url} onChange={(url) => setSlideFormData(prev => ({ ...prev, image_url: url }))} type="image" folder="hero" label="Desktop Banner Image URL *" placeholder="Upload desktop image URL..." />
            </div>
            <div className="col-md-6">
              <FileUploadInput value={slideFormData.mobile_image_url} onChange={(url) => setSlideFormData(prev => ({ ...prev, mobile_image_url: url }))} type="image" folder="hero" label="Mobile Banner Image URL (Optional)" placeholder="Upload mobile image URL..." />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <h5 className="fw-bold text-dark mb-1">CTA Buttons</h5>
            <p className="text-muted small mb-3">Set the button label and redirect link for each call-to-action.</p>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="admin-form-label">Primary CTA Label</label>
                <input type="text" className="admin-input" value={slideFormData.cta_primary_text} onChange={(e) => setSlideFormData(prev => ({ ...prev, cta_primary_text: e.target.value }))} placeholder="e.g. SHOP NOW" />
              </div>
              <div className="col-md-6">
                <label className="admin-form-label">Primary CTA Link</label>
                <input type="text" className="admin-input" value={slideFormData.cta_primary_link} onChange={(e) => setSlideFormData(prev => ({ ...prev, cta_primary_link: e.target.value }))} placeholder="e.g. /shop or https://..." />
              </div>
              <div className="col-md-6">
                <label className="admin-form-label">Secondary CTA Label</label>
                <input type="text" className="admin-input" value={slideFormData.cta_secondary_text} onChange={(e) => setSlideFormData(prev => ({ ...prev, cta_secondary_text: e.target.value }))} placeholder="e.g. EXPLORE COLLECTIONS" />
              </div>
              <div className="col-md-6">
                <label className="admin-form-label">Secondary CTA Link</label>
                <input type="text" className="admin-input" value={slideFormData.cta_secondary_link} onChange={(e) => setSlideFormData(prev => ({ ...prev, cta_secondary_link: e.target.value }))} placeholder="e.g. /shop?category=Shirts or https://..." />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsSlideModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">Save Slide</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HomepageSettings;
