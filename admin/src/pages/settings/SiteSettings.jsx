import React, { useState, useEffect } from 'react';
import { 
  FiMapPin, FiPhone, FiMail, FiGlobe, FiClock, FiPlus, FiTrash2, FiEdit, 
  FiCheck, FiSave, FiSettings, FiShoppingBag, FiTruck, FiDollarSign, FiShield, FiX
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
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
  shipping_fee: '99'
};

const emptyBranchForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  hours: 'Mon - Sun: 10:30 AM - 9:30 PM',
  map_url: ''
};

const SiteSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);

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
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
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
        }
      ];

      await api.put('/settings', payload);
      window.dispatchEvent(new CustomEvent('orderly_settings_updated'));
      toast.success('Storefront & General Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
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

  return (
    <div className="site-settings-page p-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="admin-page-title d-flex align-items-center gap-2" style={{ color: '#0f172a', fontWeight: 800 }}>
            <FiSettings className="text-danger" /> Storefront & General Settings
          </h1>
          <p className="text-muted mb-0 small">Manage contact details, multi-branch store locations, Google Maps embeds, and footer CMS live across the website.</p>
        </div>

        <button type="button" className="btn-admin-red" onClick={handleSaveAll} disabled={saving}>
          <FiSave /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="row g-4">
        {/* SECTION 1: CONTACT & CONCIERGE SUPPORT CMS */}
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
                  <FaWhatsapp className="text-success" /> WhatsApp Support Number
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
                  <FiMail /> VIP Support Email
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
                  <FiClock /> Operating Working Hours
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
                  <FiMapPin /> Corporate Headquarters Address
                </label>
                <textarea 
                  className="admin-input" 
                  rows={2}
                  value={settings.contact_address}
                  onChange={(e) => handleChange('contact_address', e.target.value)}
                  placeholder="Full corporate headquarters address..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: FOOTER & BRAND CMS */}
        <div className="col-12 col-lg-6">
          <div className="admin-card-white h-100 p-4">
            <h4 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
              <FiGlobe className="text-danger" /> Footer & Brand Branding CMS
            </h4>

            <div className="row g-3">
              <div className="col-12">
                <label className="admin-form-label">Storefront Brand Title</label>
                <input 
                  type="text" 
                  className="admin-input fw-bold" 
                  value={settings.store_name}
                  onChange={(e) => handleChange('store_name', e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="admin-form-label">Footer Tagline & Brand Bio</label>
                <textarea 
                  className="admin-input" 
                  rows={3}
                  value={settings.footer_bio}
                  onChange={(e) => handleChange('footer_bio', e.target.value)}
                  placeholder="Crafting Bespoke Luxury Apparel & Italian Tailoring..."
                />
              </div>

              <div className="col-12">
                <label className="admin-form-label">Footer Copyright Notice</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  value={settings.footer_copyright}
                  onChange={(e) => handleChange('footer_copyright', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: MULTI-BRANCH STORE LOCATIONS & GOOGLE MAPS INTEGRATION */}
        <div className="col-12">
          <div className="admin-card-white p-4">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom pb-3 mb-4">
              <div>
                <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <FiMapPin className="text-danger" /> Multi-Branch Store Locations & Google Maps CMS ({branches.length} Active Branches)
                </h4>
                <p className="text-muted small mb-0">Add and manage physical boutique locations with Google Maps iframe embeds. Add 3rd, 4th, or more branches anytime.</p>
              </div>
              <button type="button" className="btn-admin-red" onClick={openAddBranchModal}>
                <FiPlus /> Add New Store Branch
              </button>
            </div>

            {/* Branches List Cards */}
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

                    {/* Google Maps Preview Embed */}
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
        </div>

        {/* SECTION 4: SHIPPING & CHECKOUT RULES */}
        <div className="col-12">
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
        </div>

        {/* Bottom Save Button */}
        <div className="col-12 text-end">
          <button type="submit" className="btn-admin-red py-2 px-4" disabled={saving}>
            <FiCheck /> {saving ? 'Saving Settings...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      {/* MODAL: Add/Edit Branch */}
      <Modal isOpen={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title={editingBranch ? 'Edit Store Branch' : 'Add New Store Branch'}>
        <form onSubmit={handleSaveBranch}>
          <div className="row g-3">
            <div className="col-12">
              <label className="admin-form-label">Branch Name *</label>
              <input 
                type="text" 
                className="admin-input"
                value={branchForm.name}
                onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. ORDERLY Bespoke Studio (Connaught Place, New Delhi)"
                required
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Full Address *</label>
              <textarea 
                className="admin-input"
                rows={2}
                value={branchForm.address}
                onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Building name, Street, Landmark, City, State - Pincode"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Branch Contact Phone</label>
              <input 
                type="text" 
                className="admin-input"
                value={branchForm.phone}
                onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43212"
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Branch Email</label>
              <input 
                type="email" 
                className="admin-input"
                value={branchForm.email}
                onChange={(e) => setBranchForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="delhi.store@orderly.com"
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Boutique Operating Hours</label>
              <input 
                type="text" 
                className="admin-input"
                value={branchForm.hours}
                onChange={(e) => setBranchForm(prev => ({ ...prev, hours: e.target.value }))}
                placeholder="Mon - Sun: 10:30 AM - 9:30 PM"
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Google Maps Iframe Embed URL / Share Link</label>
              <input 
                type="text" 
                className="admin-input font-monospace extra-small"
                value={branchForm.map_url}
                onChange={(e) => setBranchForm(prev => ({ ...prev, map_url: e.target.value }))}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <span className="form-text text-muted extra-small">Tip: Copy the embed URL from Google Maps ➔ Share ➔ Embed a map ➔ Copy HTML (extract src URL).</span>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsBranchModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">
              <FiCheck /> {editingBranch ? 'Save Branch Changes' : 'Add Store Branch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SiteSettings;
