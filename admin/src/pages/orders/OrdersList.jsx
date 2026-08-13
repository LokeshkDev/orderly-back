import React, { useState, useEffect } from 'react';
import { 
  FiShoppingCart, FiSearch, FiEye, FiClock, FiCheckCircle, 
  FiTruck, FiDollarSign, FiUser, FiCalendar, FiCreditCard, FiX, 
  FiPrinter, FiSave, FiPackage, FiMapPin, FiMail, FiPlus, FiTrash2, FiEdit, FiPhone
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api, { createOrder as createOrderApi, updateOrder as updateOrderApi, deleteOrder as deleteOrderApi } from '../../services/api.js';
import StatusBadge from '../../components/common/StatusBadge';
import './Orders.css';

const emptyOrderForm = {
  customer_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: 'Maharashtra',
  pincode: '',
  item_name: 'European Linen Resort Shirt',
  selectedSize: 'L',
  selectedColor: 'Pristine White',
  quantity: 1,
  price: 5499,
  payment_method: 'cod',
  status: 'Pending'
};

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // View Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Create & Edit Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const getPaymentLabel = (method = '') => {
    const value = String(method || '').toLowerCase();
    if (value === 'cod') return 'COD';
    if (value === 'online') return 'ONLINE';
    if (value === 'upi') return 'UPI';
    if (value === 'card') return 'CARD';
    return value.toUpperCase() || 'COD';
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      let fetchedOrders = [];
      try {
        const res = await api.get('/orders');
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          fetchedOrders = res.data.data;
        }
      } catch (err) {}

      // Combine with localStorage orders
      try {
        const saved = localStorage.getItem('orderly_orders');
        if (saved) {
          const localList = JSON.parse(saved);
          if (Array.isArray(localList)) {
            const mergedMap = new Map();
            [...fetchedOrders, ...localList].forEach(o => {
              const key = o.order_number || o.id;
              if (key) mergedMap.set(String(key), o);
            });
            fetchedOrders = Array.from(mergedMap.values());
          }
        }
      } catch (e) {}

      setOrders(fetchedOrders);
    } catch (err) {
      toast.error('Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(() => {
      loadOrders();
    }, 4000);

    window.addEventListener('orderly_orders_updated', loadOrders);
    window.addEventListener('storage', loadOrders);
    return () => {
      clearInterval(timer);
      window.removeEventListener('orderly_orders_updated', loadOrders);
      window.removeEventListener('storage', loadOrders);
    };
  }, []);

  const syncOrdersToLocalStorage = (updatedList) => {
    try {
      localStorage.setItem('orderly_orders', JSON.stringify(updatedList));
      localStorage.setItem('orderly_orders_updated', String(Date.now()));
      window.dispatchEvent(new CustomEvent('orderly_orders_updated'));
    } catch (e) {}
  };

  // View Order Modal
  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setEditingStatus(order.status || 'pending');
    setTrackingNumber(order.tracking_number || '');
    setIsModalOpen(true);
  };

  // Update Status & Tracking
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingStatus(true);
    const targetKey = selectedOrder.id || selectedOrder.order_number;
    const formattedStatus = editingStatus ? editingStatus.charAt(0).toUpperCase() + editingStatus.slice(1).toLowerCase() : 'Pending';

    try {
      try {
        await api.patch(`/orders/${targetKey}/status`, { status: formattedStatus });
        if (selectedOrder.order_number && selectedOrder.order_number !== targetKey) {
          await api.patch(`/orders/${selectedOrder.order_number}/status`, { status: formattedStatus });
        }
        if (trackingNumber) {
          await api.patch(`/orders/${targetKey}/tracking`, { tracking: trackingNumber });
        }
      } catch (e) {}

      const updatedOrders = orders.map(o => 
        (String(o.id) === String(selectedOrder.id) || o.order_number === selectedOrder.order_number)
          ? { ...o, status: formattedStatus, tracking_number: trackingNumber || o.tracking_number }
          : o
      );

      setOrders(updatedOrders);
      syncOrdersToLocalStorage(updatedOrders);
      toast.success(`Order status updated to "${formattedStatus.toUpperCase()}"!`);
      setSelectedOrder(prev => prev ? { ...prev, status: formattedStatus, tracking_number: trackingNumber } : null);
      loadOrders();
    } catch (err) {
      toast.error('Failed to update order status');
    } finally {
      setSavingStatus(false);
    }
  };

  // CREATE ORDER
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrderObj = {
      id: Date.now(),
      order_number: orderNum,
      customer_name: orderForm.customer_name || 'Valued Customer',
      email: orderForm.email || 'customer@example.com',
      phone: orderForm.phone || '',
      total: Number(orderForm.price || 0) * Number(orderForm.quantity || 1),
      status: orderForm.status || 'Pending',
      payment_method: orderForm.payment_method || 'COD',
      items: [
        {
          name: orderForm.item_name || 'Custom Apparel Item',
          selectedSize: orderForm.selectedSize || 'L',
          selectedColor: orderForm.selectedColor || 'Black',
          quantity: Number(orderForm.quantity || 1),
          price: Number(orderForm.price || 0),
          image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=400&q=80'
        }
      ],
      shippingAddress: {
        firstName: (orderForm.customer_name || '').split(' ')[0] || 'Customer',
        lastName: (orderForm.customer_name || '').split(' ').slice(1).join(' ') || '',
        email: orderForm.email,
        phone: orderForm.phone,
        address: orderForm.address,
        city: orderForm.city,
        state: orderForm.state,
        pincode: orderForm.pincode
      },
      created_at: new Date().toISOString()
    };

    try {
      try {
        await createOrderApi(newOrderObj);
      } catch (e) {}

      const updatedList = [newOrderObj, ...orders];
      setOrders(updatedList);
      syncOrdersToLocalStorage(updatedList);
      setShowCreateModal(false);
      setOrderForm(emptyOrderForm);
      toast.success(`New order #${orderNum} created successfully!`);
    } catch (e) {
      toast.error('Failed to create order');
    }
  };

  // OPEN EDIT ORDER MODAL
  const openEditOrderModal = (order) => {
    setEditingOrderId(order.id || order.order_number);
    const item = order.items?.[0] || {};
    const addr = order.shippingAddress || {};
    setOrderForm({
      customer_name: order.customer_name || order.customer || `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Customer',
      email: order.email || addr.email || '',
      phone: order.phone || addr.phone || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || 'Maharashtra',
      pincode: addr.pincode || '',
      item_name: item.name || 'Custom Apparel',
      selectedSize: item.selectedSize || 'L',
      selectedColor: item.selectedColor || 'Pristine White',
      quantity: item.quantity || 1,
      price: item.price || order.total || 0,
      payment_method: order.payment_method || 'cod',
      status: order.status || 'Pending'
    });
    setShowEditModal(true);
  };

  // UPDATE ORDER SUBMIT
  const handleUpdateOrderSubmit = async (e) => {
    e.preventDefault();
    const updatedTotal = Number(orderForm.price || 0) * Number(orderForm.quantity || 1);
    
    const updatedList = orders.map(o => {
      if (String(o.id) === String(editingOrderId) || o.order_number === editingOrderId) {
        return {
          ...o,
          customer_name: orderForm.customer_name,
          email: orderForm.email,
          phone: orderForm.phone,
          status: orderForm.status,
          payment_method: orderForm.payment_method,
          total: updatedTotal,
          items: [
            {
              name: orderForm.item_name,
              selectedSize: orderForm.selectedSize,
              selectedColor: orderForm.selectedColor,
              quantity: Number(orderForm.quantity || 1),
              price: Number(orderForm.price || 0),
              image: o.items?.[0]?.image || 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=400&q=80'
            }
          ],
          shippingAddress: {
            ...o.shippingAddress,
            firstName: (orderForm.customer_name || '').split(' ')[0] || '',
            lastName: (orderForm.customer_name || '').split(' ').slice(1).join(' ') || '',
            email: orderForm.email,
            phone: orderForm.phone,
            address: orderForm.address,
            city: orderForm.city,
            state: orderForm.state,
            pincode: orderForm.pincode
          }
        };
      }
      return o;
    });

    try {
      try {
        await updateOrderApi(editingOrderId, {
          status: orderForm.status,
          total: updatedTotal
        });
      } catch (e) {}

      setOrders(updatedList);
      syncOrdersToLocalStorage(updatedList);
      setShowEditModal(false);
      toast.success('Order details updated successfully!');
    } catch (e) {
      toast.error('Failed to update order');
    }
  };

  // DELETE ORDER
  const handleDeleteOrder = async (order) => {
    const orderNum = order.order_number || order.id;
    if (!window.confirm(`Are you sure you want to permanently delete order #${orderNum}?`)) {
      return;
    }

    try {
      try {
        await deleteOrderApi(order.id);
      } catch (e) {}

      const updatedList = orders.filter(o => String(o.id) !== String(order.id) && o.order_number !== orderNum);
      setOrders(updatedList);
      syncOrdersToLocalStorage(updatedList);
      toast.success(`Order #${orderNum} deleted!`);
    } catch (e) {
      toast.error('Failed to delete order');
    }
  };

  // Filter orders by search & dropdowns
  const filteredOrders = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      o.order_number?.toLowerCase().includes(q) ||
      o.customer?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.Customer?.name?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.id?.toString().includes(q);

    const matchesStatus = statusFilter === 'All' || o.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPayment = paymentFilter === 'All' || o.payment_method?.toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Summary Stats
  const totalOrders = orders.length;
  const pendingCount = orders.filter(o => o.status?.toLowerCase() === 'pending').length;
  const completedCount = orders.filter(o => ['shipped', 'delivered', 'confirmed'].includes(o.status?.toLowerCase())).length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <div className="orders-page p-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="orders-header-title">
            <FiShoppingCart className="text-danger" /> Customer Orders Management
          </h1>
          <p className="orders-header-sub">Create, edit, delete, track, and manage customer purchases and order fulfillment.</p>
        </div>

        <button 
          type="button" 
          className="btn-admin-red px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2"
          onClick={() => { setOrderForm(emptyOrderForm); setShowCreateModal(true); }}
        >
          <FiPlus className="fs-5" /> + Create New Order
        </button>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="order-stat-card">
            <div>
              <div className="order-stat-label">TOTAL ORDERS</div>
              <div className="order-stat-val">{totalOrders}</div>
            </div>
            <div className="order-stat-icon blue">
              <FiShoppingCart />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="order-stat-card">
            <div>
              <div className="order-stat-label">PENDING ACTION</div>
              <div className="order-stat-val">{pendingCount}</div>
            </div>
            <div className="order-stat-icon amber">
              <FiClock />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="order-stat-card">
            <div>
              <div className="order-stat-label">FULFILLED DEALS</div>
              <div className="order-stat-val">{completedCount}</div>
            </div>
            <div className="order-stat-icon emerald">
              <FiCheckCircle />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="order-stat-card">
            <div>
              <div className="order-stat-label">TOTAL REVENUE</div>
              <div className="order-stat-val">₹{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="order-stat-icon rose">
              <FiDollarSign />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Filter Controls */}
      <div className="order-toolbar-card mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6 col-lg-6">
            <div className="order-search-wrapper">
              <FiSearch className="order-search-icon" />
              <input 
                type="text" 
                className="order-search-input"
                placeholder="Search by Order #, Customer Name, Email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-3">
            <select 
              className="order-select-filter w-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

              <div className="col-6 col-md-3 col-lg-3">
                <select 
                  className="order-select-filter w-100"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="All">All Payment Methods</option>
                  <option value="cod">Cash on Delivery (COD)</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="order-table-card">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th className="ps-4 py-3">ORDER ID</th>
                <th>CUSTOMER DETAILS</th>
                <th>DATE & TIME</th>
                <th>PAYMENT</th>
                <th>TOTAL AMOUNT</th>
                <th>FULFILLMENT STATUS</th>
                <th className="text-end pe-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <span className="spinner-border spinner-border-sm text-danger me-2" role="status" /> Loading order registry...
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map(order => {
                  const customerName = order.customer_name || order.Customer?.name || order.customer || 'Customer';
                  const customerEmail = order.email || order.shippingAddress?.email || order.Customer?.email || 'customer@orderly.com';
                  const dateStr = order.created_at || order.createdAt ? new Date(order.created_at || order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

                  return (
                    <tr key={order.id || order.order_number}>
                      <td className="ps-4 py-3">
                        <span className="order-num-badge">#{order.order_number || order.id}</span>
                      </td>
                      <td>
                        <strong className="d-block text-dark">{customerName}</strong>
                        <span className="text-muted extra-small" style={{ fontSize: '0.78rem' }}>{customerEmail}</span>
                      </td>
                      <td>
                        <span className="text-dark small d-flex align-items-center gap-1">
                          <FiCalendar className="text-muted" /> {dateStr}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-method-pill ${order.payment_method?.toLowerCase() === 'cod' ? 'cod' : 'card'}`}>
                          {getPaymentLabel(order.payment_method)}
                        </span>
                      </td>
                      <td>
                        <strong className="text-dark fs-6">₹{Number(order.total || 0).toLocaleString()}</strong>
                      </td>
                      <td>
                        <StatusBadge status={order.status || 'Active'} />
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-inline-flex gap-2">
                          <button 
                            type="button" 
                            className="btn-admin-outline py-1 px-2.5"
                            onClick={() => openOrderModal(order)}
                            title="View Order Details"
                          >
                            <FiEye /> View
                          </button>
                          <button 
                            type="button" 
                            className="btn-admin-outline py-1 px-2.5"
                            onClick={() => openEditOrderModal(order)}
                            title="Edit Order Details"
                          >
                            <FiEdit /> Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn-admin-outline py-1 px-2 text-danger"
                            onClick={() => handleDeleteOrder(order)}
                            title="Delete Order"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="py-4">
                      <FiShoppingCart style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '12px' }} />
                      <p className="fw-bold text-dark mb-1">No orders found matching your search</p>
                      <p className="small text-muted mb-0">Try adjusting your filters or click "+ Create New Order".</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW ORDER DETAILS MODAL (SOLID HIGH-CONTRAST CARD) */}
      {isModalOpen && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header-line">
              <div>
                <h4 className="fw-bold text-dark mb-1">Order Details #{selectedOrder.order_number || selectedOrder.id}</h4>
                <span className="text-muted small">Placed on {new Date(selectedOrder.created_at || selectedOrder.createdAt || Date.now()).toLocaleString()}</span>
              </div>
              
              <button type="button" className="btn-close-modal-icon" onClick={() => setIsModalOpen(false)} title="Close Modal">
                <FiX />
              </button>
            </div>

            <div className="row g-4">
              {/* Left Column: Customer & Items */}
              <div className="col-md-7">
                <div className="admin-info-box mb-4">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <FiUser className="text-danger" /> Customer & Shipping Delivery Info
                  </h6>
                  <strong className="text-dark fs-6 d-block mb-1">{selectedOrder.customer_name || selectedOrder.Customer?.name || 'Customer'}</strong>
                  <p className="text-muted small mb-2">{selectedOrder.shippingAddress?.address || selectedOrder.address || 'Standard Shipping Address on File'}</p>
                  
                  <div className="d-flex flex-column gap-1 extra-small text-muted mt-2 pt-2 border-top">
                    <span><FiMail className="me-1 text-danger" /> Email: <strong className="text-dark">{selectedOrder.email || selectedOrder.shippingAddress?.email || 'customer@orderly.com'}</strong></span>
                    <span><FiPhone className="me-1 text-danger" /> Phone: <strong className="text-dark">{selectedOrder.phone || selectedOrder.shippingAddress?.phone || '+91 98765 43210'}</strong></span>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <FiPackage className="text-danger" /> Ordered Apparel Items
                </h6>
                <div className="table-responsive rounded-3 border mb-3 overflow-hidden">
                  <table className="admin-modal-table">
                    <thead>
                      <tr>
                        <th>ITEM</th>
                        <th className="text-center">QTY</th>
                        <th className="text-end">UNIT PRICE</th>
                        <th className="text-end">LINE TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || [{ name: 'European Linen Resort Shirt', quantity: 1, selectedSize: 'L', price: selectedOrder.total }]).map((item, i) => (
                        <tr key={i}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="order-item-thumb" />
                              )}
                              <div>
                                <strong className="text-dark small d-block mb-0.5">{item.name}</strong>
                                <span className="text-muted extra-small">Size: {item.selectedSize || 'L'} {item.selectedColor ? `| ${item.selectedColor}` : ''}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center fw-bold small text-dark">{item.quantity || 1}</td>
                          <td className="text-end small text-muted">₹{Number(item.price || selectedOrder.total || 0).toLocaleString()}</td>
                          <td className="text-end fw-bold text-danger small">₹{Number((item.price || selectedOrder.total || 0) * (item.quantity || 1)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Update Fulfillment Form */}
              <div className="col-md-5">
                <form onSubmit={handleUpdateStatus} className="admin-info-box h-100 d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <FiTruck className="text-danger" /> Update Fulfillment Status
                    </h6>
                    
                    <div className="admin-modal-field-group">
                      <label className="admin-modal-label">ORDER STATUS</label>
                      <select 
                        className="admin-modal-select"
                        value={editingStatus}
                        onChange={(e) => setEditingStatus(e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="admin-modal-field-group">
                      <label className="admin-modal-label">COURIER TRACKING AWB NUMBER</label>
                      <input 
                        type="text"
                        className="admin-modal-input"
                        placeholder="e.g. DELHIVERY-894123"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-admin-red w-100 py-2.5 fw-bold" disabled={savingStatus}>
                    <FiSave className="me-1" /> {savingStatus ? 'Saving Status...' : 'Save & Notify Customer'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW ORDER */}
      {showCreateModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="admin-order-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="admin-modal-header-line">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <FiPlus className="text-danger" /> Create New Customer Order
              </h5>
              <button type="button" className="btn-close-modal-icon" onClick={() => setShowCreateModal(false)} title="Close Modal">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-muted">CUSTOMER FULL NAME *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    placeholder="e.g. Vikram Sharma"
                    value={orderForm.customer_name}
                    onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-muted">EMAIL ADDRESS *</label>
                  <input 
                    type="email" 
                    required 
                    className="form-control"
                    placeholder="vikram@example.com"
                    value={orderForm.email}
                    onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-muted">PHONE NUMBER</label>
                  <input 
                    type="tel" 
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                  />
                </div>

                  <div className="col-md-6">
                    <label className="form-label extra-small fw-bold text-muted">PAYMENT METHOD</label>
                    <select 
                      className="form-select"
                      value={orderForm.payment_method}
                      onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })}
                    >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="online">Online Payment</option>
                    </select>
                  </div>

                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-muted">APPAREL ITEM NAME *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    placeholder="e.g. European Linen Resort Shirt"
                    value={orderForm.item_name}
                    onChange={(e) => setOrderForm({ ...orderForm, item_name: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label extra-small fw-bold text-muted">SIZE</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={orderForm.selectedSize}
                    onChange={(e) => setOrderForm({ ...orderForm, selectedSize: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label extra-small fw-bold text-muted">UNIT PRICE (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="form-control"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label extra-small fw-bold text-muted">QUANTITY</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    className="form-control"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-admin-red px-4 fw-bold">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ORDER DETAILS */}
      {showEditModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="admin-order-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="admin-modal-header-line">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <FiEdit className="text-danger" /> Edit Order Details #{editingOrderId}
              </h5>
              <button type="button" className="btn-close-modal-icon" onClick={() => setShowEditModal(false)} title="Close Modal">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleUpdateOrderSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-muted">CUSTOMER FULL NAME</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    value={orderForm.customer_name}
                    onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-muted">EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    required 
                    className="form-control"
                    value={orderForm.email}
                    onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-muted">FULFILLMENT STATUS</label>
                  <select 
                    className="form-select"
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                  <div className="col-md-6">
                    <label className="form-label extra-small fw-bold text-muted">PAYMENT METHOD</label>
                    <select 
                      className="form-select"
                      value={orderForm.payment_method}
                      onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })}
                    >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="online">Online Payment</option>
                    </select>
                  </div>

                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-muted">ITEM NAME</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    value={orderForm.item_name}
                    onChange={(e) => setOrderForm({ ...orderForm, item_name: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-muted">UNIT PRICE (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="form-control"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-muted">QUANTITY</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    className="form-control"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-admin-red px-4 fw-bold">Update Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
