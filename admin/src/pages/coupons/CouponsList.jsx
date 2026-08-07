import React, { useState, useEffect } from 'react';
import { 
  FiTag, FiPlus, FiSearch, FiEdit, FiTrash2, FiCopy, FiCheck, 
  FiPercent, FiDollarSign, FiCalendar, FiClock, FiGrid, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const DEFAULT_COUPONS = [
  {
    id: 1,
    code: 'ORDERLY20',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_amount: 1999,
    usage_limit: 500,
    times_used: 142,
    expiry_date: '2026-12-31',
    is_active: true
  },
  {
    id: 2,
    code: 'FESTIVE500',
    discount_type: 'fixed_amount',
    discount_value: 500,
    min_order_amount: 2999,
    usage_limit: 200,
    times_used: 89,
    expiry_date: '2026-10-15',
    is_active: true
  },
  {
    id: 3,
    code: 'WELCOME100',
    discount_type: 'fixed_amount',
    discount_value: 300,
    min_order_amount: 999,
    usage_limit: 1000,
    times_used: 412,
    expiry_date: '2026-11-30',
    is_active: true
  }
];

const emptyCouponForm = {
  code: '',
  discount_type: 'percentage',
  discount_value: 15,
  min_order_amount: 1499,
  usage_limit: 300,
  expiry_date: '2026-12-31',
  is_active: true
};

const CouponsList = () => {
  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('orderly_coupons');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_COUPONS;
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(emptyCouponForm);

  const saveCouponsToStorage = (updatedList) => {
    setCoupons(updatedList);
    try {
      localStorage.setItem('orderly_coupons', JSON.stringify(updatedList));
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
      discount_value: item.discount_value || 10,
      min_order_amount: item.min_order_amount || 0,
      usage_limit: item.usage_limit || 100,
      expiry_date: item.expiry_date || '2026-12-31',
      is_active: item.is_active !== false
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    const uppercaseCode = formData.code.trim().toUpperCase().replace(/\s+/g, '');

    if (editingCoupon) {
      const updated = coupons.map(c => c.id === editingCoupon.id ? { ...c, ...formData, code: uppercaseCode } : c);
      saveCouponsToStorage(updated);
      toast.success(`Coupon "${uppercaseCode}" updated!`);
    } else {
      const newCoupon = {
        id: Date.now(),
        ...formData,
        code: uppercaseCode,
        times_used: 0
      };
      saveCouponsToStorage([newCoupon, ...coupons]);
      toast.success(`New Promo Coupon "${uppercaseCode}" created!`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCoupon = (id, code) => {
    if (window.confirm(`Delete coupon code "${code}"?`)) {
      const updated = coupons.filter(c => c.id !== id);
      saveCouponsToStorage(updated);
      toast.success(`Coupon "${code}" deleted`);
    }
  };

  const handleToggleStatus = (item) => {
    const updated = coupons.map(c => c.id === item.id ? { ...c, is_active: !c.is_active } : c);
    saveCouponsToStorage(updated);
    toast.success(`Coupon "${item.code}" status updated`);
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.info(`Coupon code "${code}" copied to clipboard!`);
  };

  const filteredCoupons = coupons.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.discount_type?.toLowerCase().includes(q)
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
          <p className="text-muted mb-0 small">Create promo codes, percentage discounts, minimum order requirements, and usage limits.</p>
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
        </div>
      </div>

      {/* Coupons Table */}
      <div className="admin-card-white">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th className="ps-4 py-3">COUPON CODE</th>
                <th>DISCOUNT TYPE & VALUE</th>
                <th>MINIMUM ORDER</th>
                <th>USAGE STATS</th>
                <th>EXPIRY DATE</th>
                <th>STATUS</th>
                <th className="text-end pe-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length > 0 ? (
                filteredCoupons.map(coupon => (
                  <tr key={coupon.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="order-num-badge font-monospace fw-bold text-dark fs-6" style={{ background: '#fef2f2', border: '1px dashed #f87171', color: '#991b1b' }}>
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
                    </td>
                    <td>
                      <strong className="text-dark fs-6">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                      </strong>
                    </td>
                    <td>
                      <span className="small text-dark fw-bold">₹{Number(coupon.min_order_amount || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="small text-muted">
                        <strong className="text-dark">{coupon.times_used || 0}</strong> / {coupon.usage_limit || 'Unlimited'} uses
                      </span>
                    </td>
                    <td>
                      <span className="small text-dark d-flex align-items-center gap-1">
                        <FiCalendar className="text-muted" /> {coupon.expiry_date}
                      </span>
                    </td>
                    <td>
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
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No promo coupons found matching your search.
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
                <option value="fixed_amount">Fixed Amount Discount (₹ OFF)</option>
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
                value={formData.min_order_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: Number(e.target.value) }))}
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
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
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
