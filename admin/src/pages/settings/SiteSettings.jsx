import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMapPin, FiPhone, FiMail, FiGlobe, FiClock, FiPlus, FiTrash2, FiEdit, 
  FiCheck, FiSave, FiSettings, FiShoppingBag, FiTruck, FiDollarSign, FiShield, FiX,
  FiShare2, FiExternalLink, FiLayers, FiLock, FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiLinkedin
} from 'react-icons/fi';
import { FaWhatsapp, FaPinterest, FaTiktok } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import Modal from '../../components/common/Modal';
import './SiteSettings.css';

const DEFAULT_BRANCHES = [
  {
    id: 1,
    name: 'ORDERLY Flagship Menswear Studio (Mumbai)',
    address: 'Plot 14, Luxury Fashion Boulevard, Bandra West, Mumbai - 400050',
    phone: '+91 98765 43210',
    email: 'mumbai.store@orderly.com',
    hours: 'Mon - Sun: 10:30 AM - 9:30 PM',
    map_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.792578546519!2d72.8335!3d19.0553!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDAzJzE5LjEiTiA3MsKwNTAnMDAuNiJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin'
  },
  {
    id: 2,
    name: 'ORDERLY Bespoke Suits & Tailoring Studio (Bengaluru)',
    address: 'Suite 204, Regent Fashion Galleria, MG Road, Bengaluru - 560001',
    phone: '+91 98765 43211',
    email: 'blr.store@orderly.com',
    hours: 'Mon - Sat: 11:00 AM - 9:00 PM',
    map_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.953531123456!2d77.6080!3d12.9750!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzMwLjAiTiA3N8KwMzYnMjguOCJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin'
  }
];

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
  ],
  payment_methods: [
    { id: 'pay-1', label: 'VISA', enabled: true },
    { id: 'pay-2', label: 'MASTERCARD', enabled: true },
    { id: 'pay-3', label: 'UPI', enabled: true },
    { id: 'pay-4', label: 'PAYTM', enabled: true }
  ],
  security_badge_text: '100% Secure Payments'
};

const DEFAULT_SETTINGS = {
  store_name: 'ORDERLY Mens Wear',
  store_tagline: 'Crafting Bespoke Luxury Apparel & Italian Tailoring for the Modern Gentleman.',
  contact_phone: '+91 98765 43210',
  contact_whatsapp: '+91 98765 43210',
  contact_email: 'concierge@orderly.com',
  contact_address: 'ORDERLY Corporate Tower, Fashion District, Mumbai - 400050',
  support_hours: 'Mon - Sat: 9:00 AM - 8:00 PM IST',
  footer_bio: 'ORDERLY represents the pinnacle of handcrafted menswear, luxury selvedge denim, and Italian tailoring.',
  footer_copyright: '© 2026 ORDERLY Mens Wear. All Rights Reserved.',
  cod_enabled: 'true',
  cod_advance_percentage: '10',
  free_shipping_threshold: '1999',
  shipping_fee: '99',
  pair_offer_enabled: 'true',
  pair_offer_discount_percent: '25',
  pair_offer_min_products: '2'
};

const emptyBranchForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  hours: 'Mon - Sun: 10:30 AM - 9:30 PM',
  map_url: ''
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

