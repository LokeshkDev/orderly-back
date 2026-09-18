import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FiGrid, FiImage, FiVideo, FiSave, FiPlus, FiEdit, FiTrash2, 
  FiEye, FiEyeOff, FiArrowUp, FiArrowDown, FiLayers, FiSliders, FiFilm, FiMenu,
  FiVolume2, FiShare2, FiCheck, FiSearch, FiGlobe, FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiLinkedin,
  FiShoppingBag, FiTruck, FiRotateCcw, FiShield, FiHeadphones, FiExternalLink, FiSettings, FiTag, FiGift, FiFileText,
  FiMonitor, FiSmartphone, FiX, FiTrendingUp, FiZap, FiPlay, FiChevronDown, FiChevronUp, FiCornerDownRight
} from 'react-icons/fi';
import { FaWhatsapp, FaTwitter, FaPinterest, FaTiktok } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import Modal from '../../components/common/Modal';
import FileUploadInput from '../../components/common/FileUploadInput';
import StatusBadge from '../../components/common/StatusBadge';
import { getYouTubeThumbnail, getYouTubeVideoId } from '../../utils/videoUtils';
import './HomepageSettings.css';

const DEFAULT_FOOTER_SETTINGS = {
  bio: "Orderly is your destination for premium men's wear. Crafted for style, built for comfort, made for you.",
  copyright: "© 2026 Orderly. All Rights Reserved.",
  social_links: [
    { id: 'soc-1', platform: 'facebook', name: 'Facebook', url: 'https://facebook.com', enabled: true },
    { id: 'soc-2', platform: 'instagram', name: 'Instagram', url: 'https://instagram.com', enabled: true },
    { id: 'soc-3', platform: 'twitter', name: 'Twitter / X', url: 'https://twitter.com', enabled: true },
    { id: 'soc-4', platform: 'youtube', name: 'YouTube', url: 'https://youtube.com', enabled: true }
  ],
  columns: [
    {
      id: 'col-1',
      title: 'SHOP',
      links: [
        { id: 'link-1-1', label: 'All Products', url: '/shop' },
        { id: 'link-1-2', label: 'Shirts', url: '/shop?category=Shirts' },
        { id: 'link-1-3', label: 'T-Shirts', url: '/shop?category=Tees' },
        { id: 'link-1-4', label: 'Pants', url: '/shop?category=Pants' },
        { id: 'link-1-5', label: 'Jackets', url: '/shop?category=Jackets' },
        { id: 'link-1-6', label: 'Accessories', url: '/shop?category=Accessories' }
      ]
    },
    {
      id: 'col-2',
      title: 'CUSTOMER CARE',
      links: [
        { id: 'link-2-1', label: 'Track Order', url: '/contact' },
        { id: 'link-2-2', label: 'Returns & Refunds', url: '/returns-policy' },
        { id: 'link-2-3', label: 'Shipping Policy', url: '/shipping-policy' },
        { id: 'link-2-4', label: 'Size Guide', url: '/about' },
        { id: 'link-2-5', label: 'FAQs', url: '/contact' },
        { id: 'link-2-6', label: 'Contact Us', url: '/contact' }
      ]
    },
    {
      id: 'col-3',
      title: 'COMPANY',
      links: [
        { id: 'link-3-1', label: 'About Us', url: '/about' },
        { id: 'link-3-2', label: 'Our Story', url: '/about' },
        { id: 'link-3-3', label: 'Careers', url: '/about' },
        { id: 'link-3-4', label: 'Privacy Policy', url: '/returns-policy' },
        { id: 'link-3-5', label: 'Terms & Conditions', url: '/shipping-policy' }
      ]
    }
  ]
};

const SOCIAL_PLATFORMS = [
  { key: 'facebook', name: 'Facebook', icon: <FiFacebook /> },
  { key: 'instagram', name: 'Instagram', icon: <FiInstagram /> },
  { key: 'twitter', name: 'Twitter / X', icon: <FiTwitter /> },
  { key: 'youtube', name: 'YouTube', icon: <FiYoutube /> },
  { key: 'whatsapp', name: 'WhatsApp', icon: <FaWhatsapp /> },
  { key: 'linkedin', name: 'LinkedIn', icon: <FiLinkedin /> },
  { key: 'pinterest', name: 'Pinterest', icon: <FaPinterest /> },
  { key: 'tiktok', name: 'TikTok', icon: <FaTiktok /> }
];

const DEFAULT_HEADER_MENU_LINKS = [
  { 
    id: 'nav-1', 
    label: 'SHOP', 
    url: '/shop', 
    enabled: true, 
    is_external: false,
    sub_items: [
      { id: 'sub-1-1', label: 'ALL PRODUCTS', url: '/shop', enabled: true },
      { id: 'sub-1-2', label: 'SHIRTS', url: '/shop?category=Shirts', enabled: true },
      { id: 'sub-1-3', label: 'T-SHIRTS & POLOS', url: '/shop?category=Tees', enabled: true },
      { id: 'sub-1-4', label: 'PANTS & DENIM', url: '/shop?category=Pants', enabled: true },
      { id: 'sub-1-5', label: 'JACKETS', url: '/shop?category=Jackets', enabled: true }
    ]
  },
  { 
    id: 'nav-2', 
    label: 'COMBOS', 
    url: '/combos', 
    enabled: true, 
    is_external: false,
    sub_items: []
  }
];

