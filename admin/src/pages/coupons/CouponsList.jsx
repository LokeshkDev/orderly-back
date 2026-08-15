import React, { useState, useEffect } from 'react';
import { 
  FiTag, FiPlus, FiSearch, FiEdit, FiTrash2, FiCopy, FiCheck, 
  FiCalendar, FiEye, FiEyeOff
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const emptyCouponForm = {
  code: '',
  discount_type: 'percentage',
  discount_value: 15,
  min_order: 1499,
  max_discount: '',
  usage_limit: 300,
  expires_at: '2026-12-31',
  is_active: true,
  show_on_pdp: true,
  show_on_checkout: true,
  description: ''
};

const CouponsList = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(emptyCouponForm);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setCoupons(res.data.data);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      setCoupons([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const notifyStoreUpdated = () => {
    try {
      localStorage.setItem('orderly_coupons_updated', String(Date.now()));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('orderly_coupons_updated'));
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    setFormData(emptyCouponForm);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingCoupon(item);
    setFormData({
      code: item.code || '',
      discount_type: item.discount_type || 'percentage',
      discount_value: Number(item.discount_value ?? 10),
      min_order: Number(item.min_order ?? item.min_order_amount ?? 0),
      max_discount: item.max_discount ? Number(item.max_discount) : '',
      usage_limit: Number(item.usage_limit ?? 100),
      expires_at: item.expires_at ? String(item.expires_at).slice(0, 10) : '2026-12-31',
      is_active: item.is_active !== false,
      show_on_pdp: item.show_on_pdp !== false,
      show_on_checkout: item.show_on_checkout !== false,
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase().replace(/\s+/g, ''),
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value) || 0,
      min_order: Number(formData.min_order) || 0,
      max_discount: formData.max_discount ? Number(formData.max_discount) : null,
      usage_limit: Number(formData.usage_limit) || 0,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      is_active: formData.is_active,
      show_on_pdp: formData.show_on_pdp,
      show_on_checkout: formData.show_on_checkout,
      description: formData.description.trim()
    };

    try {
      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, payload);
        toast.success(`Coupon "${payload.code}" updated!`);
      } else {
        await api.post('/coupons', payload);
        toast.success(`New Promo Coupon "${payload.code}" created!`);
      }
      setIsModalOpen(false);
      loadCoupons();
      notifyStoreUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Delete coupon code "${code}"?`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success(`Coupon "${code}" deleted`);
      loadCoupons();
      notifyStoreUpdated();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await api.patch(`/coupons/${item.id}/toggle`);
      toast.success(`Coupon "${item.code}" status updated`);
      loadCoupons();
      notifyStoreUpdated();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleVisibility = async (item, field) => {
    try {
      const next = field === 'show_on_pdp' ? !(item.show_on_pdp !== false) : !(item.show_on_checkout !== false);
      await api.put(`/coupons/${item.id}`, { [field]: next });
      toast.success(`Coupon "${item.code}" ${next ? 'shown' : 'hidden'} on ${field === 'show_on_pdp' ? 'Product Page' : 'Checkout Page'}`);
      loadCoupons();
      notifyStoreUpdated();
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.info(`Coupon code "${code}" copied to clipboard!`);
  };

  const filteredCoupons = coupons.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.discount_type?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="coupons-page p-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="admin-page-title d-flex align-items-center gap-2" style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.5rem' }}>
            <FiTag className="text-danger" /> Promotional Coupon & Discount Manager
          </h1>
          <p className="text-muted mb-0 small">Create promo codes, choose where they appear (Product Page / Checkout), minimum order requirements, and usage limits.</p>
        </div>
        <button type="button" className="btn-admin-red" onClick={openAddModal}>
          <FiPlus /> Create New Coupon
        </button>
      </div>

      {/* Toolbar Filter */}
      <div className="admin-card-white mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <input 
                type="text"
                placeholder="Search promo coupons by code or discount..."
                className="admin-input ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <span className="small text-muted">{filteredCoupons.length} coupon(s) — changes apply to the store instantly</span>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="admin-card-white">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th className="ps-4 py-3 text-start" style={{ minWidth: '180px' }}>COUPON CODE</th>
                <th className="text-start" style={{ minWidth: '150px' }}>DISCOUNT TYPE & VALUE</th>
                <th className="text-end" style={{ minWidth: '120px' }}>MINIMUM ORDER</th>
                <th className="text-center" style={{ minWidth: '130px' }}>USAGE STATS</th>
                <th className="text-center" style={{ minWidth: '120px' }}>EXPIRY DATE</th>
                <th className="text-center" style={{ minWidth: '110px' }}>SHOW ON PDP</th>
                <th className="text-center" style={{ minWidth: '130px' }}>SHOW ON CHECKOUT</th>
                <th className="text-center" style={{ minWidth: '100px' }}>STATUS</th>
                <th className="text-end pe-4" style={{ minWidth: '140px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">Loading coupons...</td>
                </tr>
              ) : filteredCoupons.length > 0 ? (
                filteredCoupons.map(coupon => (
                  <tr key={coupon.id}>
                    <td className="ps-4 py-3 text-start">
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center gap-2">
                          <span className="order-num-badge font-monospace fw-bold fs-6" style={{ background: '#fef2f2', border: '1px dashed #f87171', color: '#991b1b', padding: '3px 8px', borderRadius: '4px' }}>
                            {coupon.code}
                          </span>
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-muted"
                            onClick={() => copyCouponCode(coupon.code)}
                            title="Copy Code"
                          >
                            <FiCopy />
                          </button>
                        </div>
                        {coupon.description && (
                          <span className="small text-muted mt-1 text-truncate" style={{ maxWidth: '170px' }} title={coupon.description}>
                            {coupon.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-start">
                      <strong className="text-dark fs-6">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                      </strong>
                      {coupon.max_discount ? (
                        <span className="d-block small text-muted">Max discount ₹{Number(coupon.max_discount).toLocaleString()}</span>
                      ) : null}
                    </td>
                    <td className="text-end">
                      <span className="small text-dark fw-bold">₹{Number(coupon.min_order || 0).toLocaleString()}</span>
                    </td>
                    <td className="text-center">
                      <span className="small text-muted">
                        <strong className="text-dark">{coupon.used_count || 0}</strong> / {coupon.usage_limit || 'Unlimited'} uses
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="small text-dark d-inline-flex align-items-center gap-1">
                        <FiCalendar className="text-muted" /> {coupon.expires_at ? String(coupon.expires_at).slice(0, 10) : 'No Expiry'}
                      </span>
                    </td>
                    <td className="text-center">
                      <button 
                        type="button"
                        className={`btn-admin-outline py-1 px-2 ${coupon.show_on_pdp !== false ? 'text-success' : ''}`}
                        onClick={() => handleToggleVisibility(coupon, 'show_on_pdp')}
                        title="Toggle visibility on Product Detail Page"
                      >
                        {coupon.show_on_pdp !== false ? <><FiEye /> Shown</> : <><FiEyeOff /> Hidden</>}
                      </button>
                    </td>
                    <td className="text-center">
                      <button 
                        type="button"
                        className={`btn-admin-outline py-1 px-2 ${coupon.show_on_checkout !== false ? 'text-success' : ''}`}
                        onClick={() => handleToggleVisibility(coupon, 'show_on_checkout')}
                        title="Toggle visibility on Checkout Page"
                      >
                        {coupon.show_on_checkout !== false ? <><FiEye /> Shown</> : <><FiEyeOff /> Hidden</>}
                      </button>
                    </td>
                    <td className="text-center">
                      <StatusBadge status={coupon.is_active !== false ? 'active' : 'inactive'} />
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => handleToggleStatus(coupon)}
                          title="Toggle Status"
                        >
                          {coupon.is_active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => openEditModal(coupon)}
                        >
                          <FiEdit /> Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2 text-danger"
                          onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    No promo coupons found. Click "Create New Coupon" to publish your first code.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Coupon */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon ? 'Edit Promo Coupon' : 'Create New Promo Coupon'}>
        <form onSubmit={handleSaveCoupon}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">PROMO CODE *</label>
              <input 
                type="text"
                className="admin-input fw-bold text-uppercase"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. SUMMER20"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">DISCOUNT TYPE</label>
              <select 
                className="admin-select"
                value={formData.discount_type}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value }))}
              >
                <option value="percentage">Percentage Discount (% OFF)</option>
                <option value="fixed">Fixed Amount Discount (₹ OFF)</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">DISCOUNT VALUE *</label>
              <input 
                type="number"
                min="1"
                className="admin-input fw-bold"
                value={formData.discount_value}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">MINIMUM ORDER AMOUNT (₹)</label>
              <input 
                type="number"
                min="0"
                className="admin-input"
                value={formData.min_order}
                onChange={(e) => setFormData(prev => ({ ...prev, min_order: Number(e.target.value) }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">MAX DISCOUNT CAP (₹) — Optional</label>
              <input 
                type="number"
                min="0"
                className="admin-input"
                value={formData.max_discount}
                onChange={(e) => setFormData(prev => ({ ...prev, max_discount: Number(e.target.value) }))}
                placeholder="e.g. 1000 (blank = no cap)"
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">MAX USAGE LIMIT</label>
              <input 
                type="number"
                min="1"
                className="admin-input"
                value={formData.usage_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: Number(e.target.value) }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">EXPIRY DATE</label>
              <input 
                type="date"
                className="admin-input"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">OFFER DESCRIPTION (Shown on PDP & Checkout)</label>
              <input 
                type="text"
                className="admin-input"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Get extra 20% off on orders above ₹1,999"
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">DISPLAY LOCATIONS (Hide / Show)</label>
              <div className="d-flex flex-wrap gap-3">
                <label className="d-flex align-items-center gap-2 small fw-bold text-dark">
                  <input 
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.show_on_pdp}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_on_pdp: e.target.checked }))}
                  />
                  Show on Product Page (PDP)
                </label>
                <label className="d-flex align-items-center gap-2 small fw-bold text-dark">
                  <input 
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.show_on_checkout}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_on_checkout: e.target.checked }))}
                  />
                  Show on Checkout Page
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">
              <FiCheck /> {editingCoupon ? 'Save Coupon Changes' : 'Publish Coupon Code'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CouponsList;