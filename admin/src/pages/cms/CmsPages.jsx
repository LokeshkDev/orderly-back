import React, { useState, useEffect } from 'react';
import {
  FiFileText,
  FiSave,
  FiExternalLink,
  FiRotateCcw,
  FiInfo,
  FiImage,
  FiCheckCircle,
  FiLayers
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import FileUploadInput from '../../components/common/FileUploadInput.jsx';
import WordPadEditor from '../../components/common/WordPadEditor.jsx';
import './CmsPages.css';

const CMS_PAGES_META = [
  {
    key: 'about',
    label: 'About Us',
    path: '/about',
    description: 'Brand heritage, story, vision, craftsmanship, and luxury positioning.',
    hasFeaturedImage: true,
    bannerSizeHint: 'Recommended: 1920 x 600 px (Landscape Banner, Max 5MB)',
    featuredSizeHint: 'Recommended: 800 x 1000 px (Portrait 4:5, Max 5MB)'
  },
  {
    key: 'contact',
    label: 'Contact Us',
    path: '/contact',
    description: 'Customer service concierge, showroom location, phone, and inquiry details.',
    hasFeaturedImage: true,
    bannerSizeHint: 'Recommended: 1920 x 600 px (Landscape Banner, Max 5MB)',
    featuredSizeHint: 'Recommended: 800 x 800 px (Square Showroom / HQ Photo, Max 5MB)'
  },
  {
    key: 'privacy',
    label: 'Privacy Policy',
    path: '/privacy-policy',
    description: 'Customer data protection, cookie policy, security, and GDPR compliance.',
    hasFeaturedImage: false,
    bannerSizeHint: 'Recommended: 1920 x 500 px (Landscape Header, Max 5MB)',
    featuredSizeHint: ''
  },
  {
    key: 'policy',
    label: 'Shipping & Returns Policy',
    path: '/returns-policy',
    description: 'Doorstep pickup rules, delivery timelines, express dispatch, and refunds.',
    hasFeaturedImage: false,
    bannerSizeHint: 'Recommended: 1920 x 500 px (Landscape Header, Max 5MB)',
    featuredSizeHint: ''
  },
  {
    key: 'terms',
    label: 'Terms & Conditions',
    path: '/terms-and-conditions',
    description: 'User agreement, purchasing terms, intellectual property, and warranties.',
    hasFeaturedImage: false,
    bannerSizeHint: 'Recommended: 1920 x 500 px (Landscape Header, Max 5MB)',
    featuredSizeHint: ''
  }
];

const DEFAULT_PAGE_DATA = {
  about: {
    title: 'About Us',
    subtitle: 'Our Heritage & Vision',
    banner_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1920&auto=format&fit=crop',
    featured_image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    content_html: `<h2>Craftsmanship Without Compromise</h2><p>Founded with a mission to eliminate low-grade template clothing, ORDERLY Mens Wear crafts bespoke menswear that commands respect. From Italian flax linen tuxedo shirts to heavy streetwear tees and synchronized father-son heritage sets, every piece undergoes rigorous quality testing.</p><p>Inspired by the aesthetic codes of Zara, Rare Rabbit, and H&M Premium, our garments offer tailored precision, contemporary silhouettes, and timeless sophistication.</p><h3>Our Core Pillars</h3><ul><li><strong>Pure Luxury Fabrics:</strong> Ethically sourced organic linens, Supima cottons, and fine wool blends.</li><li><strong>Artisanal Tailoring:</strong> Structured cuts with handcrafted attention to cuffs, collars, and seams.</li><li><strong>Modern Elegance:</strong> Designs created for the discerning gentleman who values subtle distinction.</li></ul>`
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'We Are Here To Assist You',
    banner_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop',
    featured_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    content_html: `<h2>Concierge & Customer Support</h2><p>Whether you have an inquiry regarding custom sizing, an existing shipment, corporate bulk gifting, or bespoke styling, our dedicated concierge team is available to assist you.</p><h3>Headquarters & Showroom</h3><p><strong>ORDERLY 2.0</strong><br>Valasaravakkam, Kundrathur, Chennai, Tamil Nadu, India.</p><p><strong>Phone:</strong> +91 98765 43210 (Monday to Saturday, 10:00 AM – 7:00 PM IST)<br><strong>Email:</strong> info@orderlymenswear.com<br><strong>WhatsApp VIP Support:</strong> +91 98765 43210</p>`
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Commitment To Protecting Your Personal Data',
    banner_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop',
    featured_image: '',
    content_html: `<h2>Your Privacy Matters</h2><p>At ORDERLY, we treat personal data with supreme discretion. This Privacy Policy outlines how your personal information is gathered, utilized, and safeguarded when you visit or transact on orderlymenswear.com.</p><h3>1. Information We Collect</h3><p>When you browse or place an order, we collect essential identifiers including your name, shipping address, contact phone number, email address, and encrypted payment tokenization details.</p><h3>2. How We Use Your Data</h3><ul><li>To process, dispatch, and track your sartorial orders.</li><li>To communicate live shipment milestones and transactional notifications.</li><li>To offer tailored size recommendations and exclusive VIP previews (upon consent).</li></ul><h3>3. Data Protection & Security</h3><p>We implement end-to-end 256-bit SSL encryption and partner solely with PCI-DSS compliant banking gateways. We never sell or lease your personal credentials to third-party marketing entities.</p>`
  },
  policy: {
    title: 'Shipping & Returns Policy',
    subtitle: 'Seamless Delivery & Doorstep Exchanges',
    banner_image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1920&auto=format&fit=crop',
    featured_image: '',
    content_html: `<h2>Shipping & Delivery Terms</h2><p>We offer complimentary express shipping across India on orders exceeding ₹2,500. Orders below ₹2,500 incur a flat express shipping fee of ₹199.</p><ul><li><strong>Dispatch Window:</strong> All orders are prepared and dispatched within 24 business hours.</li><li><strong>Metro Deliveries:</strong> Delivered within 48 to 72 hours.</li><li><strong>Non-Metro Deliveries:</strong> Delivered within 3 to 5 business days.</li></ul><h2>15-Day Doorstep Returns & Exchanges</h2><p>If you are not completely enchanted by the fit or finish of your ORDERLY piece, you may request a hassle-free doorstep return or size exchange within 15 days of parcel receipt.</p><ul><li>Garments must remain unworn, unwashed, and intact with all security tags and original luxury packaging box.</li><li>Refunds are initiated instantly to your original payment mode or store credits once quality inspection is completed.</li></ul>`
  },
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'User Agreement & Sizing Guidelines',
    banner_image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=1920&auto=format&fit=crop',
    featured_image: '',
    content_html: `<h2>Terms of Service</h2><p>Welcome to ORDERLY. By browsing our boutique, accessing our digital catalog, or placing an order, you agree to be bound by these Terms and Conditions.</p><h3>1. Product Accuracy & Sizing</h3><p>We take meticulous care in representing garments with accurate colors, texture fidelity, and sizing dimensions. Slight variances in natural linen grain or screen calibration may occur.</p><h3>2. Pricing & Payments</h3><p>All prices displayed on our website are inclusive of applicable GST taxes in Indian Rupees (INR). We reserve the right to revise pricing or rectify typographical discrepancies at any moment prior to confirmation.</p><h3>3. Intellectual Property</h3><p>All imagery, styling designs, brand marks, and digital assets are the exclusive intellectual property of ORDERLY Mens Wear. Unauthorized reproduction or commercial distribution is strictly prohibited.</p>`
  }
};