const DEFAULT_SECTIONS = [
  { section_key: 'hero_carousel', title: 'Hero Carousel', subtitle: 'Main editorial hero slider', is_visible: true, display_order: 1 },
  { section_key: 'trust_features', title: 'Trust & Service Features Bar', subtitle: 'Free Shipping, Easy Returns, Premium Quality & Support', is_visible: true, display_order: 2 },
  { section_key: 'shop_by_category', title: 'Shop by Category (Collections)', subtitle: 'Discover Your Style categories grid', is_visible: true, display_order: 3 },
  { section_key: 'combo_categories', title: 'Shop by Combo Category', subtitle: 'Curated combo category grid', is_visible: true, display_order: 4 },
  { section_key: 'video_banner', title: 'Video Campaign Section', subtitle: 'YouTube Brand Video Showcase', is_visible: true, display_order: 5 },
  { section_key: 'trending_arrivals', title: 'Best Selling Products', subtitle: 'Handpicked products grid', is_visible: true, display_order: 6 },
  { section_key: 'promo_offers', title: 'Promotional Offers (3 Blocks)', subtitle: 'Combo offers, 50% Off banner, New arrivals', is_visible: true, display_order: 7 },
  { section_key: 'lookbook_banner', title: 'The Lookbook Editorial', subtitle: 'Large luxury editorial campaign banner', is_visible: true, display_order: 8 },
  { section_key: 'newsletter_section', title: 'Newsletter VIP Club', subtitle: 'Email subscription CTA banner', is_visible: true, display_order: 9 },
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

  // Category options for navigation builder (single products, combos, and subcategories)
  const navigationCategoryOptions = React.useMemo(() => {
    if (!Array.isArray(dbCategories)) return { productCategories: [], comboCategories: [] };
    const productParents = dbCategories.filter(c => !c.parent_id && (c.type || 'product') === 'product');
    const comboParents = dbCategories.filter(c => !c.parent_id && c.type === 'combo');

    return {
      productCategories: productParents.map(parent => ({
        ...parent,
        subcategories: dbCategories.filter(sub => Number(sub.parent_id) === Number(parent.id))
      })),
      comboCategories: comboParents.map(parent => ({
        ...parent,
        subcategories: dbCategories.filter(sub => Number(sub.parent_id) === Number(parent.id))
      }))
    };
  }, [dbCategories]);
  const [bestSellersConfig, setBestSellersConfig] = useState({
    eyebrow: 'TRENDING NOW',
    heading: 'BEST SELLING & NEW ARRIVALS',
    bestsellerHeading: 'BEST SELLING PRODUCTS',
    newArrivalHeading: 'NEW ARRIVALS',
    displayMode: 'tabs', // 'tabs' | 'stacked'
    autoplayDelay: 3500,
    selectedBestsellers: [],
    selectedNewArrivals: [],
    productSource: 'Best Selling',
    productLimit: 10,
    showRating: true,
    showWishlist: true,
    showAddToCart: true
  });
  const [dbProducts, setDbProducts] = useState([]);
  const [trendingAdminTab, setTrendingAdminTab] = useState('bestsellers');
  const [trendingSearch, setTrendingSearch] = useState('');
  const [trendingCategoryFilter, setTrendingCategoryFilter] = useState('All');

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

  // Footer Config State & Full CMS Columns & Social Links State
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

  const [footerSettings, setFooterSettings] = useState(DEFAULT_FOOTER_SETTINGS);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState(null);
  const [socialForm, setSocialForm] = useState({ platform: 'instagram', name: 'Instagram', url: '', enabled: true });
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [colTitleInput, setColTitleInput] = useState('');

  // Header Navbar Menu Links State
  const [headerMenuLinks, setHeaderMenuLinks] = useState(DEFAULT_HEADER_MENU_LINKS);
  const [isHeaderNavModalOpen, setIsHeaderNavModalOpen] = useState(false);
  const [editingHeaderNav, setEditingHeaderNav] = useState(null);
  const [headerNavForm, setHeaderNavForm] = useState({ label: '', url: '/shop', enabled: true, is_external: false });

  // Video Banner Section State
  const [videoBannerConfig, setVideoBannerConfig] = useState({
    enabled: true,
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    autoplay: false,
    title: 'EXPERIENCE THE CRAFT',
    subtitle: 'CAMPAIGN FILM',
    description: "A cinematic glimpse into Orderly's signature tailoring, precision cuts, and refined luxury textures.",
    cover_image: '',
    badge_text: 'EXCLUSIVE PREVIEW'
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
      let fetchedProds = [];
      if (prodsRes.status === 'fulfilled' && prodsRes.value.data?.success && Array.isArray(prodsRes.value.data.data)) {
        fetchedProds = prodsRes.value.data.data;
        setDbProducts(fetchedProds);
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
        
        const bConfig = st.trending_arrivals_config || st.best_sellers_config;
        if (bConfig) {
          const bsFromDb = fetchedProds.filter(p => p.is_bestseller).map(p => p.id);
          const naFromDb = fetchedProds.filter(p => p.is_new_arrival).map(p => p.id);
          const initialBs = Array.isArray(bConfig.selectedBestsellers) && bConfig.selectedBestsellers.length > 0 
            ? bConfig.selectedBestsellers 
            : (Array.isArray(bConfig.selectedProducts) && bConfig.selectedProducts.length > 0 ? bConfig.selectedProducts : (bsFromDb.length > 0 ? bsFromDb : fetchedProds.slice(0, 5).map(p => p.id)));
          const initialNa = Array.isArray(bConfig.selectedNewArrivals) && bConfig.selectedNewArrivals.length > 0 
            ? bConfig.selectedNewArrivals 
            : (naFromDb.length > 0 ? naFromDb : fetchedProds.slice(2, 7).map(p => p.id));

          setBestSellersConfig(prev => ({
            ...prev,
            ...bConfig,
            selectedBestsellers: initialBs,
            selectedNewArrivals: initialNa
          }));
        } else if (fetchedProds.length > 0) {
          const bsFromDb = fetchedProds.filter(p => p.is_bestseller).map(p => p.id);
          const naFromDb = fetchedProds.filter(p => p.is_new_arrival).map(p => p.id);
          setBestSellersConfig(prev => ({
            ...prev,
            selectedBestsellers: bsFromDb.length > 0 ? bsFromDb : fetchedProds.slice(0, 5).map(p => p.id),
            selectedNewArrivals: naFromDb.length > 0 ? naFromDb : fetchedProds.slice(2, 7).map(p => p.id)
          }));
        }

        if (st.video_banner_config) {
          setVideoBannerConfig(prev => ({ ...prev, ...st.video_banner_config }));
          setSections(prev => prev.map(s => s.section_key === 'video_banner' ? {
            ...s,
            title: st.video_banner_config.title || s.title,
            subtitle: st.video_banner_config.subtitle || s.subtitle
          } : s));
        }
        if (st.promotions_config) setPromotionsConfig(prev => ({ ...prev, ...st.promotions_config }));
        if (st.lookbook_config) setLookbookConfig(prev => ({ ...prev, ...st.lookbook_config }));
        if (st.newsletter_config) setNewsletterConfig(prev => ({ ...prev, ...st.newsletter_config }));
        if (st.footer_config) setFooterConfig(prev => ({ ...prev, ...st.footer_config }));
        if (st.footer_settings) {
          try {
            const parsedFooter = typeof st.footer_settings === 'string'
              ? JSON.parse(st.footer_settings)
              : st.footer_settings;
            if (parsedFooter && typeof parsedFooter === 'object') {
              setFooterSettings({
                ...DEFAULT_FOOTER_SETTINGS,
                ...parsedFooter
              });
            }
          } catch (e) {}
        }
        if (st.header_menu_links) {
          try {
            const parsedNav = typeof st.header_menu_links === 'string'
              ? JSON.parse(st.header_menu_links)
              : st.header_menu_links;
            if (Array.isArray(parsedNav) && parsedNav.length > 0) {
              setHeaderMenuLinks(parsedNav);
            }
          } catch (e) {}
        }
        if (st.global_homepage_settings) setGlobalSettings(prev => ({ ...prev, ...st.global_homepage_settings }));
      }
    } catch (err) {
      console.warn('CMS load note:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // State for expanded parent rows on table
  const [expandedNavIds, setExpandedNavIds] = useState({});

  const toggleExpandNav = (id) => {
    setExpandedNavIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Sub-Menu / Dropdown Link Handlers for Header Menu Items
  const handleAddSubNav = (parentId) => {
    const newSub = {
      id: `sub-${Date.now()}`,
      label: 'NEW SUB LINK',
      url: '/shop',
      enabled: true
    };
    setHeaderMenuLinks(prev => prev.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          sub_items: [...(item.sub_items || []), newSub]
        };
      }
      return item;
    }));
    setExpandedNavIds(prev => ({ ...prev, [parentId]: true }));
    toast.success('Added new sub-link!');
  };

  const handleSubNavChange = (parentId, subId, field, value) => {
    setHeaderMenuLinks(prev => prev.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          sub_items: (item.sub_items || []).map(s => s.id === subId ? { ...s, [field]: value } : s)
        };
      }
      return item;
    }));
  };

  const handleDeleteSubNav = (parentId, subId) => {
    setHeaderMenuLinks(prev => prev.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          sub_items: (item.sub_items || []).filter(s => s.id !== subId)
        };
      }
      return item;
    }));
  };

  const handleToggleSubNav = (parentId, subId) => {
    setHeaderMenuLinks(prev => prev.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          sub_items: (item.sub_items || []).map(s => s.id === subId ? { ...s, enabled: !s.enabled } : s)
        };
      }
      return item;
    }));
  };

  // Header Navbar Menu Link Handlers
  const openAddHeaderNavModal = () => {
    setEditingHeaderNav(null);
    setHeaderNavForm({ label: '', url: '/shop', enabled: true, is_external: false, sub_items: [] });
    setIsHeaderNavModalOpen(true);
  };

  const openEditHeaderNavModal = (navItem) => {
    setEditingHeaderNav(navItem);
    setHeaderNavForm({
      ...navItem,
      sub_items: Array.isArray(navItem.sub_items) ? [...navItem.sub_items] : []
    });
    setIsHeaderNavModalOpen(true);
  };

  const handleSaveHeaderNav = (e) => {
    e.preventDefault();
    if (!headerNavForm.label.trim() || !headerNavForm.url.trim()) {
      toast.error('Menu item label and URL are required');
      return;
    }

    if (editingHeaderNav) {
      setHeaderMenuLinks(prev => prev.map(item => item.id === editingHeaderNav.id ? { 
        ...headerNavForm, 
        label: headerNavForm.label.toUpperCase().trim(),
        sub_items: headerNavForm.sub_items || []
      } : item));
      toast.success(`Updated "${headerNavForm.label}" menu item!`);
    } else {
      const newItem = {
        id: `nav-${Date.now()}`,
        label: headerNavForm.label.toUpperCase().trim(),
        url: headerNavForm.url.trim(),
        enabled: headerNavForm.enabled !== false,
        is_external: !!headerNavForm.is_external,
        sub_items: headerNavForm.sub_items || []
      };
      setHeaderMenuLinks(prev => [...prev, newItem]);
      toast.success(`Added "${newItem.label}" menu item!`);
    }
    setIsHeaderNavModalOpen(false);
  };

  const handleModalAddSubItem = () => {
    const newSub = {
      id: `sub-${Date.now()}`,
      label: 'NEW SUB LINK',
      url: '/shop',
      enabled: true
    };
    setHeaderNavForm(prev => ({
      ...prev,
      sub_items: [...(prev.sub_items || []), newSub]
    }));
  };

  const handleModalSubItemChange = (subId, field, val) => {
    setHeaderNavForm(prev => ({
      ...prev,
      sub_items: (prev.sub_items || []).map(s => s.id === subId ? { ...s, [field]: val } : s)
    }));
  };

  const handleModalDeleteSubItem = (subId) => {
    setHeaderNavForm(prev => ({
      ...prev,
      sub_items: (prev.sub_items || []).filter(s => s.id !== subId)
    }));
  };

  const handleDeleteHeaderNav = (id, label) => {
    if (window.confirm(`Delete menu link "${label}"?`)) {
      setHeaderMenuLinks(prev => prev.filter(item => item.id !== id));
      toast.success(`Removed menu link "${label}"`);
    }
  };

  const handleToggleHeaderNav = (id) => {
    setHeaderMenuLinks(prev => prev.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const moveHeaderNav = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= headerMenuLinks.length) return;

    const updated = [...headerMenuLinks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setHeaderMenuLinks(updated);
  };

  // Column Management Handlers
  const handleAddColumn = () => {
    if (!colTitleInput.trim()) {
      toast.error('Please enter a column title');
      return;
    }
    const newCol = {
      id: `col-${Date.now()}`,
      title: colTitleInput.trim().toUpperCase(),
      links: []
    };
    setFooterSettings(prev => ({
      ...prev,
      columns: [...(prev.columns || []), newCol]
    }));
    setColTitleInput('');
    setIsColModalOpen(false);
    toast.success(`Added column "${newCol.title}"`);
  };

  const handleDeleteColumn = (colId, colTitle) => {
    if (window.confirm(`Delete column "${colTitle}" and all its links?`)) {
      setFooterSettings(prev => ({
        ...prev,
        columns: (prev.columns || []).filter(c => c.id !== colId)
      }));
      toast.success(`Removed column "${colTitle}"`);
    }
  };

  const handleColumnTitleChange = (colId, newTitle) => {
    setFooterSettings(prev => ({
      ...prev,
      columns: (prev.columns || []).map(c => c.id === colId ? { ...c, title: newTitle } : c)
    }));
  };

  const handleAddLink = (colId) => {
    const newLink = {
      id: `link-${Date.now()}`,
      label: 'New Link',
      url: '/shop'
    };
    setFooterSettings(prev => ({
      ...prev,
      columns: (prev.columns || []).map(c => {
        if (c.id === colId) {
          return { ...c, links: [...(c.links || []), newLink] };
        }
        return c;
      })
    }));
  };

  const handleLinkChange = (colId, linkId, field, value) => {
    setFooterSettings(prev => ({
      ...prev,
      columns: (prev.columns || []).map(c => {
        if (c.id === colId) {
          return {
            ...c,
            links: (c.links || []).map(l => l.id === linkId ? { ...l, [field]: value } : l)
          };
        }
        return c;
      })
    }));
  };

  const handleDeleteLink = (colId, linkId) => {
    setFooterSettings(prev => ({
      ...prev,
      columns: (prev.columns || []).map(c => {
        if (c.id === colId) {
          return {
            ...c,
            links: (c.links || []).filter(l => l.id !== linkId)
          };
        }
        return c;
      })
    }));
  };

  // Social Media Management Handlers
  const openAddSocialModal = () => {
    setEditingSocial(null);
    setSocialForm({ platform: 'instagram', name: 'Instagram', url: 'https://instagram.com', enabled: true });
    setIsSocialModalOpen(true);
  };

  const openEditSocialModal = (soc) => {
    setEditingSocial(soc);
    setSocialForm({ ...soc });
    setIsSocialModalOpen(true);
  };

  const handleSaveSocial = (e) => {
    e.preventDefault();
    if (!socialForm.url) {
      toast.error('Social profile URL is required');
      return;
    }
    const platObj = SOCIAL_PLATFORMS.find(p => p.key === socialForm.platform) || { name: socialForm.platform };

    if (editingSocial) {
      setFooterSettings(prev => ({
        ...prev,
        social_links: (prev.social_links || []).map(s => s.id === editingSocial.id ? { ...socialForm, name: platObj.name } : s)
      }));
      toast.success(`Updated ${platObj.name} link!`);
    } else {
      const newSoc = {
        id: `soc-${Date.now()}`,
        platform: socialForm.platform,
        name: platObj.name,
        url: socialForm.url,
        enabled: socialForm.enabled !== false
      };
      setFooterSettings(prev => ({
        ...prev,
        social_links: [...(prev.social_links || []), newSoc]
      }));
      toast.success(`Added ${platObj.name}!`);
    }
    setIsSocialModalOpen(false);
  };

  const handleDeleteSocial = (socId, socName) => {
    if (window.confirm(`Delete social link "${socName}"?`)) {
      setFooterSettings(prev => ({
        ...prev,
        social_links: (prev.social_links || []).filter(s => s.id !== socId)
      }));
      toast.success(`Removed ${socName}`);
    }
  };

  const handleToggleSocial = (socId) => {
    setFooterSettings(prev => ({
      ...prev,
      social_links: (prev.social_links || []).map(s => s.id === socId ? { ...s, enabled: !s.enabled } : s)
    }));
  };

  const getPlatformIcon = (platformKey) => {
    switch (platformKey) {
      case 'facebook': return <FiFacebook />;
      case 'instagram': return <FiInstagram />;
      case 'twitter': return <FiTwitter />;
      case 'youtube': return <FiYoutube />;
      case 'whatsapp': return <FaWhatsapp />;
      case 'linkedin': return <FiLinkedin />;
      case 'pinterest': return <FaPinterest />;
      case 'tiktok': return <FaTiktok />;
      default: return <FiShare2 />;
    }
  };

  // Toggle individual product on/off for Best Sellers or New Arrivals
  const handleToggleSectionProduct = async (productId, sectionType) => {
    const isBs = sectionType === 'bestsellers';
    const listKey = isBs ? 'selectedBestsellers' : 'selectedNewArrivals';
    const currentList = Array.isArray(bestSellersConfig[listKey]) ? bestSellersConfig[listKey] : [];
    const isCurrentlyActive = currentList.includes(productId);

    // Optimistic UI state update
    const updatedList = isCurrentlyActive 
      ? currentList.filter(id => id !== productId)
      : [...currentList, productId];

    setBestSellersConfig(prev => ({
      ...prev,
      [listKey]: updatedList
    }));

    // Sync product record flag in DB
    const flagKey = isBs ? 'is_bestseller' : 'is_new_arrival';
    try {
      await api.put(`/products/${productId}`, { [flagKey]: !isCurrentlyActive });
      setDbProducts(prev => prev.map(p => p.id === productId ? { ...p, [flagKey]: !isCurrentlyActive } : p));
      toast.success(`${isCurrentlyActive ? 'Removed from' : 'Added to'} ${isBs ? 'Best Sellers' : 'New Arrivals'}`);
    } catch (err) {
      toast.error('Failed to update product status');
    }
  };

  const filteredTrendingProducts = dbProducts.filter(p => {
    const matchesSearch = !trendingSearch || p.name.toLowerCase().includes(trendingSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(trendingSearch.toLowerCase()));
    const matchesCat = trendingCategoryFilter === 'All' || p.category === trendingCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Bulk toggle for current filtered view
  const handleBulkToggle = (sectionType, turnOn) => {
    const isBs = sectionType === 'bestsellers';
    const listKey = isBs ? 'selectedBestsellers' : 'selectedNewArrivals';
    const targetIds = filteredTrendingProducts.map(p => p.id);
    if (targetIds.length === 0) return;

    setBestSellersConfig(prev => {
      const existing = prev[listKey] || [];
      const updated = turnOn 
        ? Array.from(new Set([...existing, ...targetIds]))
        : existing.filter(id => !targetIds.includes(id));
      return { ...prev, [listKey]: updated };
    });

    // Sync DB flags in background
    const flagKey = isBs ? 'is_bestseller' : 'is_new_arrival';
    targetIds.forEach(id => {
      api.put(`/products/${id}`, { [flagKey]: turnOn }).catch(() => {});
    });
    setDbProducts(prev => prev.map(p => targetIds.includes(p.id) ? { ...p, [flagKey]: turnOn } : p));

    toast.info(`${turnOn ? 'Enabled' : 'Disabled'} ${targetIds.length} products for ${isBs ? 'Best Sellers' : 'New Arrivals'}`);
  };

  // Save / Publish All Homepage Configurations to DB
  const handlePublishHomepage = async () => {
    setSavingAll(true);
    try {
      // 1. Save Section Order & Visibility with synced video banner titles
      const sectionsPayload = sections.map((s, idx) => {
        if (s.section_key === 'video_banner') {
          return {
            section_key: s.section_key,
            title: videoBannerConfig.title || s.title || 'Video Campaign Section',
            subtitle: videoBannerConfig.subtitle || s.subtitle || 'CAMPAIGN FILM',
            is_visible: s.is_visible !== false,
            display_order: idx + 1
          };
        }
        return {
          section_key: s.section_key,
          title: s.title,
          subtitle: s.subtitle,
          is_visible: s.is_visible !== false,
          display_order: idx + 1
        };
      });
      await api.put('/homepage/sections', sectionsPayload);

      // 2. Save JSON Configurations into SiteSetting DB Table
      const settingsPayload = {
        announcement_config: announcementConfig,
        service_features: serviceFeatures,
        collections_config: collectionsConfig,
        video_banner_config: videoBannerConfig,
        best_sellers_config: bestSellersConfig,
        trending_arrivals_config: bestSellersConfig,
        promotions_config: promotionsConfig,
        lookbook_config: lookbookConfig,
        newsletter_config: newsletterConfig,
        footer_config: footerConfig,
        footer_settings: footerSettings,
        header_menu_links: headerMenuLinks,
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
        <button className={`admin-tab-btn ${activeTab === 'video' ? 'active' : ''}`} onClick={() => handleTabChange('video')}>
          <FiVideo /> Video Section
        </button>
        <button className={`admin-tab-btn ${activeTab === 'best_sellers' ? 'active' : ''}`} onClick={() => handleTabChange('best_sellers')}>
          <FiTrendingUp /> Trending & New Arrivals
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
        <button className={`admin-tab-btn ${activeTab === 'header_menu' ? 'active' : ''}`} onClick={() => handleTabChange('header_menu')}>
          <FiLayers /> Header Menu Links ({headerMenuLinks.length})
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
                  const isSelected = (collectionsConfig.selectedCategoryIds && collectionsConfig.selectedCategoryIds.includes(cat.id)) ||
                    collectionsConfig.selectedCategories?.includes(cat.name);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={isSelected ? 'btn-admin-red' : 'btn-admin-outline'}
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                      onClick={() => {
                        setCollectionsConfig(prev => {
                          const currentIds = prev.selectedCategoryIds || [];
                          const currentNames = prev.selectedCategories || [];
                          const updatedIds = isSelected ? currentIds.filter(id => id !== cat.id) : [...currentIds, cat.id];
                          const updatedNames = isSelected ? currentNames.filter(c => c !== cat.name) : [...currentNames, cat.name];
                          return { 
                            ...prev, 
                            selectedCategoryIds: updatedIds,
                            selectedCategories: updatedNames 
                          };
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

      {/* TAB: VIDEO CAMPAIGN SECTION (BEFORE TRENDING NOW) */}
      {activeTab === 'video' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1">Video Campaign Section</h4>
              <p className="text-muted small mb-0">Configure your homepage brand video, YouTube link, autoplay toggle, poster image, and headlines.</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark border px-3 py-2">
                Positioned directly before <strong>TRENDING NOW</strong>
              </span>
            </div>
          </div>

          <div className="row g-4">
            {/* Left Column: Form Controls */}
            <div className="col-lg-7">
              {/* Autoplay & Section Enable Card */}
              <div className="card border-0 bg-light p-3 mb-4 rounded-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Autoplay Video on Page Load</h6>
                    <p className="text-muted small mb-0">
                      When enabled, the video automatically plays in muted loop mode when customers load the homepage. Customers can click to unmute.
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input 
                      type="checkbox" 
                      className="form-check-input"
                      role="switch"
                      id="videoAutoplaySwitch"
                      checked={Boolean(videoBannerConfig.autoplay)}
                      onChange={(e) => setVideoBannerConfig(prev => ({ ...prev, autoplay: e.target.checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* YouTube Link Field */}
              <div className="mb-3">
                <label className="admin-form-label fw-bold">
                  YouTube Video Link <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-danger">
                    <FiYoutube />
                  </span>
                  <input 
                    type="text" 
                    className="admin-input form-control"
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                    value={videoBannerConfig.youtube_url || ''}
                    onChange={(e) => setVideoBannerConfig(prev => ({ ...prev, youtube_url: e.target.value }))}
                  />
                </div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <span className="form-text text-muted extra-small">
                    Supports YouTube standard URLs, youtu.be short links, and Shorts URLs.
                  </span>
                  {videoBannerConfig.youtube_url && (
                    <span className={`badge ${getYouTubeVideoId(videoBannerConfig.youtube_url) ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} small`}>
                      {getYouTubeVideoId(videoBannerConfig.youtube_url) ? `✓ ID: ${getYouTubeVideoId(videoBannerConfig.youtube_url)}` : '⚠ Invalid YouTube URL'}
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="admin-form-label">Section Tagline / Subtitle</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    placeholder="e.g. CAMPAIGN FILM"
                    value={videoBannerConfig.subtitle || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVideoBannerConfig(prev => ({ ...prev, subtitle: val }));
                      setSections(prev => prev.map(s => s.section_key === 'video_banner' ? { ...s, subtitle: val } : s));
                    }}
                  />
                </div>

                <div className="col-md-6">
                  <label className="admin-form-label">Section Main Title</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    placeholder="e.g. EXPERIENCE THE CRAFT"
                    value={videoBannerConfig.title || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVideoBannerConfig(prev => ({ ...prev, title: val }));
                      setSections(prev => prev.map(s => s.section_key === 'video_banner' ? { ...s, title: val } : s));
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="admin-form-label">Campaign Description (Optional)</label>
                <textarea 
                  rows={2}
                  className="admin-input"
                  placeholder="A brief editorial caption describing the campaign film..."
                  value={videoBannerConfig.description || ''}
                  onChange={(e) => setVideoBannerConfig(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Cover Image Upload */}
              <div className="mb-3">
                <FileUploadInput 
                  value={videoBannerConfig.cover_image || ''} 
                  onChange={(url) => setVideoBannerConfig(prev => ({ ...prev, cover_image: url }))} 
                  type="image" 
                  folder="videos" 
                  label="Custom Video Poster / Thumbnail (Optional)" 
                  placeholder="Upload high-res poster image or leave empty for YouTube thumbnail..." 
                />
                <span className="form-text text-muted extra-small">
                  If left blank, the system automatically pulls the maximum-resolution official YouTube thumbnail.
                </span>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview */}
            <div className="col-lg-5">
              <div className="border rounded-3 p-3 bg-dark text-white shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-danger small">HOMEPAGE LIVE PREVIEW</span>
                  <span className="text-secondary small">
                    {videoBannerConfig.autoplay ? 'Mode: Autoplay (Muted)' : 'Mode: Play Button'}
                  </span>
                </div>

                {/* Video Card Preview */}
                <div className="position-relative rounded-3 overflow-hidden bg-black ratio ratio-16x9 shadow-lg">
                  {videoBannerConfig.autoplay && getYouTubeVideoId(videoBannerConfig.youtube_url) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoBannerConfig.youtube_url)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(videoBannerConfig.youtube_url)}&controls=1`}
                      title="Video Preview"
                      className="w-100 h-100 border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <img 
                        src={videoBannerConfig.cover_image || getYouTubeThumbnail(videoBannerConfig.youtube_url, 'maxresdefault') || getYouTubeThumbnail(videoBannerConfig.youtube_url, 'hqdefault') || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200'} 
                        alt="Preview Poster"
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          const hq = getYouTubeThumbnail(videoBannerConfig.youtube_url, 'hqdefault');
                          if (hq && e.currentTarget.src !== hq) {
                            e.currentTarget.src = hq;
                          }
                        }}
                      />
                      <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-40 d-flex flex-column align-items-center justify-content-center">
                        <div className="rounded-circle bg-white bg-opacity-25 border border-white border-2 text-white shadow-lg d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                          <FiPlay size={24} style={{ marginLeft: '3px' }} />
                        </div>
                        <span className="mt-2 text-white extra-small fw-semibold letter-spacing-1">CLICK TO PLAY</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center mt-3">
                  <span className="text-danger text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                    {videoBannerConfig.subtitle || 'CAMPAIGN FILM'}
                  </span>
                  <h6 className="fw-bold text-white mb-1">
                    {videoBannerConfig.title || 'EXPERIENCE THE CRAFT'}
                  </h6>
                  {videoBannerConfig.description && (
                    <p className="text-secondary small mb-0">
                      {videoBannerConfig.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Video Section
            </button>
            <span className="text-muted small">Changes will reflect immediately across desktop & mobile homepage.</span>
          </div>
        </div>
      )}

      {/* TAB 6: TRENDING & NEW ARRIVALS (BEST SELLERS & NEW ARRIVALS TOGGLE CONTROL) */}
      {activeTab === 'best_sellers' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold text-dark mb-1">Trending & New Arrivals Control Center</h4>
              <p className="text-muted small mb-0">Control titles, carousel autoplay, and toggle individual products ON/OFF for Best Selling and New Arrivals collections.</p>
            </div>
            <button className="btn-admin-red d-flex align-items-center gap-2" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> {savingAll ? 'Publishing...' : 'Save & Publish Trending & Arrivals'}
            </button>
          </div>

          {/* Section Presentation Settings */}
          <div className="p-3 bg-light rounded-3 border mb-4">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <FiSliders /> Section Configuration & Display Settings
            </h6>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="admin-form-label small">Section Eyebrow</label>
                <input 
                  type="text" 
                  className="admin-input form-control-sm"
                  value={bestSellersConfig.eyebrow || 'TRENDING NOW'}
                  onChange={(e) => setBestSellersConfig(prev => ({ ...prev, eyebrow: e.target.value }))}
                />
              </div>

              <div className="col-md-3">
                <label className="admin-form-label small">Section Main Heading</label>
                <input 
                  type="text" 
                  className="admin-input form-control-sm"
                  value={bestSellersConfig.heading || 'BEST SELLING & NEW ARRIVALS'}
                  onChange={(e) => setBestSellersConfig(prev => ({ ...prev, heading: e.target.value }))}
                />
              </div>

              <div className="col-md-3">
                <label className="admin-form-label small">Display Layout Mode</label>
                <select 
                  className="form-select admin-input form-control-sm"
                  value={bestSellersConfig.displayMode || 'tabs'}
                  onChange={(e) => setBestSellersConfig(prev => ({ ...prev, displayMode: e.target.value }))}
                >
                  <option value="tabs">Tabbed Switcher (Best Sellers & New Arrivals in one)</option>
                  <option value="stacked">Stacked (Show both sections sequentially)</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="admin-form-label small">Auto Carousel Delay (ms)</label>
                <select 
                  className="form-select admin-input form-control-sm"
                  value={bestSellersConfig.autoplayDelay || 3500}
                  onChange={(e) => setBestSellersConfig(prev => ({ ...prev, autoplayDelay: Number(e.target.value) }))}
                >
                  <option value={2500}>Fast (2.5 seconds)</option>
                  <option value={3500}>Balanced (3.5 seconds) - Recommended</option>
                  <option value={5000}>Relaxed (5.0 seconds)</option>
                  <option value={0}>Disabled (Manual Scroll Only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Best Selling Products vs New Arrivals */}
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center gap-2 ${trendingAdminTab === 'bestsellers' ? 'btn-danger text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
                onClick={() => setTrendingAdminTab('bestsellers')}
              >
                <FiZap /> Best Selling Products ({bestSellersConfig.selectedBestsellers?.length || 0} Enabled)
              </button>
              <button
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center gap-2 ${trendingAdminTab === 'new_arrivals' ? 'btn-danger text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
                onClick={() => setTrendingAdminTab('new_arrivals')}
              >
                <FiPlus /> New Arrivals ({bestSellersConfig.selectedNewArrivals?.length || 0} Enabled)
              </button>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button 
                type="button" 
                className="btn btn-outline-success btn-sm"
                onClick={() => handleBulkToggle(trendingAdminTab, true)}
                title="Enable all filtered products for this section"
              >
                <FiCheck /> Enable All Filtered
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleBulkToggle(trendingAdminTab, false)}
                title="Disable all filtered products for this section"
              >
                <FiX /> Disable All Filtered
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="row g-2 align-items-center mb-3">
            <div className="col-md-7">
              <div className="position-relative">
                <input 
                  type="text" 
                  placeholder={`Search products to toggle for ${trendingAdminTab === 'bestsellers' ? 'Best Sellers' : 'New Arrivals'}...`}
                  className="admin-input form-control-sm ps-5"
                  value={trendingSearch}
                  onChange={(e) => setTrendingSearch(e.target.value)}
                />
                <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>
            <div className="col-md-5">
              <select 
                className="admin-select form-control-sm"
                value={trendingCategoryFilter}
                onChange={(e) => setTrendingCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {Array.from(new Set(dbProducts.map(p => p.category).filter(Boolean))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Toggle Table */}
          <div className="table-responsive border rounded-3">
            <table className="admin-matrix-table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>MEDIA</th>
                  <th>PRODUCT NAME</th>
                  <th>SKU</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>SECTION STATUS</th>
                  <th className="text-end pe-4" style={{ width: '180px' }}>TOGGLE VISIBILITY</th>
                </tr>
              </thead>
              <tbody>
                {dbProducts.filter(p => {
                  const matchesSearch = !trendingSearch || p.name.toLowerCase().includes(trendingSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(trendingSearch.toLowerCase()));
                  const matchesCat = trendingCategoryFilter === 'All' || p.category === trendingCategoryFilter;
                  return matchesSearch && matchesCat;
                }).map(p => {
                  const isBs = trendingAdminTab === 'bestsellers';
                  const list = isBs ? (bestSellersConfig.selectedBestsellers || []) : (bestSellersConfig.selectedNewArrivals || []);
                  const isActive = list.includes(p.id);

                  return (
                    <tr key={p.id} className={isActive ? 'bg-light bg-opacity-25' : ''}>
                      <td>
                        <img 
                          src={p.images?.[0] || '/logo.png'} 
                          alt={p.name} 
                          style={{ width: '40px', height: '48px', objectFit: p.images?.[0] ? 'cover' : 'contain', background: '#050505', borderRadius: '4px' }} 
                          onError={(e) => { e.target.src = '/logo.png'; }}
                        />
                      </td>
                      <td>
                        <strong className="text-dark d-block">{p.name}</strong>
                        {p.badge && <span className="cat-slug-badge me-1" style={{ fontSize: '10px' }}>{p.badge}</span>}
                      </td>
                      <td><code className="cat-slug-badge">{p.sku || p.id}</code></td>
                      <td><span className="badge bg-secondary bg-opacity-10 text-dark">{p.category}</span></td>
                      <td><strong>₹{p.price}</strong></td>
                      <td>
                        {isActive ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success fw-bold">
                            <FiCheck className="me-1" /> VISIBLE IN {isBs ? 'BEST SELLERS' : 'NEW ARRIVALS'}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border">
                            HIDDEN
                          </span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <button
                            type="button"
                            className={`btn btn-sm ${isActive ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                            onClick={() => handleToggleSectionProduct(p.id, trendingAdminTab)}
                            style={{ minWidth: '95px', fontWeight: 600 }}
                          >
                            {isActive ? '✓ ON' : 'OFF'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span className="text-muted small">
              Tip: Toggling updates the product instantly and saves when clicking Publish.
            </span>
            <button className="btn-admin-red d-flex align-items-center gap-2" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Trending & Arrivals
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

      {/* TAB 10: FOOTER LINKS & SOCIAL MEDIA */}
      {activeTab === 'footer' && (
        <div className="row g-4">
          {/* Section 1: Brand Bio & Copyright */}
          <div className="col-12 col-lg-6">
            <div className="admin-card-white h-100 p-4">
              <h4 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
                <FiGlobe className="text-danger" /> Footer Brand Bio & Copyright
              </h4>

              <div className="mb-3">
                <label className="admin-form-label">Footer Brand Bio / Description</label>
                <textarea 
                  rows="3" 
                  className="admin-textarea"
                  value={footerSettings.bio}
                  onChange={(e) => setFooterSettings(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Orderly is your destination for premium men's wear..."
                />
              </div>

              <div className="mb-3">
                <label className="admin-form-label">Copyright Notice</label>
                <input 
                  type="text" 
                  className="admin-input"
                  value={footerSettings.copyright}
                  onChange={(e) => setFooterSettings(prev => ({ ...prev, copyright: e.target.value }))}
                  placeholder="© 2026 Orderly. All Rights Reserved."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Social Media Links Manager */}
          <div className="col-12 col-lg-6">
            <div className="admin-card-white h-100 p-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FiShare2 className="text-danger" /> Social Media Links ({(footerSettings.social_links || []).length})
                </h4>
                <button type="button" className="btn-admin-outline py-1 px-2" onClick={openAddSocialModal}>
                  <FiPlus /> Add Social Link
                </button>
              </div>

              <div className="d-flex flex-column gap-2" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {(footerSettings.social_links || []).map((soc) => (
                  <div key={soc.id} className="social-link-item-box">
                    <div className="d-flex align-items-center gap-3">
                      <div className="social-platform-icon-wrap">
                        {getPlatformIcon(soc.platform)}
                      </div>
                      <div>
                        <strong className="text-dark d-block small">{soc.name || soc.platform}</strong>
                        <a href={soc.url} target="_blank" rel="noreferrer" className="text-muted extra-small text-truncate d-block" style={{ maxWidth: '200px' }}>
                          {soc.url} <FiExternalLink className="ms-1" />
                        </a>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button 
                        type="button" 
                        className={`site-toggle-btn ${soc.enabled ? 'on' : 'off'}`}
                        onClick={() => handleToggleSocial(soc.id)}
                        title={soc.enabled ? 'Enabled' : 'Disabled'}
                      >
                        {soc.enabled ? 'Active' : 'Hidden'}
                      </button>
                      <button 
                        type="button" 
                        className="site-icon-btn"
                        onClick={() => openEditSocialModal(soc)}
                        title="Edit URL"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        type="button" 
                        className="site-icon-btn danger"
                        onClick={() => handleDeleteSocial(soc.id, soc.name || soc.platform)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Footer Navigation Columns & Links (Full CRUD) */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom pb-3 mb-4">
                <div>
                  <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FiLayers className="text-danger" /> Footer Navigation Columns & Links ({(footerSettings.columns || []).length} Columns)
                  </h4>
                  <p className="text-muted small mb-0">Create, edit, and remove footer navigation columns (SHOP, CUSTOMER CARE, COMPANY, etc.) and custom redirection links.</p>
                </div>
                <button type="button" className="btn-admin-red" onClick={() => setIsColModalOpen(true)}>
                  <FiPlus /> Add New Column
                </button>
              </div>

              {/* Grid of Columns */}
              <div className="row g-4">
                {(footerSettings.columns || []).map((col) => (
                  <div key={col.id} className="col-12 col-md-6 col-lg-4">
                    <div className="footer-cms-column-card h-100 d-flex flex-column justify-content-between">
                      <div>
                        {/* Column Header */}
                        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                          <input 
                            type="text" 
                            className="form-control form-control-sm fw-bold text-uppercase"
                            value={col.title}
                            onChange={(e) => handleColumnTitleChange(col.id, e.target.value)}
                            style={{ maxWidth: '180px' }}
                          />
                          <button 
                            type="button" 
                            className="site-icon-btn danger"
                            onClick={() => handleDeleteColumn(col.id, col.title)}
                            title="Delete Column"
                          >
                            <FiTrash2 />
                          </button>
                        </div>

                        {/* List of Links under Column */}
                        <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                          {(col.links || []).map((link) => (
                            <div key={link.id} className="footer-cms-link-row">
                              <input 
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Link Label"
                                value={link.label}
                                onChange={(e) => handleLinkChange(col.id, link.id, 'label', e.target.value)}
                              />
                              <input 
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="/path or https://"
                                value={link.url}
                                onChange={(e) => handleLinkChange(col.id, link.id, 'url', e.target.value)}
                              />
                              <button 
                                type="button" 
                                className="site-icon-btn danger flex-shrink-0"
                                onClick={() => handleDeleteLink(col.id, link.id)}
                                title="Remove Link"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ))}

                          {(col.links || []).length === 0 && (
                            <div className="text-center py-3 text-muted extra-small">
                              No links in this column yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add Link Button */}
                      <button 
                        type="button" 
                        className="site-add-link-btn w-100"
                        onClick={() => handleAddLink(col.id)}
                      >
                        <FiPlus /> Add Link to {col.title}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 mt-3">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Footer CMS
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
      <Modal 
        isOpen={isSlideModalOpen} 
        onClose={() => setIsSlideModalOpen(false)} 
        title={editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}
        width="860px"
      >
        <form onSubmit={handleSaveSlide}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Headline Title (Use \n for line break, Optional)</label>
              <input type="text" className="admin-input" value={slideFormData.title} onChange={(e) => setSlideFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. OWN YOUR\nSTYLE" />
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
              <FileUploadInput 
                value={slideFormData.image_url} 
                onChange={(url) => setSlideFormData(prev => ({ ...prev, image_url: url }))} 
                type="image" 
                folder="hero" 
                label="Desktop Banner Image URL *" 
                recommendedSize="1920 x 800 px (16:9 Landscape)"
                placeholder="Upload desktop image URL..." 
              />
            </div>
            <div className="col-md-6">
              <FileUploadInput 
                value={slideFormData.mobile_image_url} 
                onChange={(url) => setSlideFormData(prev => ({ ...prev, mobile_image_url: url }))} 
                type="image" 
                folder="hero" 
                label="Mobile Banner Image URL (Optional)" 
                recommendedSize="800 x 1000 px (4:5 Portrait)"
                placeholder="Upload mobile image URL..." 
              />
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

      {/* TAB 12: HEADER NAVBAR MENU (TOP MENU BAR LINKS & DROPDOWNS) */}
      {activeTab === 'header_menu' && (
        <div className="admin-card-white p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom pb-3 mb-4">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <FiMenu className="text-danger" /> Header Menu Bar Links & Dropdowns ({(headerMenuLinks || []).length} Main Items)
              </h4>
              <p className="text-muted small mb-0">Manage top navigation menu links, custom redirection URLs, and multi-level dropdown sub-menus for both Desktop and Mobile views.</p>
            </div>
            <button type="button" className="btn-admin-red" onClick={openAddHeaderNavModal}>
              <FiPlus /> Add Main Header Link
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-matrix-table align-middle">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ORDER</th>
                  <th>MENU LABEL</th>
                  <th>TARGET URL</th>
                  <th>DROPDOWN SUB-LINKS</th>
                  <th>STATUS</th>
                  <th className="text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(headerMenuLinks || []).map((item, idx) => (
                  <React.Fragment key={item.id || idx}>
                    <tr>
                      <td><strong className="text-muted">#{idx + 1}</strong></td>
                      <td>
                        <strong className="text-dark fw-bold">{item.label}</strong>
                        {item.is_external && <span className="badge bg-info text-dark ms-2 extra-small">New Tab</span>}
                      </td>
                      <td>
                        <code className="cat-slug-badge">{item.url}</code>
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className={`btn btn-sm d-inline-flex align-items-center gap-1 ${(item.sub_items || []).length > 0 ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                          onClick={() => toggleExpandNav(item.id)}
                        >
                          <FiCornerDownRight /> {(item.sub_items || []).length} Dropdown Links {expandedNavIds[item.id] ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className={`site-toggle-btn ${item.enabled !== false ? 'on' : 'off'}`}
                          onClick={() => handleToggleHeaderNav(item.id)}
                          title={item.enabled !== false ? 'Click to Hide' : 'Click to Show'}
                        >
                          {item.enabled !== false ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-inline-flex align-items-center gap-1">
                          <button 
                            type="button" 
                            className="site-icon-btn"
                            onClick={() => handleAddSubNav(item.id)}
                            title="Add Dropdown Sub-Link"
                          >
                            <FiPlus />
                          </button>
                          <button 
                            type="button"
                            className="btn-admin-outline" 
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            onClick={() => moveHeaderNav(idx, 'up')}
                            disabled={idx === 0}
                            title="Move Up"
                          >
                            <FiArrowUp />
                          </button>
                          <button 
                            type="button"
                            className="btn-admin-outline" 
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            onClick={() => moveHeaderNav(idx, 'down')}
                            disabled={idx === (headerMenuLinks || []).length - 1}
                            title="Move Down"
                          >
                            <FiArrowDown />
                          </button>
                          <button 
                            type="button" 
                            className="site-icon-btn"
                            onClick={() => openEditHeaderNavModal(item)}
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button 
                            type="button" 
                            className="site-icon-btn danger"
                            onClick={() => handleDeleteHeaderNav(item.id, item.label)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDABLE SUB-ITEMS DRAWER */}
                    {expandedNavIds[item.id] && (
                      <tr>
                        <td colSpan="6" className="p-0 bg-light">
                          <div className="p-3 border-start border-3 border-danger ms-4 my-2 rounded bg-white shadow-sm">
                            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2 small">
                                <FiCornerDownRight className="text-danger" /> Dropdown Sub-Links for "{item.label}" ({(item.sub_items || []).length})
                              </h6>
                              <button 
                                type="button" 
                                className="btn-admin-outline py-1 px-2 extra-small"
                                onClick={() => handleAddSubNav(item.id)}
                              >
                                <FiPlus /> Add Sub-Link
                              </button>
                            </div>

                            <div className="d-flex flex-column gap-2">
                              {(item.sub_items || []).map((sub) => (
                                <div key={sub.id} className="footer-cms-link-row align-items-center">
                                  <span className="text-muted extra-small me-1">↳</span>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm text-uppercase fw-bold" 
                                    style={{ maxWidth: '200px' }}
                                    placeholder="Sub Link Label"
                                    value={sub.label}
                                    onChange={(e) => handleSubNavChange(item.id, sub.id, 'label', e.target.value)}
                                  />
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    placeholder="Target URL (/shop?category=...)"
                                    value={sub.url}
                                    onChange={(e) => handleSubNavChange(item.id, sub.id, 'url', e.target.value)}
                                  />
                                  <button 
                                    type="button" 
                                    className={`site-toggle-btn ${sub.enabled !== false ? 'on' : 'off'}`}
                                    onClick={() => handleToggleSubNav(item.id, sub.id)}
                                  >
                                    {sub.enabled !== false ? 'Active' : 'Hidden'}
                                  </button>
                                  <button 
                                    type="button" 
                                    className="site-icon-btn danger flex-shrink-0"
                                    onClick={() => handleDeleteSubNav(item.id, sub.id)}
                                    title="Remove Sub-Link"
                                  >
                                    <FiTrash2 />
                                  </button>
                                </div>
                              ))}

                              {(item.sub_items || []).length === 0 && (
                                <div className="text-muted extra-small py-2 text-center">
                                  No dropdown sub-links added for "{item.label}" yet. Click "+ Add Sub-Link" to create one.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {(headerMenuLinks || []).length === 0 && (
              <div className="text-center py-4 text-muted small">
                No header navigation menu items configured yet. Click "Add Main Header Link" to create one.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-top">
            <button className="btn-admin-red" onClick={handlePublishHomepage} disabled={savingAll}>
              <FiCheck /> Save & Publish Header Menu
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Header Navigation Link */}
      <Modal
        isOpen={isHeaderNavModalOpen}
        onClose={() => setIsHeaderNavModalOpen(false)}
        title={editingHeaderNav ? 'Edit Header Menu Link & Dropdowns' : 'Add Header Menu Link'}
        width="680px"
      >
        <form onSubmit={handleSaveHeaderNav}>
          {/* QUICK CATEGORY SELECTOR FOR MAIN LINK */}
          <div className="mb-3 p-2 bg-light border rounded">
            <label className="admin-form-label mb-1 text-primary d-flex align-items-center gap-1 small fw-bold">
              <FiTag /> Quick Select Category for Header Link (Auto-Fills Label & URL)
            </label>
            <select
              className="admin-select"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                try {
                  const item = JSON.parse(e.target.value);
                  setHeaderNavForm(prev => ({
                    ...prev,
                    label: item.label,
                    url: item.url
                  }));
                } catch (err) {}
                e.target.value = '';
              }}
            >
              <option value="">-- Choose Category or Page to Auto-Populate --</option>
              <optgroup label="🛍️ Apparel & Single Product Categories">
                {navigationCategoryOptions.productCategories.map(parent => (
                  <React.Fragment key={parent.id}>
                    <option value={JSON.stringify({ label: parent.name.toUpperCase(), url: `/shop?category=${encodeURIComponent(parent.name)}` })}>
                      {parent.name} (/shop?category={parent.name})
                    </option>
                    {parent.subcategories.map(sub => (
                      <option key={sub.id} value={JSON.stringify({ label: sub.name.toUpperCase(), url: `/shop?category=${encodeURIComponent(parent.name)}&subcategory=${encodeURIComponent(sub.name)}` })}>
                        &nbsp;&nbsp;↳ {sub.name} (Sub of {parent.name})
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </optgroup>
              <optgroup label="🎁 Combo & Bundle Categories">
                {navigationCategoryOptions.comboCategories.map(parent => (
                  <React.Fragment key={parent.id}>
                    <option value={JSON.stringify({ label: parent.name.toUpperCase(), url: `/combos?category=${encodeURIComponent(parent.slug || parent.name)}` })}>
                      {parent.name} (/combos?category={parent.slug || parent.name})
                    </option>
                    {parent.subcategories.map(sub => (
                      <option key={sub.id} value={JSON.stringify({ label: sub.name.toUpperCase(), url: `/combos?category=${encodeURIComponent(parent.slug || parent.name)}&subcategory=${encodeURIComponent(sub.slug || sub.name)}` })}>
                        &nbsp;&nbsp;↳ {sub.name} (Sub of {parent.name})
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </optgroup>
              <optgroup label="🌐 Special Main Pages">
                <option value={JSON.stringify({ label: 'SHOP', url: '/shop' })}>All Products (/shop)</option>
                <option value={JSON.stringify({ label: 'COMBOS', url: '/combos' })}>All Combos (/combos)</option>
                <option value={JSON.stringify({ label: 'ABOUT US', url: '/about' })}>About Us (/about)</option>
                <option value={JSON.stringify({ label: 'CONTACT', url: '/contact' })}>Contact (/contact)</option>
              </optgroup>
            </select>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="admin-form-label">Menu Item Label (e.g. SHOP, COMBOS, OVERSIZED TEES)</label>
              <input
                type="text"
                className="admin-input text-uppercase fw-bold"
                placeholder="e.g. SHOP"
                value={headerNavForm.label}
                onChange={(e) => setHeaderNavForm(prev => ({ ...prev, label: e.target.value }))}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Target Redirection URL</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. /shop, /combos, /shop?category=Shirts"
                value={headerNavForm.url}
                onChange={(e) => setHeaderNavForm(prev => ({ ...prev, url: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="d-flex gap-4 mb-4">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="headerNavExternal"
                checked={!!headerNavForm.is_external}
                onChange={(e) => setHeaderNavForm(prev => ({ ...prev, is_external: e.target.checked }))}
              />
              <label className="form-check-label small text-muted" htmlFor="headerNavExternal">
                Open in new tab (`_blank`)
              </label>
            </div>

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="headerNavEnabled"
                checked={headerNavForm.enabled !== false}
                onChange={(e) => setHeaderNavForm(prev => ({ ...prev, enabled: e.target.checked }))}
              />
              <label className="form-check-label small fw-bold" htmlFor="headerNavEnabled">
                Display on Navigation
              </label>
            </div>
          </div>

          {/* DROPDOWN SUB-ITEMS SECTION IN MODAL */}
          <div className="p-3 bg-light border rounded mb-3">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2 small">
                <FiCornerDownRight className="text-danger" /> Dropdown Sub-Items ({(headerNavForm.sub_items || []).length})
              </h6>
              <div className="d-flex align-items-center gap-2">
                <select
                  className="admin-select py-1 extra-small"
                  style={{ maxWidth: '240px' }}
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    try {
                      const item = JSON.parse(e.target.value);
                      const newSub = {
                        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        label: item.label,
                        url: item.url,
                        enabled: true
                      };
                      setHeaderNavForm(prev => ({
                        ...prev,
                        sub_items: [...(prev.sub_items || []), newSub]
                      }));
                    } catch (err) {}
                    e.target.value = '';
                  }}
                >
                  <option value="">+ Quick Add Category Sub-Link</option>
                  <optgroup label="🛍️ Product Categories">
                    {navigationCategoryOptions.productCategories.map(parent => (
                      <React.Fragment key={parent.id}>
                        <option value={JSON.stringify({ label: parent.name.toUpperCase(), url: `/shop?category=${encodeURIComponent(parent.name)}` })}>
                          {parent.name}
                        </option>
                        {parent.subcategories.map(sub => (
                          <option key={sub.id} value={JSON.stringify({ label: sub.name.toUpperCase(), url: `/shop?category=${encodeURIComponent(parent.name)}&subcategory=${encodeURIComponent(sub.name)}` })}>
                            &nbsp;&nbsp;↳ {sub.name}
                          </option>
                        ))}
                      </React.Fragment>
                    ))}
                  </optgroup>
                  <optgroup label="🎁 Combo Categories">
                    {navigationCategoryOptions.comboCategories.map(parent => (
                      <React.Fragment key={parent.id}>
                        <option value={JSON.stringify({ label: parent.name.toUpperCase(), url: `/combos?category=${encodeURIComponent(parent.slug || parent.name)}` })}>
                          {parent.name}
                        </option>
                        {parent.subcategories.map(sub => (
                          <option key={sub.id} value={JSON.stringify({ label: sub.name.toUpperCase(), url: `/combos?category=${encodeURIComponent(parent.slug || parent.name)}&subcategory=${encodeURIComponent(sub.slug || sub.name)}` })}>
                            &nbsp;&nbsp;↳ {sub.name}
                          </option>
                        ))}
                      </React.Fragment>
                    ))}
                  </optgroup>
                </select>

                <button 
                  type="button" 
                  className="btn-admin-outline py-1 px-2 extra-small flex-shrink-0"
                  onClick={handleModalAddSubItem}
                >
                  <FiPlus /> Custom Sub-Item
                </button>
              </div>
            </div>

            <div className="d-flex flex-column gap-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {(headerNavForm.sub_items || []).map((sub) => (
                <div key={sub.id} className="d-flex align-items-center gap-2 bg-white p-2 border rounded">
                  <input 
                    type="text" 
                    className="form-control form-control-sm text-uppercase fw-bold" 
                    style={{ maxWidth: '180px' }}
                    placeholder="Sub Label"
                    value={sub.label}
                    onChange={(e) => handleModalSubItemChange(sub.id, 'label', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Sub Target URL (/shop?category=...)"
                    value={sub.url}
                    onChange={(e) => handleModalSubItemChange(sub.id, 'url', e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="site-icon-btn danger flex-shrink-0"
                    onClick={() => handleModalDeleteSubItem(sub.id)}
                    title="Remove Sub-Item"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}

              {(headerNavForm.sub_items || []).length === 0 && (
                <div className="text-center py-2 text-muted extra-small">
                  No dropdown sub-items configured for this link. Click "+ Add Sub-Item" if you want a dropdown menu.
                </div>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsHeaderNavModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">Save Header Link</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add/Edit Social Link */}
      <Modal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        title={editingSocial ? 'Edit Social Media Link' : 'Add Social Media Link'}
      >
        <form onSubmit={handleSaveSocial}>
          <div className="mb-3">
            <label className="admin-form-label">Platform</label>
            <select
              className="admin-input"
              value={socialForm.platform}
              onChange={(e) => setSocialForm(prev => ({ ...prev, platform: e.target.value }))}
            >
              {SOCIAL_PLATFORMS.map(p => (
                <option key={p.key} value={p.key}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="admin-form-label">Profile / Page URL</label>
            <input
              type="url"
              className="admin-input"
              placeholder="https://..."
              value={socialForm.url}
              onChange={(e) => setSocialForm(prev => ({ ...prev, url: e.target.value }))}
              required
            />
          </div>
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="socFormEnabled"
              checked={socialForm.enabled !== false}
              onChange={(e) => setSocialForm(prev => ({ ...prev, enabled: e.target.checked }))}
            />
            <label className="form-check-label small" htmlFor="socFormEnabled">
              Display on Website Footer & Topbar
            </label>
          </div>
          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsSocialModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">Save Social Link</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add New Column */}
      <Modal
        isOpen={isColModalOpen}
        onClose={() => setIsColModalOpen(false)}
        title="Add Footer Navigation Column"
      >
        <div>
          <div className="mb-3">
            <label className="admin-form-label">Column Title (e.g. SHOP, POLICIES, QUICK LINKS)</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Enter column title..."
              value={colTitleInput}
              onChange={(e) => setColTitleInput(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsColModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-admin-red" onClick={handleAddColumn}>Add Column</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomepageSettings;