const SiteSettings = () => {
  const [activeTab, setActiveTab] = useState('footer'); // 'footer', 'general', 'branches', 'shipping'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [footerSettings, setFooterSettings] = useState(DEFAULT_FOOTER_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);

  // Social Modal State
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState(null);
  const [socialForm, setSocialForm] = useState({ platform: 'instagram', name: 'Instagram', url: '', enabled: true });

  // Column Modal State
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [colTitleInput, setColTitleInput] = useState('');

  // Payment Badge Input
  const [newPayBadge, setNewPayBadge] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/settings')
      .then(res => {
        if (res.data && res.data.success && res.data.data) {
          const fetched = res.data.data;
          const merged = { ...DEFAULT_SETTINGS };
          Object.keys(DEFAULT_SETTINGS).forEach(k => {
            if (fetched[k] !== undefined && fetched[k] !== null) {
              merged[k] = String(fetched[k]);
            }
          });
          setSettings(merged);

          if (fetched.store_branches) {
            try {
              const parsedBranches = typeof fetched.store_branches === 'string'
                ? JSON.parse(fetched.store_branches)
                : fetched.store_branches;
              if (Array.isArray(parsedBranches) && parsedBranches.length > 0) {
                setBranches(parsedBranches);
              }
            } catch (e) {}
          }

          if (fetched.footer_settings) {
            try {
              const parsedFooter = typeof fetched.footer_settings === 'string'
                ? JSON.parse(fetched.footer_settings)
                : fetched.footer_settings;
              if (parsedFooter && typeof parsedFooter === 'object') {
                setFooterSettings({
                  ...DEFAULT_FOOTER_SETTINGS,
                  ...parsedFooter
                });
              }
            } catch (e) {}
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = [
        ...Object.keys(settings).map(k => ({
          key: k,
          value: settings[k],
          type: 'text'
        })),
        {
          key: 'store_branches',
          value: JSON.stringify(branches),
          type: 'json'
        },
        {
          key: 'footer_settings',
          value: JSON.stringify(footerSettings),
          type: 'json'
        }
      ];

      await api.put('/settings', payload);
      window.dispatchEvent(new CustomEvent('orderly_settings_updated'));
      toast.success('Site & Footer Settings saved successfully! Reflecting live on website.');
    } catch (err) {
      toast.error('Failed to save settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Branch Handlers
  const openAddBranchModal = () => {
    setEditingBranch(null);
    setBranchForm(emptyBranchForm);
    setIsBranchModalOpen(true);
  };

  const openEditBranchModal = (branch) => {
    setEditingBranch(branch);
    setBranchForm({ ...branch });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.address) {
      toast.error('Branch Name and Address are required');
      return;
    }

    if (editingBranch) {
      const updated = branches.map(b => b.id === editingBranch.id ? { ...b, ...branchForm } : b);
      setBranches(updated);
      toast.success(`Branch "${branchForm.name}" updated!`);
    } else {
      const newBranch = {
        id: Date.now(),
        ...branchForm
      };
      setBranches([...branches, newBranch]);
      toast.success(`New Store Branch "${branchForm.name}" added!`);
    }
    setIsBranchModalOpen(false);
  };

  const handleDeleteBranch = (id, name) => {
    if (window.confirm(`Delete store branch "${name}"?`)) {
      const updated = branches.filter(b => b.id !== id);
      setBranches(updated);
      toast.success(`Branch "${name}" removed`);
    }
  };

  // ==========================================
  // FOOTER CMS CRUD HANDLERS
  // ==========================================
  
  // Column Management
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

  // Link Management inside Column
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

  // Social Media Management
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

  // Payment Badges Management
  const handleAddPaymentBadge = (e) => {
    e.preventDefault();
    if (!newPayBadge.trim()) return;
    const badge = {
      id: `pay-${Date.now()}`,
      label: newPayBadge.trim().toUpperCase(),
      enabled: true
    };
    setFooterSettings(prev => ({
      ...prev,
      payment_methods: [...(prev.payment_methods || []), badge]
    }));
    setNewPayBadge('');
    toast.success(`Added payment badge "${badge.label}"`);
  };

  const handleDeletePaymentBadge = (id) => {
    setFooterSettings(prev => ({
      ...prev,
      payment_methods: (prev.payment_methods || []).filter(p => p.id !== id)
    }));
  };

  const handleTogglePaymentBadge = (id) => {
    setFooterSettings(prev => ({
      ...prev,
      payment_methods: (prev.payment_methods || []).map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
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

  return (
    <div className="site-settings-page p-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="admin-page-title d-flex align-items-center gap-2" style={{ color: '#0f172a', fontWeight: 800 }}>
            <FiSettings className="text-danger" /> Storefront & Footer CMS Settings
          </h1>
          <p className="text-muted mb-0 small">Manage footer navigation columns, dynamic links, social media handles, and multi-branch store locations live across the store.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link to="/settings/delivery" className="btn-admin-outline d-flex align-items-center gap-2">
            <FiTruck className="text-danger" /> Delivery Settings
          </Link>
          <button type="button" className="btn-admin-red" onClick={handleSaveAll} disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="site-settings-tabs mb-4">
        <button 
          type="button"
          className={`site-tab-btn ${activeTab === 'footer' ? 'active' : ''}`}
          onClick={() => setActiveTab('footer')}
        >
          <FiLayers /> Footer CMS & Social Media
        </button>
        <button 
          type="button"
          className={`site-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <FiPhone /> Customer Care & Contact
        </button>
        <button 
          type="button"
          className={`site-tab-btn ${activeTab === 'branches' ? 'active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          <FiMapPin /> Boutique Stores ({branches.length})
        </button>
        <button 
          type="button"
          className={`site-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          <FiTruck /> Shipping & COD
        </button>
      </div>

      {/* TAB 1: FOOTER CMS & SOCIAL MEDIA (FULL CRUD) */}
      {activeTab === 'footer' && (
        <div className="row g-4">
          {/* Section 1: Bio & Copyright */}
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

              <div className="mb-3">
                <label className="admin-form-label">Security Badge Text</label>
                <input 
                  type="text" 
                  className="admin-input"
                  value={footerSettings.security_badge_text || '100% Secure Payments'}
                  onChange={(e) => setFooterSettings(prev => ({ ...prev, security_badge_text: e.target.value }))}
                  placeholder="100% Secure Payments"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Social Media CRUD */}
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
                  <p className="text-muted small mb-0">Create and arrange footer navigation columns (SHOP, CUSTOMER CARE, COMPANY, etc.) and add custom links with redirection URLs.</p>
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

          {/* Section 4: Payment Badges CRUD */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <h4 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
                <FiLock className="text-danger" /> Accepted Payment Method Badges
              </h4>

              <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
                {(footerSettings.payment_methods || []).map(pay => (
                  <div key={pay.id} className={`payment-badge-chip ${!pay.enabled ? 'disabled' : ''}`}>
                    <span>{pay.label}</span>
                    <button 
                      type="button" 
                      className="payment-chip-action" 
                      onClick={() => handleTogglePaymentBadge(pay.id)}
                      title={pay.enabled ? 'Click to Disable' : 'Click to Enable'}
                    >
                      {pay.enabled ? <FiCheck /> : <FiX />}
                    </button>
                    <button 
                      type="button" 
                      className="payment-chip-action danger" 
                      onClick={() => handleDeletePaymentBadge(pay.id)}
                      title="Remove"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddPaymentBadge} className="d-flex gap-2" style={{ maxWidth: '360px' }}>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="New payment badge (e.g. RUPAY, AMEX)"
                  value={newPayBadge}
                  onChange={(e) => setNewPayBadge(e.target.value)}
                />
                <button type="submit" className="btn-admin-red flex-shrink-0">
                  <FiPlus /> Add
                </button>
              </form>
            </div>
          </div>

          {/* Section 5: Real-Time Live Footer Preview */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <h4 className="fw-bold text-dark mb-0">🖥️ Live Customer Website Footer Preview</h4>
                <span className="badge bg-success">Real-Time Sync</span>
              </div>

              <div className="footer-preview-mockup">
                <div className="row g-4 mb-4">
                  {/* Brand Column */}
                  <div className="col-lg-3 col-md-6">
                    <h3 className="fw-bold text-white mb-2">ORDER<span className="text-danger">LY</span></h3>
                    <p className="text-muted small mb-3">{footerSettings.bio}</p>
                    <div>
                      {(footerSettings.social_links || []).filter(s => s.enabled).map(s => (
                        <span key={s.id} className="footer-preview-social-btn" title={s.name}>
                          {getPlatformIcon(s.platform)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Columns */}
                  {(footerSettings.columns || []).map(col => (
                    <div key={col.id} className="col-lg-2 col-md-4 col-6">
                      <div className="footer-preview-heading">{col.title}</div>
                      <div>
                        {(col.links || []).map(link => (
                          <span key={link.id} className="footer-preview-link">
                            {link.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Payment Column */}
                  <div className="col-lg-3 col-md-6">
                    <div className="footer-preview-heading">PAYMENT METHODS</div>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {(footerSettings.payment_methods || []).filter(p => p.enabled).map(p => (
                        <span key={p.id} className="badge bg-dark border border-secondary px-2 py-1">
                          {p.label}
                        </span>
                      ))}
                    </div>
                    <div className="text-warning extra-small">
                      🔒 {footerSettings.security_badge_text || '100% Secure Payments'}
                    </div>
                  </div>
                </div>

                <div className="border-top border-secondary pt-3 text-muted extra-small">
                  {footerSettings.copyright}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL CONTACT & CONCIERGE SUPPORT CMS */}
      {activeTab === 'general' && (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="admin-card-white h-100 p-4">
              <h4 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
                <FiPhone className="text-danger" /> Customer Care & Contact CMS
              </h4>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="admin-form-label d-flex align-items-center gap-1">
                    <FiPhone /> Concierge Phone Number
                  </label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={settings.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="col-md-6">
                  <label className="admin-form-label d-flex align-items-center gap-1">
                    <FaWhatsapp className="text-success" /> WhatsApp Concierge
                  </label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={settings.contact_whatsapp}
                    onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="col-md-6">
                  <label className="admin-form-label d-flex align-items-center gap-1">
                    <FiMail /> Support Email Address
                  </label>
                  <input 
                    type="email" 
                    className="admin-input" 
                    value={settings.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="concierge@orderly.com"
                  />
                </div>

                <div className="col-md-6">
                  <label className="admin-form-label d-flex align-items-center gap-1">
                    <FiClock /> Concierge Support Timings
                  </label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={settings.support_hours}
                    onChange={(e) => handleChange('support_hours', e.target.value)}
                    placeholder="Mon - Sat: 9:00 AM - 8:00 PM IST"
                  />
                </div>

                <div className="col-12">
                  <label className="admin-form-label d-flex align-items-center gap-1">
                    <FiMapPin /> Corporate Head Office Address
                  </label>
                  <textarea 
                    rows="2" 
                    className="admin-textarea"
                    value={settings.contact_address}
                    onChange={(e) => handleChange('contact_address', e.target.value)}
                    placeholder="ORDERLY Corporate Tower, Fashion District, Mumbai - 400050"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="admin-card-white h-100 p-4">
              <h4 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
                <FiGlobe className="text-danger" /> Store Identity & Branding
              </h4>

              <div className="row g-3">
                <div className="col-12">
                  <label className="admin-form-label">Store Brand Name</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={settings.store_name}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                    placeholder="ORDERLY Mens Wear"
                  />
                </div>

                <div className="col-12">
                  <label className="admin-form-label">Brand Tagline</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={settings.store_tagline}
                    onChange={(e) => handleChange('store_tagline', e.target.value)}
                    placeholder="Crafting Bespoke Luxury Apparel & Italian Tailoring..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-BRANCH LOCATIONS */}
      {activeTab === 'branches' && (
        <div className="admin-card-white p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom pb-3 mb-4">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <FiMapPin className="text-danger" /> Multi-Branch Store Locations & Google Maps CMS ({branches.length} Active Branches)
              </h4>
              <p className="text-muted small mb-0">Add and manage physical boutique locations with Google Maps iframe embeds.</p>
            </div>
            <button type="button" className="btn-admin-red" onClick={openAddBranchModal}>
              <FiPlus /> Add New Store Branch
            </button>
          </div>

          <div className="row g-4">
            {branches.map((branch, idx) => (
              <div key={branch.id || idx} className="col-12 col-lg-6">
                <div className="p-3 border rounded-3 bg-light position-relative h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-danger text-white px-2 py-1">BRANCH #{idx + 1}</span>
                      <div className="d-flex gap-2">
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => openEditBranchModal(branch)}
                        >
                          <FiEdit /> Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2 text-danger"
                          onClick={() => handleDeleteBranch(branch.id, branch.name)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    <h5 className="fw-bold text-dark mb-2">{branch.name}</h5>
                    <p className="small text-muted mb-2">
                      <FiMapPin className="text-danger me-1" /> {branch.address}
                    </p>
                    
                    <div className="d-flex flex-wrap gap-3 extra-small text-secondary mb-3">
                      <span><FiPhone className="me-1 text-primary" /> {branch.phone}</span>
                      {branch.email && <span><FiMail className="me-1 text-danger" /> {branch.email}</span>}
                      <span><FiClock className="me-1 text-warning" /> {branch.hours}</span>
                    </div>
                  </div>

                  {branch.map_url && (
                    <div className="map-embed-wrapper rounded border overflow-hidden mt-2" style={{ height: '140px' }}>
                      <iframe 
                        src={branch.map_url} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        allowFullScreen="" 
                        loading="lazy" 
                        title={branch.name}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SHIPPING & COD RULES */}
      {activeTab === 'shipping' && (
        <div className="admin-card-white p-4">
          <h4 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
            <FiTruck className="text-danger" /> Shipping & Cash on Delivery (COD) Rules
          </h4>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="admin-form-label">Free Shipping Threshold (₹)</label>
              <input 
                type="number" 
                className="admin-input fw-bold" 
                value={settings.free_shipping_threshold}
                onChange={(e) => handleChange('free_shipping_threshold', e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="admin-form-label">Flat Shipping Charge (₹)</label>
              <input 
                type="number" 
                className="admin-input" 
                value={settings.shipping_fee}
                onChange={(e) => handleChange('shipping_fee', e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="admin-form-label">Cash on Delivery (COD) Status</label>
              <select 
                className="admin-select"
                value={settings.cod_enabled}
                onChange={(e) => handleChange('cod_enabled', e.target.value)}
              >
                <option value="true">Enabled (Accept COD Orders)</option>
                <option value="false">Disabled (Card & UPI Only)</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="admin-form-label">COD Advance Percentage (%)</label>
              <input 
                type="number" 
                min="0"
                max="100"
                className="admin-input fw-bold" 
                value={settings.cod_advance_percentage}
                onChange={(e) => handleChange('cod_advance_percentage', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BRANCH */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title={editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add New Boutique Branch'}
      >
        <form onSubmit={handleSaveBranch}>
          <div className="mb-3">
            <label className="admin-form-label">Branch Studio Name *</label>
            <input 
              type="text" 
              className="admin-input" 
              required
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              placeholder="e.g. ORDERLY Flagship Studio (Chennai)"
            />
          </div>

          <div className="mb-3">
            <label className="admin-form-label">Full Street Address *</label>
            <textarea 
              rows="2" 
              className="admin-textarea"
              required
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              placeholder="Door No, Street, Landmark, City - Pincode"
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="admin-form-label">Store Phone Number</label>
              <input 
                type="text" 
                className="admin-input" 
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="col-md-6">
              <label className="admin-form-label">Store Email</label>
              <input 
                type="email" 
                className="admin-input" 
                value={branchForm.email}
                onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                placeholder="store@orderly.com"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="admin-form-label">Working Hours / Schedule</label>
            <input 
              type="text" 
              className="admin-input" 
              value={branchForm.hours}
              onChange={(e) => setBranchForm({ ...branchForm, hours: e.target.value })}
              placeholder="Mon - Sun: 10:30 AM - 9:30 PM"
            />
          </div>

          <div className="mb-4">
            <label className="admin-form-label">Google Maps Embed URL (iframe src)</label>
            <input 
              type="url" 
              className="admin-input" 
              value={branchForm.map_url}
              onChange={(e) => setBranchForm({ ...branchForm, map_url: e.target.value })}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn-admin-outline" onClick={() => setIsBranchModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-red">
              <FiSave /> Save Store Branch
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD / EDIT SOCIAL LINK */}
      <Modal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        title={editingSocial ? `Edit Social Link: ${editingSocial.name}` : 'Add Social Media Link'}
      >
        <form onSubmit={handleSaveSocial}>
          <div className="mb-3">
            <label className="admin-form-label">Platform *</label>
            <select 
              className="admin-select"
              value={socialForm.platform}
              onChange={(e) => {
                const plat = e.target.value;
                const match = SOCIAL_PLATFORMS.find(p => p.key === plat);
                setSocialForm({ ...socialForm, platform: plat, name: match ? match.name : plat });
              }}
            >
              {SOCIAL_PLATFORMS.map(p => (
                <option key={p.key} value={p.key}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="admin-form-label">Social Profile URL *</label>
            <input 
              type="url" 
              className="admin-input" 
              required
              value={socialForm.url}
              onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
              placeholder="https://instagram.com/orderly"
            />
          </div>

          <div className="mb-4">
            <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={socialForm.enabled !== false}
                onChange={(e) => setSocialForm({ ...socialForm, enabled: e.target.checked })}
              />
              <span className="small text-dark fw-bold">Show on Website Footer</span>
            </label>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn-admin-outline" onClick={() => setIsSocialModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-red">
              <FiSave /> Save Social Link
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD NEW COLUMN */}
      <Modal
        isOpen={isColModalOpen}
        onClose={() => setIsColModalOpen(false)}
        title="Add New Footer Navigation Column"
      >
        <div>
          <div className="mb-3">
            <label className="admin-form-label">Column Title *</label>
            <input 
              type="text" 
              className="admin-input"
              value={colTitleInput}
              onChange={(e) => setColTitleInput(e.target.value)}
              placeholder="e.g. EXCLUSIVES, POLICY, STYLING"
              autoFocus
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn-admin-outline" onClick={() => setIsColModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-admin-red" onClick={handleAddColumn}>
              <FiPlus /> Create Column
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SiteSettings;
