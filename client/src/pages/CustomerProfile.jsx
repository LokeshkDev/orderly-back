import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { 
  FiUser, FiShoppingBag, FiMapPin, FiHeart, FiSettings, FiLogOut, 
  FiCheckCircle, FiClock, FiChevronRight, FiHome, FiBriefcase, FiPlus, FiTrash2, FiEdit2, 
  FiLock, FiStar, FiX, FiTruck, FiPackage, FiExternalLink, FiMail, FiPhone, FiCreditCard
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getSettings, getOrders } from '../services/api';
import './CustomerProfile.css';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'addresses', 'settings'
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: ''
  });

  // New Address Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddr, setNewAddr] = useState({
    addressType: 'Home',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: 'Karnataka',
    pincode: ''
  });

  const loadCustomerOrders = async () => {
    const userStr = localStorage.getItem('orderly_logged_in_user');
    let currentEmail = '';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        currentEmail = (u.email || '').toLowerCase().trim();
      } catch (e) {}
    }

    let allOrders = [];

    // 1. Fetch from Server API
    try {
      const res = await getOrders();
      if (res?.success && Array.isArray(res.data)) {
        allOrders = res.data;
      }
    } catch (e) {}

    // 2. Fetch from LocalStorage
    try {
      const saved = localStorage.getItem('orderly_orders');
      if (saved) {
        const localList = JSON.parse(saved);
        if (Array.isArray(localList)) {
          const mergedMap = new Map();
          // Server's latest status (allOrders) comes second so it overwrites local cache!
          [...localList, ...allOrders].forEach(o => {
            const key = o.order_number || o.id;
            if (key) mergedMap.set(String(key), o);
          });
          allOrders = Array.from(mergedMap.values());
        }
      }
    } catch (e) {}

    // 3. Filter orders specifically for the logged-in customer's email
    if (currentEmail) {
      const customerOrders = allOrders.filter(o => {
        const orderEmail = (o.email || o.shippingAddress?.email || o.shipping_address?.email || o.Customer?.email || '').toLowerCase().trim();
        return !orderEmail || orderEmail === currentEmail;
      });
      setOrders(customerOrders.length > 0 ? customerOrders : allOrders);
    } else {
      setOrders(allOrders);
    }
  };

  useEffect(() => {
    // Check authentication
    const userStr = localStorage.getItem('orderly_logged_in_user');
    const token = localStorage.getItem('orderly_customer_token');
    
    if (!token && !userStr) {
      toast.info('Please sign in to access your profile.');
      navigate('/login');
      return;
    }

    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setProfileForm(prev => ({
          ...prev,
          name: parsed.name || 'Valued Customer',
          email: parsed.email || 'customer@orderly.com',
          phone: parsed.phone || '+91 98765 43210'
        }));
      } catch (e) {}
    } else {
      setUser({ name: 'Valued Customer', email: 'customer@orderly.com', phone: '+91 98765 43210' });
    }

    loadCustomerOrders();
    const syncTimer = setInterval(loadCustomerOrders, 3000);

    // Listen to real-time order status and tracking updates from Admin
    window.addEventListener('orderly_orders_updated', loadCustomerOrders);
    window.addEventListener('storage', loadCustomerOrders);

    return () => {
      clearInterval(syncTimer);
      window.removeEventListener('orderly_orders_updated', loadCustomerOrders);
      window.removeEventListener('storage', loadCustomerOrders);
    };

    // Load customer's saved addresses
    try {
      const addrs = localStorage.getItem('orderly_saved_addresses');
      if (addrs) {
        setSavedAddresses(JSON.parse(addrs));
      } else {
        setSavedAddresses([
          {
            id: 1,
            addressType: 'Home',
            firstName: 'Lokesh',
            lastName: 'Sharma',
            phone: '+91 7010558149',
            address: 'Plot 14, Luxury Fashion Boulevard, Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050'
          },
          {
            id: 2,
            addressType: 'Office',
            firstName: 'Lokesh',
            lastName: 'Sharma',
            phone: '+91 7010558149',
            address: 'Suite 204, Regent Fashion Galleria, MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001'
          }
        ]);
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('orderly_orders_updated', loadCustomerOrders);
      window.removeEventListener('storage', loadCustomerOrders);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('orderly_customer_token');
    localStorage.removeItem('orderly_logged_in_user');
    window.dispatchEvent(new CustomEvent('orderly_auth_changed'));
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, name: profileForm.name, email: profileForm.email, phone: profileForm.phone };
    setUser(updatedUser);
    localStorage.setItem('orderly_logged_in_user', JSON.stringify(updatedUser));
    toast.success('Profile settings updated!');
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddr.address || !newAddr.pincode) {
      toast.error('Address and Pincode are required');
      return;
    }
    const created = { id: Date.now(), ...newAddr };
    const updated = [created, ...savedAddresses];
    setSavedAddresses(updated);
    localStorage.setItem('orderly_saved_addresses', JSON.stringify(updated));
    setShowAddressModal(false);
    toast.success(`Saved new ${newAddr.addressType} address!`);
  };

  const handleDeleteAddress = (id) => {
    const updated = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(updated);
    localStorage.setItem('orderly_saved_addresses', JSON.stringify(updated));
    toast.success('Address removed');
  };

  // Helper for shipment timeline step index
  const getStatusStepIndex = (statusStr = '') => {
    const s = statusStr.toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'shipped') return 3;
    if (s === 'processing' || s === 'in processing' || s === 'confirmed') return 2;
    return 1;
  };

  // Normalize items from DB (OrderItems) or runtime/local order objects
  const normalizeItems = (order) => {
    const src = order?.OrderItems?.length ? order.OrderItems : (order?.items || []);
    return src.map(item => ({
      name: item.product_name || item.name || 'Custom Apparel',
      price: item.unit_price !== undefined && item.unit_price !== null ? item.unit_price : item.price,
      quantity: item.quantity || 1,
      selectedSize: item.size || item.selectedSize || 'M',
      selectedColor: item.color || item.selectedColor,
      image: item.image,
      isCombo: item.isCombo
    }));
  };

  const orderPreviewItems = (order) => {
    const items = normalizeItems(order);
    return items.length ? items : [{ name: 'Luxury Menswear Apparel', quantity: 1, selectedSize: 'L' }];
  };

  return (
    <>
      <SEO title="My Account Profile | ORDERLY Menswear" />
      <div className="profile-page-wrapper py-4 py-md-5">
        <div className="container" style={{ maxWidth: '960px' }}>
          
          {/* Mobile App Style Header Profile Card */}
          <div className="app-profile-header-card glass-panel p-4 rounded-4 mb-4 position-relative">
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-center text-md-start">
              <div className="d-flex flex-column flex-md-row align-items-center gap-3">
                <div className="profile-avatar-circle">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'L'}
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 justify-content-center justify-content-md-start">
                    <h2 className="text-white fw-bold mb-0">{user?.name || 'Lokesh Kumar'}</h2>
                    <span className="customer-tier-badge vip-gold">
                      <FiStar className="badge-star-icon" /> VIP PLATINUM
                    </span>
                  </div>
                  <p className="text-muted small mb-0">{user?.email || 'lokeshk247@gmail.com'} • {user?.phone || '7010558149'}</p>
                </div>
              </div>

              <button type="button" className="profile-signout-btn" onClick={handleLogout}>
                <FiLogOut className="signout-icon" /> Sign Out
              </button>
            </div>
          </div>

          {/* Mobile App Segmented Navigation Bar */}
          <div className="app-segmented-nav-bar mb-4">
            <button 
              className={`app-nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FiShoppingBag /> Orders ({orders.length})
            </button>
            <button 
              className={`app-nav-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <FiMapPin /> Saved Addresses ({savedAddresses.length})
            </button>
            <button 
              className={`app-nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <FiSettings /> Settings & Security
            </button>
          </div>

          {/* TAB 1: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="fade-in-up">
              <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                <FiShoppingBag className="text-danger" /> Order Purchase History
              </h5>

              {orders.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {orders.map((order, idx) => {
                    const statusStr = order.status || 'In Processing';
                    const isDelivered = statusStr.toLowerCase() === 'delivered';
                    const isShipped = statusStr.toLowerCase() === 'shipped';

                    return (
                      <div 
                        key={order.id || idx} 
                        className="app-order-card p-4 mb-3 rounded-4 glass-panel cursor-pointer position-relative"
                        onClick={() => setSelectedOrderModal(order)}
                      >
                        <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary mb-3">
                          <div>
                            <strong className="text-white fs-6">Order #{order.order_number || order.id}</strong>
                            <span className="text-muted extra-small d-block mt-0.5">
                              Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                            </span>
                          </div>
                          <span className={`badge ${isDelivered ? 'bg-success' : isShipped ? 'bg-primary' : 'bg-warning text-dark'} px-3 py-2 fw-bold text-uppercase`}>
                            {statusStr}
                          </span>
                        </div>

                        {/* Items Summary */}
                        <div className="order-items-preview mb-3">
                          {orderPreviewItems(order).map((item, i) => (
                            <div key={i} className="d-flex align-items-center justify-content-between py-1 text-muted small">
                              <span className="text-white">• {item.name || 'Custom Apparel'} (Size: {item.selectedSize || 'M'}, Qty: {item.quantity || 1})</span>
                              <span className="text-white fw-bold">₹{Number(item.price || order.total || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="d-flex align-items-center justify-content-between pt-3 border-top border-secondary">
                          <div>
                            <span className="text-muted extra-small d-block fw-bold">TOTAL AMOUNT</span>
                            <strong className="text-danger fs-5">₹{Number(order.total || 0).toLocaleString()}</strong>
                          </div>

                          <button 
                            type="button" 
                            className="btn-order-action-red"
                            onClick={(e) => { e.stopPropagation(); setSelectedOrderModal(order); }}
                          >
                            <FiPackage /> View Details & Track <FiChevronRight />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 glass-panel rounded-4">
                  <FiShoppingBag className="display-4 text-muted mb-3" />
                  <h5 className="text-white">No Orders Placed Yet</h5>
                  <p className="text-muted small">Explore our luxury Italian tailoring & selvedge denim collections.</p>
                  <Link to="/shop" className="btn-primary-orderly px-4 py-2 mt-2">Explore Shop</Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED ADDRESSES (Home, Office, Other) */}
          {activeTab === 'addresses' && (
            <div className="fade-in-up">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                  <FiMapPin className="text-danger" /> Saved Delivery Addresses
                </h5>
                <button type="button" className="btn-admin-red py-2 px-3" onClick={() => setShowAddressModal(true)}>
                  <FiPlus /> Add New Address
                </button>
              </div>

              <div className="row g-3">
                {savedAddresses.map((addr, idx) => (
                  <div key={addr.id || idx} className="col-12 col-md-6">
                    <div className="app-address-card p-4 rounded-3 glass-panel h-100 position-relative d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className={`badge ${addr.addressType === 'Home' ? 'bg-danger' : addr.addressType === 'Office' ? 'bg-primary' : 'bg-secondary'} px-3 py-1 fw-bold`}>
                            {addr.addressType === 'Home' ? <FiHome className="me-1" /> : <FiBriefcase className="me-1" />}
                            {addr.addressType?.toUpperCase() || 'HOME'}
                          </span>

                          <button 
                            type="button" 
                            className="btn btn-link text-danger p-0 extra-small"
                            onClick={() => handleDeleteAddress(addr.id)}
                            title="Remove Address"
                          >
                            <FiTrash2 /> Remove
                          </button>
                        </div>

                        <h6 className="text-white fw-bold mb-1">{addr.firstName} {addr.lastName}</h6>
                        <p className="text-muted small mb-2">{addr.address}</p>
                        <span className="text-muted extra-small d-block">{addr.city}, {addr.state} - <strong>{addr.pincode}</strong></span>
                        <span className="text-warning extra-small d-block mt-1">Phone: {addr.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT SETTINGS & SECURITY */}
          {activeTab === 'settings' && (
            <div className="fade-in-up">
              <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                <FiSettings className="text-danger" /> Profile Settings & Account Security
              </h5>

              <div className="glass-panel p-4 p-md-5 rounded-4">
                <form onSubmit={handleSaveProfile}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-bold">FULL NAME</label>
                      <input 
                        type="text" 
                        className="form-control bg-dark text-white border-secondary py-2.5"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-bold">EMAIL ADDRESS</label>
                      <input 
                        type="email" 
                        className="form-control bg-dark text-white border-secondary py-2.5"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-bold">CONTACT PHONE</label>
                      <input 
                        type="tel" 
                        className="form-control bg-dark text-white border-secondary py-2.5"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-bold">CHANGE PASSWORD</label>
                      <input 
                        type="password" 
                        placeholder="New password (optional)"
                        className="form-control bg-dark text-white border-secondary py-2.5"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      />
                    </div>

                    <div className="col-12 mt-4 text-end">
                      <button type="submit" className="btn-primary-orderly px-4 py-2.5 fw-bold">
                        <FiCheckCircle /> Save Profile Changes
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FULL ORDER DETAILS & TRACKING MODAL POPUP */}
      {selectedOrderModal && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3">
          <div className="glass-panel p-4 p-md-5 rounded-4 border border-secondary text-white shadow-lg fade-in-up" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Modal Top Bar */}
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary mb-4">
              <div>
                <span className="badge bg-danger text-white me-2">PURCHASE DETAILS</span>
                <strong className="fs-5 text-warning font-monospace">Order #{selectedOrderModal.order_number || selectedOrderModal.id}</strong>
                <span className="text-muted extra-small d-block mt-1">
                  Placed on {selectedOrderModal.created_at ? new Date(selectedOrderModal.created_at).toLocaleString() : 'Recent'}
                </span>
              </div>
              
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm text-white rounded-circle p-2"
                onClick={() => setSelectedOrderModal(null)}
              >
                <FiX className="fs-5" />
              </button>
            </div>

            {/* Shipment Progress Bar (Synced with Admin status) */}
            <div className="order-tracking-timeline-box p-4 rounded-4 bg-dark mb-4 border border-secondary">
              <h6 className="text-white fw-bold mb-3 d-flex align-items-center justify-content-between">
                <span><FiTruck className="text-danger me-2" /> Live Fulfillment & Delivery Status</span>
                <span className="badge bg-success text-white px-3 py-1.5 text-uppercase fw-bold">
                  {selectedOrderModal.status || 'In Processing'}
                </span>
              </h6>

              {/* 4-Step Visual Progress Bar */}
              <div className="timeline-steps-wrapper d-flex align-items-center justify-content-between my-3 position-relative">
                {[
                  { step: 1, label: 'Placed' },
                  { step: 2, label: 'Processing' },
                  { step: 3, label: 'Shipped' },
                  { step: 4, label: 'Delivered' }
                ].map((s) => {
                  const activeStep = getStatusStepIndex(selectedOrderModal.status);
                  const isDone = s.step <= activeStep;
                  return (
                    <div key={s.step} className="text-center position-relative z-index-1">
                      <div className={`step-dot mx-auto d-flex align-items-center justify-content-center ${isDone ? 'active' : ''}`}>
                        {isDone ? <FiCheckCircle /> : s.step}
                      </div>
                      <span className={`step-label d-block mt-2 extra-small ${isDone ? 'text-white fw-bold' : 'text-muted'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Tracking Details Box (Shows tracking info set by Admin) */}
              {selectedOrderModal.tracking_number && (
                <div className="p-3 bg-secondary bg-opacity-20 rounded-3 mt-3 border border-secondary d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
                  <div>
                    <span className="text-muted extra-small d-block fw-bold">COURIER & TRACKING AWB</span>
                    <span className="text-warning fw-bold small">
                      {selectedOrderModal.courier_name || 'Shipping Carrier'} — {selectedOrderModal.tracking_number}
                    </span>
                  </div>
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(selectedOrderModal.tracking_number)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-sm btn-outline-warning text-white fw-bold px-3 py-1.5"
                  >
                    Track Package <FiExternalLink className="ms-1" />
                  </a>
                </div>
              )}
            </div>

            {/* Ordered Items Table */}
            <div className="mb-4">
              <h6 className="text-white fw-bold mb-3"><FiPackage className="text-danger me-2" /> Ordered Apparel Items</h6>
              <div className="table-responsive rounded-3 border border-secondary border-opacity-50 overflow-hidden">
                <table className="order-items-modal-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50%', paddingLeft: '16px' }}>ITEM DETAILS</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>QTY</th>
                      <th style={{ width: '17.5%', textAlign: 'right' }}>UNIT PRICE</th>
                      <th style={{ width: '17.5%', textAlign: 'right', paddingRight: '16px' }}>LINE TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(normalizeItems(selectedOrderModal).length ? normalizeItems(selectedOrderModal) : [{ name: 'European Linen Resort Shirt', quantity: 1, selectedSize: 'L', price: selectedOrderModal.total }]).map((item, i) => (
                      <tr key={i}>
                        <td style={{ paddingLeft: '16px' }}>
                          <div className="d-flex align-items-center gap-3">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="rounded-2" style={{ width: 44, height: 54, objectFit: 'cover' }} />
                            )}
                            <div>
                              <strong className="text-white small d-block mb-1">{item.name}</strong>
                              <span className="text-muted extra-small">Size: {item.selectedSize || 'L'} {item.selectedColor ? `| Color: ${item.selectedColor}` : ''}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }} className="fw-bold small text-white">{item.quantity || 1}</td>
                        <td style={{ textAlign: 'right' }} className="small text-muted">₹{Number(item.price || selectedOrderModal.total || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', paddingRight: '16px' }} className="text-danger fw-bold small">₹{Number((item.price || selectedOrderModal.total || 0) * (item.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipping Address & Financial Summary */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="p-3 bg-dark rounded-3 border border-secondary h-100">
                  <span className="text-muted extra-small fw-bold d-block mb-2">SHIPPING DELIVERY ADDRESS</span>
                  {selectedOrderModal.shippingAddress ? (
                    <div className="small text-muted">
                      <strong className="text-white d-block mb-1">{selectedOrderModal.shippingAddress.firstName} {selectedOrderModal.shippingAddress.lastName}</strong>
                      <p className="mb-1">{selectedOrderModal.shippingAddress.address}</p>
                      <span>{selectedOrderModal.shippingAddress.city}, {selectedOrderModal.shippingAddress.state} - {selectedOrderModal.shippingAddress.pincode}</span>
                      <span className="d-block text-warning mt-1">Phone: {selectedOrderModal.shippingAddress.phone}</span>
                    </div>
                  ) : (
                    <div className="small text-muted">Standard Delivery Address on File</div>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="p-3 bg-dark rounded-3 border border-secondary h-100 d-flex flex-column justify-content-between">
                  <span className="text-muted extra-small fw-bold d-block mb-2">PAYMENT SUMMARY</span>
                  <div className="d-flex justify-content-between py-1 small text-muted">
                    <span>Payment Method:</span>
                    <span className="text-warning fw-bold text-uppercase">{selectedOrderModal.payment_method || 'COD'}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 small text-muted">
                    <span>Express Shipping:</span>
                    <span className="text-success fw-bold">FREE</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top border-secondary">
                    <strong className="text-white">Total Amount Paid:</strong>
                    <strong className="text-danger fs-5">₹{Number(selectedOrderModal.total || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Close Button */}
            <div className="mt-4 text-end">
              <button 
                type="button" 
                className="btn-modal-close-white"
                onClick={() => setSelectedOrderModal(null)}
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Add New Address */}
      {showAddressModal && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center">
          <div className="glass-panel p-4 rounded-4 border border-secondary text-white" style={{ maxWidth: '500px', width: '90%' }}>
            <h5 className="fw-bold mb-3">Add New Delivery Address</h5>
            <form onSubmit={handleAddAddress}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-muted small fw-bold">ADDRESS TYPE</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${newAddr.addressType === 'Home' ? 'btn-danger' : 'btn-outline-secondary text-white'}`}
                      onClick={() => setNewAddr({ ...newAddr, addressType: 'Home' })}
                    >
                      <FiHome /> Home
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${newAddr.addressType === 'Office' ? 'btn-danger' : 'btn-outline-secondary text-white'}`}
                      onClick={() => setNewAddr({ ...newAddr, addressType: 'Office' })}
                    >
                      <FiBriefcase /> Office
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${newAddr.addressType === 'Other' ? 'btn-danger' : 'btn-outline-secondary text-white'}`}
                      onClick={() => setNewAddr({ ...newAddr, addressType: 'Other' })}
                    >
                      <FiMapPin /> Other
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <input
                    type="text"
                    placeholder="First Name *"
                    required
                    value={newAddr.firstName}
                    onChange={(e) => setNewAddr({ ...newAddr, firstName: e.target.value })}
                    className="form-control bg-dark text-white border-secondary"
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    placeholder="Last Name *"
                    required
                    value={newAddr.lastName}
                    onChange={(e) => setNewAddr({ ...newAddr, lastName: e.target.value })}
                    className="form-control bg-dark text-white border-secondary"
                  />
                </div>
                <div className="col-12">
                  <input
                    type="text"
                    placeholder="Street Address, Flat No. *"
                    required
                    value={newAddr.address}
                    onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                    className="form-control bg-dark text-white border-secondary"
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    placeholder="City *"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="form-control bg-dark text-white border-secondary"
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    placeholder="Pincode *"
                    required
                    value={newAddr.pincode}
                    onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                    className="form-control bg-dark text-white border-secondary"
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddressModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-orderly px-4 py-2">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerProfile;