const CmsPages = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pagesData, setPagesData] = useState(DEFAULT_PAGE_DATA);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data && res.data.success && res.data.data?.cms_pages) {
        setPagesData({
          ...DEFAULT_PAGE_DATA,
          ...res.data.data.cms_pages
        });
      }
    } catch (err) {
      console.error('Error loading CMS settings:', err);
      toast.error('Failed to load CMS settings, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key, field, value) => {
    setPagesData(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || DEFAULT_PAGE_DATA[key] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.post('/settings', {
        cms_pages: pagesData
      });
      if (res.data && res.data.success) {
        toast.success('CMS Pages saved and published successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to save CMS settings');
      }
    } catch (err) {
      console.error('Error saving CMS settings:', err);
      toast.error('Failed to save CMS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetCurrentPage = () => {
    if (window.confirm(`Reset "${activeMeta.label}" to original default template?`)) {
      setPagesData(prev => ({
        ...prev,
        [activeTab]: DEFAULT_PAGE_DATA[activeTab]
      }));
      toast.info(`Reset ${activeMeta.label} to defaults. Click "Save All Pages" to apply.`);
    }
  };

  const activeMeta = CMS_PAGES_META.find(p => p.key === activeTab) || CMS_PAGES_META[0];
  const currentPage = pagesData[activeTab] || DEFAULT_PAGE_DATA[activeTab] || {};

  return (
    <div className="cms-pages-container">
      {/* HEADER SECTION */}
      <div className="cms-pages-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="cms-title d-flex align-items-center gap-2">
            <FiLayers className="text-primary" /> Pages CMS
          </h1>
          <p className="cms-subtitle mb-0">
            Edit content and upload media with dimension placeholders for About, Contact, Privacy, Policy, and Terms pages using the WordPad-style editor.
          </p>
        </div>

        <div className="cms-actions d-flex align-items-center gap-2">
          <a
            href={activeMeta.path}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-secondary d-flex align-items-center gap-1.5"
            title="Open page in storefront"
          >
            <FiExternalLink /> View {activeMeta.label} Live
          </a>

          <button
            type="button"
            className="btn btn-outline-danger d-flex align-items-center gap-1.5"
            onClick={handleResetCurrentPage}
            title="Reset active page to default template"
          >
            <FiRotateCcw /> Reset Tab
          </button>

          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-1.5 px-3"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" />
                Saving...
              </>
            ) : (
              <>
                <FiSave /> Save All Pages
              </>
            )}
          </button>
        </div>
      </div>

      {/* PAGE SELECTION TABS */}
      <div className="cms-tabs-bar mb-4">
        {CMS_PAGES_META.map(meta => (
          <button
            key={meta.key}
            type="button"
            className={`cms-tab-btn ${activeTab === meta.key ? 'active' : ''}`}
            onClick={() => setActiveTab(meta.key)}
          >
            <FiFileText className="tab-icon" />
            <span className="tab-label">{meta.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading CMS page configurations...</p>
        </div>
      ) : (
        <div className="cms-page-editor-card">
          {/* TAB INFO BANNER */}
          <div className="tab-info-card mb-4">
            <div className="d-flex align-items-start gap-2">
              <FiInfo className="info-icon flex-shrink-0 mt-1" />
              <div>
                <h5 className="mb-1 text-dark font-weight-bold">{activeMeta.label} Page Settings</h5>
                <p className="small text-muted mb-0">{activeMeta.description}</p>
              </div>
            </div>
          </div>

          {/* BASIC META: TITLE & SUBTITLE */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="admin-form-label">Page Title</label>
              <input
                type="text"
                className="admin-input"
                value={currentPage.title || ''}
                onChange={(e) => handleFieldChange(activeTab, 'title', e.target.value)}
                placeholder="e.g. About Us"
              />
            </div>
            <div className="col-md-6">
              <label className="admin-form-label">Page Subtitle / Tagline</label>
              <input
                type="text"
                className="admin-input"
                value={currentPage.subtitle || ''}
                onChange={(e) => handleFieldChange(activeTab, 'subtitle', e.target.value)}
                placeholder="e.g. Our Heritage & Vision"
              />
            </div>
          </div>

          {/* MEDIA UPLOADS WITH SIZE PLACEHOLDERS */}
          <div className="cms-media-section mb-4">
            <h5 className="section-subtitle mb-3 d-flex align-items-center gap-2">
              <FiImage /> Page Header & Featured Media
            </h5>

            <div className="row g-4">
              {/* Header Banner */}
              <div className={activeMeta.hasFeaturedImage ? 'col-lg-7' : 'col-12'}>
                <FileUploadInput
                  label="Hero Header Banner Image"
                  folder="cms"
                  value={currentPage.banner_image || ''}
                  onChange={(url) => handleFieldChange(activeTab, 'banner_image', url)}
                  recommendedSize={activeMeta.bannerSizeHint}
                  placeholder="Paste banner image URL or upload landscape banner (1920x600 px)..."
                />
              </div>

              {/* Featured Image (if applicable) */}
              {activeMeta.hasFeaturedImage && (
                <div className="col-lg-5">
                  <FileUploadInput
                    label="Featured / Section Accent Image"
                    folder="cms"
                    value={currentPage.featured_image || ''}
                    onChange={(url) => handleFieldChange(activeTab, 'featured_image', url)}
                    recommendedSize={activeMeta.featuredSizeHint}
                    placeholder="Paste featured image URL or upload portrait image (800x1000 px)..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* WORDPAD-STYLE RICH CONTENT EDITABLE */}
          <div className="cms-editor-section">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <h5 className="section-subtitle mb-0 d-flex align-items-center gap-2">
                <FiFileText /> Body Content (WordPad Style WYSIWYG)
              </h5>
              <span className="small text-muted">
                Tip: Use the toolbar to style headings, lists, tables, and insert inline images with size recommendations.
              </span>
            </div>

            <WordPadEditor
              key={activeTab}
              value={currentPage.content_html || ''}
              onChange={(html) => handleFieldChange(activeTab, 'content_html', html)}
              placeholder={`Write the content for ${activeMeta.label} here...`}
              folder="cms"
              minHeight="500px"
            />
          </div>

          {/* BOTTOM SAVE BUTTON */}
          <div className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <FiCheckCircle /> Save & Publish {activeMeta.label}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsPages;

