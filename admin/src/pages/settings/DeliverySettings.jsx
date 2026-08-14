import React, { useState, useEffect } from 'react';
import { 
  FiTruck, FiDollarSign, FiMapPin, FiPackage, FiSave, FiPlus, 
  FiTrash2, FiEdit2, FiCheck, FiX, FiMail, FiSend, FiInfo, FiSliders, FiList, FiAlertTriangle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { 
  DEFAULT_DELIVERY_SETTINGS, 
  DEFAULT_COURIER_SETTINGS 
} from '../../utils/deliveryCalculator.js';
import './DeliverySettings.css';

const DEFAULT_EMAIL_SETTINGS = {
  new_order: {
    enabled: true,
    subject: 'ORDERLY | Order Confirmed | #{{orderNumber}}',
    custom_message: ''
  },
  order_shipped: {
    enabled: true,
    subject: 'ORDERLY | Your Order Has Been Shipped! | #{{orderNumber}}',
    custom_message: ''
  },
  order_delivered: {
    enabled: true,
    subject: 'ORDERLY | Your Order Has Been Delivered! | #{{orderNumber}}',
    custom_message: ''
  }
};

const DeliverySettings = () => {
  const [activeTab, setActiveTab] = useState('delivery'); // 'delivery' | 'couriers' | 'emails'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delivery configuration state
  const [delivery, setDelivery] = useState(DEFAULT_DELIVERY_SETTINGS);

  // Courier configuration state
  const [couriers, setCouriers] = useState(DEFAULT_COURIER_SETTINGS);

  // Email notifications configuration state
  const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL_SETTINGS);

  // Modal / Form state for adding/editing price ranges
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [editingRangeIndex, setEditingRangeIndex] = useState(null);
  const [rangeForm, setRangeForm] = useState({ min: '', max: '', charge: '' });

  // Modal / Form state for adding/editing couriers
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [editingCourierId, setEditingCourierId] = useState(null);
  const [courierForm, setCourierForm] = useState({ name: '', tracking_url_template: '' });

  // Pincode range edit state
  const [chennaiPincodesText, setChennaiPincodesText] = useState('');
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [editingPincodeLocation, setEditingPincodeLocation] = useState('chennai'); // 'chennai' | 'tamil_nadu'

  useEffect(() => {
    setLoading(true);
    api.get('/settings')
      .then(res => {
        if (res.data && res.data.success && res.data.data) {
          const fetched = res.data.data;
          if (fetched.delivery_settings) {
            try {
              const d = typeof fetched.delivery_settings === 'string'
                ? JSON.parse(fetched.delivery_settings)
                : fetched.delivery_settings;
              setDelivery({
                ...DEFAULT_DELIVERY_SETTINGS,
                ...d,
                price_based: { ...DEFAULT_DELIVERY_SETTINGS.price_based, ...(d.price_based || {}) },
                pincode_based: { ...DEFAULT_DELIVERY_SETTINGS.pincode_based, ...(d.pincode_based || {}) },
                item_based: { ...DEFAULT_DELIVERY_SETTINGS.item_based, ...(d.item_based || {}) }
              });
            } catch (e) {}
          }
          if (fetched.courier_settings) {
            try {
              const c = typeof fetched.courier_settings === 'string'
                ? JSON.parse(fetched.courier_settings)
                : fetched.courier_settings;
              if (Array.isArray(c) && c.length > 0) setCouriers(c);
            } catch (e) {}
          }
          if (fetched.email_settings) {
            try {
              const em = typeof fetched.email_settings === 'string'
                ? JSON.parse(fetched.email_settings)
                : fetched.email_settings;
              setEmailSettings({ ...DEFAULT_EMAIL_SETTINGS, ...em });
            } catch (e) {}
          }
        }
      })
      .catch(err => console.error('Error fetching settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = [
        {
          key: 'delivery_settings',
          value: JSON.stringify(delivery),
          type: 'json'
        },
        {
          key: 'courier_settings',
          value: JSON.stringify(couriers),
          type: 'json'
        },
        {
          key: 'email_settings',
          value: JSON.stringify(emailSettings),
          type: 'json'
        }
      ];

      await api.put('/settings', payload);
      window.dispatchEvent(new CustomEvent('orderly_settings_updated'));
      toast.success('Delivery & Shipping Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save delivery settings');
    } finally {
      setSaving(false);
    }
  };

  // --- PRICE RANGES LOGIC ---
  const openAddRangeModal = () => {
    setEditingRangeIndex(null);
    setRangeForm({ min: '', max: '', charge: '' });
    setShowRangeModal(true);
  };

  const openEditRangeModal = (idx) => {
    setEditingRangeIndex(idx);
    const r = delivery.price_based.ranges[idx];
    setRangeForm({
      min: r.min !== undefined && r.min !== null ? String(r.min) : '',
      max: r.max !== undefined && r.max !== null ? String(r.max) : '',
      charge: r.charge !== undefined && r.charge !== null ? String(r.charge) : ''
    });
    setShowRangeModal(true);
  };

  const handleSaveRange = (e) => {
    e.preventDefault();
    const minVal = parseFloat(rangeForm.min);
    const maxVal = rangeForm.max === '' || rangeForm.max === null ? null : parseFloat(rangeForm.max);
    const chargeVal = parseFloat(rangeForm.charge);

    if (isNaN(minVal) || minVal < 0) {
      toast.error('Minimum order amount must be a positive number');
      return;
    }
    if (maxVal !== null && (isNaN(maxVal) || maxVal < minVal)) {
      toast.error('Maximum order amount must be greater than or equal to minimum amount');
      return;
    }
    if (isNaN(chargeVal) || chargeVal < 0) {
      toast.error('Delivery charge must be a positive number (0 for free delivery)');
      return;
    }

    const currentRanges = [...(delivery.price_based.ranges || [])];
    const newEntry = { min: minVal, max: maxVal, charge: chargeVal };

    if (editingRangeIndex !== null) {
      currentRanges[editingRangeIndex] = newEntry;
    } else {
      currentRanges.push(newEntry);
    }

    // Sort ranges by min value
    currentRanges.sort((a, b) => Number(a.min) - Number(b.min));

    setDelivery(prev => ({
      ...prev,
      price_based: {
        ...prev.price_based,
        ranges: currentRanges
      }
    }));

    setShowRangeModal(false);
    toast.success(editingRangeIndex !== null ? 'Price range updated' : 'New price range added');
  };

  const handleDeleteRange = (idx) => {
    const updated = delivery.price_based.ranges.filter((_, i) => i !== idx);
    setDelivery(prev => ({
      ...prev,
      price_based: {
        ...prev.price_based,
        ranges: updated
      }
    }));
    toast.success('Price range removed');
  };

  // --- PINCODES MODAL LOGIC ---
  const openPincodesModal = (locationKey) => {
    setEditingPincodeLocation(locationKey);
    const config = locationKey === 'chennai' ? delivery.pincode_based.chennai : delivery.pincode_based.tamil_nadu;
    const pincodesList = Array.isArray(config?.pincodes) ? config.pincodes.join(', ') : '';
    setChennaiPincodesText(pincodesList);
    setShowPincodeModal(true);
  };

  const handleSavePincodes = () => {
    const parsedPincodes = chennaiPincodesText
      .split(/[\s,]+/)
      .map(p => p.trim())
      .filter(p => /^[1-9][0-9]{5}$/.test(p));

    setDelivery(prev => ({
      ...prev,
      pincode_based: {
        ...prev.pincode_based,
        [editingPincodeLocation]: {
          ...prev.pincode_based[editingPincodeLocation],
          pincodes: Array.from(new Set(parsedPincodes))
        }
      }
    }));

    setShowPincodeModal(false);
    toast.success(`Updated ${parsedPincodes.length} pincodes for ${editingPincodeLocation === 'chennai' ? 'Chennai' : 'Tamil Nadu'}`);
  };

  // --- COURIERS LOGIC ---
  const openAddCourierModal = () => {
    setEditingCourierId(null);
    setCourierForm({ name: '', tracking_url_template: '' });
    setShowCourierModal(true);
  };

  const openEditCourierModal = (courier) => {
    setEditingCourierId(courier.id);
    setCourierForm({ name: courier.name, tracking_url_template: courier.tracking_url_template });
    setShowCourierModal(true);
  };

  const handleSaveCourier = (e) => {
    e.preventDefault();
    if (!courierForm.name.trim()) {
      toast.error('Courier name is required');
      return;
    }
    if (!courierForm.tracking_url_template.includes('{trackingNumber}')) {
      toast.warning('Tip: Use {trackingNumber} placeholder in tracking URL template');
    }

    if (editingCourierId) {
      setCouriers(prev => prev.map(c => c.id === editingCourierId ? { ...c, ...courierForm } : c));
      toast.success(`Courier "${courierForm.name}" updated`);
    } else {
      const newId = courierForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newCourier = {
        id: newId,
        name: courierForm.name.trim(),
        tracking_url_template: courierForm.tracking_url_template.trim(),
        active: true
      };
      setCouriers(prev => [...prev, newCourier]);
      toast.success(`Courier "${courierForm.name}" added`);
    }
    setShowCourierModal(false);
  };

  const handleDeleteCourier = (id, name) => {
    if (window.confirm(`Delete courier "${name}"?`)) {
      setCouriers(prev => prev.filter(c => c.id !== id));
      toast.success(`Courier "${name}" removed`);
    }
  };

  if (loading) {
    return (
      <div className="delivery-settings-page p-4 text-center py-5">
        <span className="spinner-border text-danger" role="status" />
        <p className="mt-3 text-muted">Loading delivery configurations...</p>
      </div>
    );
  }

  return (
    <div className="delivery-settings-page p-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="admin-page-title d-flex align-items-center gap-2" style={{ color: '#0f172a', fontWeight: 800 }}>
            <FiTruck className="text-danger" /> Delivery & Shipping Management
          </h1>
          <p className="text-muted mb-0 small">
            Configure Price-Based, Pincode-Based, and Item-Based delivery calculations, courier tracking URLs, and automated status emails.
          </p>
        </div>

        <button type="button" className="btn-admin-red" onClick={handleSaveAll} disabled={saving}>
          <FiSave /> {saving ? 'Saving...' : 'Save Delivery Settings'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="delivery-nav-tabs mb-4">
        <button 
          className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery')}
        >
          <FiTruck /> 1. Delivery Charge Methods
        </button>
        <button 
          className={`tab-btn ${activeTab === 'couriers' ? 'active' : ''}`}
          onClick={() => setActiveTab('couriers')}
        >
          <FiPackage /> 2. Courier Services & Tracking URLs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
          onClick={() => setActiveTab('emails')}
        >
          <FiMail /> 3. Order Email Notifications
        </button>
      </div>

      {/* TAB 1: DELIVERY METHODS */}
      {activeTab === 'delivery' && (
        <div className="row g-4">
          
          {/* PRIORITY SELECTION CARD */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FiSliders className="text-danger" /> Primary Delivery Calculation Priority
                  </h5>
                  <p className="text-muted small mb-0">
                    When multiple methods are enabled, the engine calculates the fee using your selected primary method.
                  </p>
                </div>
                <div style={{ minWidth: '280px' }}>
                  <select 
                    className="admin-select"
                    value={delivery.priority || 'pincode_based'}
                    onChange={(e) => setDelivery(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="pincode_based">Priority 1: Pincode / Location Based</option>
                    <option value="price_based">Priority 1: Price / Order-Value Based</option>
                    <option value="item_based">Priority 1: Item-Count Based</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* METHOD 1: PRICE-BASED DELIVERY CHARGE */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="method-pill bg-danger-subtle text-danger fw-bold px-2 py-1 rounded small">METHOD 1</span>
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <FiDollarSign className="text-danger" /> Price / Order-Value Based Delivery
                  </h5>
                </div>
                <label className="admin-toggle-switch">
                  <input 
                    type="checkbox"
                    checked={Boolean(delivery.price_based?.enabled)}
                    onChange={(e) => setDelivery(prev => ({
                      ...prev,
                      price_based: { ...prev.price_based, enabled: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Minimum Order Value Configuration */}
              <div className="row g-3 mb-4 p-3 bg-light rounded-3">
                <div className="col-md-6 d-flex align-items-center">
                  <label className="d-flex align-items-center gap-2 cursor-pointer mb-0">
                    <input 
                      type="checkbox" 
                      className="form-check-input"
                      checked={Boolean(delivery.price_based?.min_order_required)}
                      onChange={(e) => setDelivery(prev => ({
                        ...prev,
                        price_based: { ...prev.price_based, min_order_required: e.target.checked }
                      }))}
                    />
                    <span className="fw-semibold text-dark">Require Minimum Cart Value for Delivery</span>
                  </label>
                </div>
                {delivery.price_based?.min_order_required && (
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted text-nowrap">Minimum Amount: ₹</span>
                      <input 
                        type="number"
                        className="admin-input py-1"
                        placeholder="500"
                        value={delivery.price_based?.min_order_amount ?? 500}
                        onChange={(e) => setDelivery(prev => ({
                          ...prev,
                          price_based: { ...prev.price_based, min_order_amount: Number(e.target.value) }
                        }))}
                        style={{ maxWidth: '160px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Price Ranges Table */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-bold text-dark small text-uppercase">Configured Price Ranges</span>
                <button type="button" className="btn-admin-outline py-1 px-3 small" onClick={openAddRangeModal}>
                  <FiPlus /> Add Price Range
                </button>
              </div>

              <div className="table-responsive">
                <table className="admin-matrix-table align-middle">
                  <thead>
                    <tr>
                      <th>MINIMUM ORDER</th>
                      <th>MAXIMUM ORDER</th>
                      <th>DELIVERY CHARGE</th>
                      <th className="text-end">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(delivery.price_based?.ranges || []).map((r, idx) => (
                      <tr key={idx}>
                        <td><strong>₹{r.min}</strong></td>
                        <td>{r.max !== null && r.max !== undefined && r.max !== '' ? `₹${r.max}` : <span className="badge bg-secondary">No Maximum (Above)</span>}</td>
                        <td>
                          {Number(r.charge) === 0 ? (
                            <span className="badge bg-success">₹0 (Free Delivery)</span>
                          ) : (
                            <strong className="text-danger">₹{r.charge}</strong>
                          )}
                        </td>
                        <td className="text-end">
                          <button type="button" className="btn-action-icon me-2" onClick={() => openEditRangeModal(idx)}>
                            <FiEdit2 />
                          </button>
                          <button type="button" className="btn-action-icon text-danger" onClick={() => handleDeleteRange(idx)}>
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(delivery.price_based?.ranges || []).length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-3">
                          No price ranges configured. Click "Add Price Range" to add your first range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* METHOD 2: PINCODE/LOCATION BASED DELIVERY CHARGE */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="method-pill bg-danger-subtle text-danger fw-bold px-2 py-1 rounded small">METHOD 2</span>
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <FiMapPin className="text-danger" /> Pincode / Location Based Delivery
                  </h5>
                </div>
                <label className="admin-toggle-switch">
                  <input 
                    type="checkbox"
                    checked={Boolean(delivery.pincode_based?.enabled)}
                    onChange={(e) => setDelivery(prev => ({
                      ...prev,
                      pincode_based: { ...prev.pincode_based, enabled: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="row g-4">
                {/* A. Chennai */}
                <div className="col-md-4">
                  <div className="p-3 border rounded-3 h-100 bg-light">
                    <h6 className="fw-bold text-dark d-flex align-items-center justify-content-between">
                      <span>Chennai Pincodes</span>
                      <span className="badge bg-dark text-white">Local</span>
                    </h6>
                    <div className="my-3">
                      <label className="admin-form-label">Delivery Charge (₹)</label>
                      <input 
                        type="number"
                        className="admin-input"
                        value={delivery.pincode_based?.chennai?.charge ?? 50}
                        onChange={(e) => setDelivery(prev => ({
                          ...prev,
                          pincode_based: {
                            ...prev.pincode_based,
                            chennai: { ...prev.pincode_based.chennai, charge: Number(e.target.value) }
                          }
                        }))}
                        placeholder="50"
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="extra-small text-muted">
                        {(delivery.pincode_based?.chennai?.pincodes || []).length} pincodes (600001 - 600130)
                      </span>
                      <button type="button" className="btn-admin-outline py-1 px-2 extra-small" onClick={() => openPincodesModal('chennai')}>
                        Manage Pincodes
                      </button>
                    </div>
                  </div>
                </div>

                {/* B. Tamil Nadu */}
                <div className="col-md-4">
                  <div className="p-3 border rounded-3 h-100 bg-light">
                    <h6 className="fw-bold text-dark d-flex align-items-center justify-content-between">
                      <span>Tamil Nadu (Rest)</span>
                      <span className="badge bg-primary text-white">Regional</span>
                    </h6>
                    <div className="my-3">
                      <label className="admin-form-label">Delivery Charge (₹)</label>
                      <input 
                        type="number"
                        className="admin-input"
                        value={delivery.pincode_based?.tamil_nadu?.charge ?? 80}
                        onChange={(e) => setDelivery(prev => ({
                          ...prev,
                          pincode_based: {
                            ...prev.pincode_based,
                            tamil_nadu: { ...prev.pincode_based.tamil_nadu, charge: Number(e.target.value) }
                          }
                        }))}
                        placeholder="80"
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="extra-small text-muted">
                        Range 600001 - 643999
                      </span>
                      <button type="button" className="btn-admin-outline py-1 px-2 extra-small" onClick={() => openPincodesModal('tamil_nadu')}>
                        Manage Pincodes
                      </button>
                    </div>
                  </div>
                </div>

                {/* C. Other States */}
                <div className="col-md-4">
                  <div className="p-3 border rounded-3 h-100 bg-light">
                    <h6 className="fw-bold text-dark d-flex align-items-center justify-content-between">
                      <span>Other States (National)</span>
                      <span className="badge bg-secondary text-white">National</span>
                    </h6>
                    <div className="my-3">
                      <label className="admin-form-label">Delivery Charge (₹)</label>
                      <input 
                        type="number"
                        className="admin-input"
                        value={delivery.pincode_based?.other_states?.charge ?? 150}
                        onChange={(e) => setDelivery(prev => ({
                          ...prev,
                          pincode_based: {
                            ...prev.pincode_based,
                            other_states: { ...prev.pincode_based.other_states, charge: Number(e.target.value) }
                          }
                        }))}
                        placeholder="150"
                      />
                    </div>
                    <span className="extra-small text-muted d-block mt-2">
                      Auto-applied for all non-Tamil Nadu pin codes across India
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* METHOD 3: ITEM-COUNT BASED DELIVERY CHARGE */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="method-pill bg-danger-subtle text-danger fw-bold px-2 py-1 rounded small">METHOD 3</span>
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <FiPackage className="text-danger" /> Item-Count / Quantity Based Delivery
                  </h5>
                </div>
                <label className="admin-toggle-switch">
                  <input 
                    type="checkbox"
                    checked={Boolean(delivery.item_based?.enabled)}
                    onChange={(e) => setDelivery(prev => ({
                      ...prev,
                      item_based: { ...prev.item_based, enabled: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="row g-4 mb-3">
                <div className="col-md-6">
                  <label className="admin-form-label">First Item Charge (₹)</label>
                  <input 
                    type="number"
                    className="admin-input"
                    value={delivery.item_based?.first_item_charge ?? 50}
                    onChange={(e) => setDelivery(prev => ({
                      ...prev,
                      item_based: { ...prev.item_based, first_item_charge: Number(e.target.value) }
                    }))}
                    placeholder="50"
                  />
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label">Additional Charge Per Extra Item (₹)</label>
                  <input 
                    type="number"
                    className="admin-input"
                    value={delivery.item_based?.additional_item_charge ?? 10}
                    onChange={(e) => setDelivery(prev => ({
                      ...prev,
                      item_based: { ...prev.item_based, additional_item_charge: Number(e.target.value) }
                    }))}
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Live Preview calculation */}
              <div className="p-3 bg-light rounded-3 border">
                <span className="extra-small fw-bold text-muted text-uppercase d-block mb-2">Live Calculation Simulation:</span>
                <div className="row g-2 text-dark small">
                  <div className="col-6 col-md-3"><strong>1 item:</strong> ₹{delivery.item_based?.first_item_charge || 50}</div>
                  <div className="col-6 col-md-3"><strong>2 items:</strong> ₹{(Number(delivery.item_based?.first_item_charge || 50) + Number(delivery.item_based?.additional_item_charge || 10))}</div>
                  <div className="col-6 col-md-3"><strong>3 items:</strong> ₹{(Number(delivery.item_based?.first_item_charge || 50) + 2 * Number(delivery.item_based?.additional_item_charge || 10))}</div>
                  <div className="col-6 col-md-3"><strong>4 items:</strong> ₹{(Number(delivery.item_based?.first_item_charge || 50) + 3 * Number(delivery.item_based?.additional_item_charge || 10))}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: COURIERS & TRACKING URLS */}
      {activeTab === 'couriers' && (
        <div className="admin-card-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
            <div>
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <FiPackage className="text-danger" /> Courier Partners & Live Tracking URL Templates
              </h5>
              <p className="text-muted small mb-0">
                Define the couriers available when fulfilling orders (ST Courier, DTDC, Franch, Professional, etc.) and their dynamic tracking link formats.
              </p>
            </div>
            <button type="button" className="btn-admin-outline" onClick={openAddCourierModal}>
              <FiPlus /> Add Courier
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-matrix-table align-middle">
              <thead>
                <tr>
                  <th style={{ width: '200px' }}>COURIER NAME</th>
                  <th>TRACKING URL TEMPLATE</th>
                  <th style={{ width: '120px' }}>STATUS</th>
                  <th className="text-end" style={{ width: '100px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {couriers.map((c) => (
                  <tr key={c.id}>
                    <td><strong className="text-dark">{c.name}</strong></td>
                    <td>
                      <code className="text-danger" style={{ wordBreak: 'break-all' }}>
                        {c.tracking_url_template || 'https://...'}
                      </code>
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        Active
                      </span>
                    </td>
                    <td className="text-end">
                      <button type="button" className="btn-action-icon me-2" onClick={() => openEditCourierModal(c)}>
                        <FiEdit2 />
                      </button>
                      <button type="button" className="btn-action-icon text-danger" onClick={() => handleDeleteCourier(c.id, c.name)}>
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

      {/* TAB 3: EMAIL NOTIFICATIONS */}
      {activeTab === 'emails' && (
        <div className="row g-4">
          {/* A. NEW ORDER EMAIL */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FiMail className="text-success" /> 1. New Order Confirmation Email
                </h5>
                <label className="admin-toggle-switch">
                  <input 
                    type="checkbox"
                    checked={Boolean(emailSettings.new_order?.enabled)}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      new_order: { ...prev.new_order, enabled: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="admin-form-label">Email Subject</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    value={emailSettings.new_order?.subject || ''}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      new_order: { ...prev.new_order, subject: e.target.value }
                    }))}
                    placeholder="ORDERLY | Order Confirmed | #{{orderNumber}}"
                  />
                </div>
                <div className="col-12">
                  <label className="admin-form-label">Custom Message (Optional notes above items list)</label>
                  <textarea 
                    className="admin-input" 
                    rows="2"
                    value={emailSettings.new_order?.custom_message || ''}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      new_order: { ...prev.new_order, custom_message: e.target.value }
                    }))}
                    placeholder="Thank you for shopping with ORDERLY! Your items are now being prepared."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* B. ORDER SHIPPED EMAIL */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FiSend className="text-primary" /> 2. Order Shipped Notification Email
                </h5>
                <label className="admin-toggle-switch">
                  <input 
                    type="checkbox"
                    checked={Boolean(emailSettings.order_shipped?.enabled)}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      order_shipped: { ...prev.order_shipped, enabled: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="admin-form-label">Email Subject</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    value={emailSettings.order_shipped?.subject || ''}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      order_shipped: { ...prev.order_shipped, subject: e.target.value }
                    }))}
                    placeholder="ORDERLY | Your Order Has Been Shipped! | #{{orderNumber}}"
                  />
                </div>
                <div className="col-12">
                  <label className="admin-form-label">Custom Message (Optional)</label>
                  <textarea 
                    className="admin-input" 
                    rows="2"
                    value={emailSettings.order_shipped?.custom_message || ''}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      order_shipped: { ...prev.order_shipped, custom_message: e.target.value }
                    }))}
                    placeholder="Your parcel has been handed over to {{courierName}}."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* C. ORDER DELIVERED EMAIL */}
          <div className="col-12">
            <div className="admin-card-white p-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FiCheck className="text-success" /> 3. Order Delivered Notification Email
                </h5>
                <label className="admin-toggle-switch">
                  <input 
                    type="checkbox"
                    checked={Boolean(emailSettings.order_delivered?.enabled)}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      order_delivered: { ...prev.order_delivered, enabled: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="admin-form-label">Email Subject</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    value={emailSettings.order_delivered?.subject || ''}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      order_delivered: { ...prev.order_delivered, subject: e.target.value }
                    }))}
                    placeholder="ORDERLY | Your Order Has Been Delivered! | #{{orderNumber}}"
                  />
                </div>
                <div className="col-12">
                  <label className="admin-form-label">Custom Message (Optional)</label>
                  <textarea 
                    className="admin-input" 
                    rows="2"
                    value={emailSettings.order_delivered?.custom_message || ''}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      order_delivered: { ...prev.order_delivered, custom_message: e.target.value }
                    }))}
                    placeholder="We hope you enjoy your new menswear."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Variables Guide Card */}
          <div className="col-12">
            <div className="p-3 bg-light rounded-3 border">
              <span className="fw-bold text-dark small d-block mb-2">Available Template Variables:</span>
              <div className="d-flex flex-wrap gap-2">
                {[
                  '{{customerName}}', '{{orderNumber}}', '{{orderDate}}', '{{products}}',
                  '{{subtotal}}', '{{discount}}', '{{deliveryCharge}}', '{{total}}',
                  '{{courierName}}', '{{trackingNumber}}', '{{trackingUrl}}', '{{deliveryDate}}', '{{shippingAddress}}'
                ].map(tag => (
                  <code key={tag} className="badge bg-white text-dark border px-2 py-1">{tag}</code>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRICE RANGE */}
      {showRangeModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom glass-panel">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="fw-bold text-dark mb-0">
                {editingRangeIndex !== null ? 'Edit Price Range' : 'Add New Price Range'}
              </h5>
              <button className="btn-close-custom" onClick={() => setShowRangeModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSaveRange}>
              <div className="mb-3">
                <label className="admin-form-label">Minimum Order Amount (₹) *</label>
                <input 
                  type="number"
                  className="admin-input"
                  required
                  min="0"
                  value={rangeForm.min}
                  onChange={(e) => setRangeForm({ ...rangeForm, min: e.target.value })}
                  placeholder="e.g. 0 or 500"
                />
              </div>
              <div className="mb-3">
                <label className="admin-form-label">Maximum Order Amount (₹) <span className="text-muted">(Leave empty for No Maximum)</span></label>
                <input 
                  type="number"
                  className="admin-input"
                  min="0"
                  value={rangeForm.max}
                  onChange={(e) => setRangeForm({ ...rangeForm, max: e.target.value })}
                  placeholder="e.g. 499 (or leave blank for 2000+)"
                />
              </div>
              <div className="mb-4">
                <label className="admin-form-label">Delivery Charge (₹) * <span className="text-muted">(0 for Free Delivery)</span></label>
                <input 
                  type="number"
                  className="admin-input"
                  required
                  min="0"
                  value={rangeForm.charge}
                  onChange={(e) => setRangeForm({ ...rangeForm, charge: e.target.value })}
                  placeholder="e.g. 100 or 0"
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn-admin-outline" onClick={() => setShowRangeModal(false)}>Cancel</button>
                <button type="submit" className="btn-admin-red">Save Range</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE PINCODES */}
      {showPincodeModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom glass-panel" style={{ maxWidth: '600px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="fw-bold text-dark mb-0">
                Manage {editingPincodeLocation === 'chennai' ? 'Chennai' : 'Tamil Nadu'} Pincodes
              </h5>
              <button className="btn-close-custom" onClick={() => setShowPincodeModal(false)}><FiX /></button>
            </div>
            <div>
              <p className="text-muted small mb-2">
                Paste 6-digit pincodes separated by commas or spaces.
              </p>
              <textarea 
                className="admin-input mb-3"
                rows="8"
                value={chennaiPincodesText}
                onChange={(e) => setChennaiPincodesText(e.target.value)}
                placeholder="600001, 600002, 600003, 600004..."
              />
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn-admin-outline" onClick={() => setShowPincodeModal(false)}>Cancel</button>
                <button type="button" className="btn-admin-red" onClick={handleSavePincodes}>Save Pincodes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COURIER */}
      {showCourierModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom glass-panel">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="fw-bold text-dark mb-0">
                {editingCourierId ? 'Edit Courier Partner' : 'Add Courier Partner'}
              </h5>
              <button className="btn-close-custom" onClick={() => setShowCourierModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSaveCourier}>
              <div className="mb-3">
                <label className="admin-form-label">Courier Name *</label>
                <input 
                  type="text"
                  className="admin-input"
                  required
                  value={courierForm.name}
                  onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                  placeholder="e.g. ST Courier or DTDC"
                />
              </div>
              <div className="mb-4">
                <label className="admin-form-label">Tracking URL Template *</label>
                <input 
                  type="text"
                  className="admin-input"
                  required
                  value={courierForm.tracking_url_template}
                  onChange={(e) => setCourierForm({ ...courierForm, tracking_url_template: e.target.value })}
                  placeholder="https://courier.com/track?awb={trackingNumber}"
                />
                <span className="extra-small text-muted d-block mt-1">
                  Use <code>{'{trackingNumber}'}</code> as the placeholder for the AWB number.
                </span>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn-admin-outline" onClick={() => setShowCourierModal(false)}>Cancel</button>
                <button type="submit" className="btn-admin-red">Save Courier</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeliverySettings;
