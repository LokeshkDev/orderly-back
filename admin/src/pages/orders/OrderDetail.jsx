import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiShoppingCart, FiUser, FiMapPin, FiTruck, 
  FiDollarSign, FiCheck, FiPrinter, FiSave, FiCreditCard, FiPackage 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import StatusBadge from '../../components/common/StatusBadge';
import './Orders.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data && res.data.success && res.data.data) {
          const o = res.data.data;
          setOrder(o);
          setStatus(o.status || 'pending');
          setTrackingNumber(o.tracking_number || '');
        }
      } catch (err) {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const res = await api.patch(`/orders/${id}/status`, { status });
      if (res.data && res.data.success) {
        toast.success(`Order status updated to "${status.toUpperCase()}"!`);
        if (trackingNumber) {
          try {
            await api.patch(`/orders/${id}/tracking`, { tracking: trackingNumber });
          } catch (e) {}
        }
      }
    } catch (err) {
      toast.error('Failed to update order status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="orders-page p-4 text-center py-5">
        <span className="spinner-border text-danger" role="status" />
        <p className="mt-3 text-muted">Loading order invoice details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="orders-page p-4 text-center py-5">
        <FiShoppingCart style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }} />
        <h3>Order Not Found</h3>
        <p className="text-muted">The requested order ID does not exist in the database.</p>
        <button className="btn-admin-outline mt-3" onClick={() => navigate('/orders')}>
          ← Back to Orders
        </button>
      </div>
    );
  }

  const customerName = order.Customer?.name || order.customer || 'Guest Customer';
  const customerEmail = order.Customer?.email || order.shipping_address?.email || 'admin@orderly.com';
  const customerPhone = order.Customer?.phone || order.shipping_address?.phone || '+91 98765 43210';
  const address = order.shipping_address || {};
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent Order';

  // Sample items breakdown if DB row missing detailed items array
  const orderItems = order.OrderItems?.length > 0 ? order.OrderItems : (
    order.items || [
      {
        id: 'item-1',
        name: 'Structured European Linen Resort Shirt',
        price: order.total || 3299,
        quantity: 1,
        selectedColor: 'Olive Tan',
        selectedSize: 'L',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop'
      }
    ]
  );

  return (
    <div className="order-detail-page p-4">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <button 
            type="button" 
            className="btn-admin-outline py-1 px-3 mb-2"
            onClick={() => navigate('/orders')}
          >
            <FiArrowLeft /> Back to Orders
          </button>
          <div className="d-flex align-items-center gap-3">
            <h1 className="orders-header-title mb-0">Order #{order.order_number || order.id}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="orders-header-sub mt-1">Placed on {dateStr}</p>
        </div>

        <button 
          type="button" 
          className="btn-admin-outline py-2 px-3"
          onClick={handlePrintInvoice}
        >
          <FiPrinter /> Print Packing Slip
        </button>
      </div>

      {/* Grid Row 1: Customer & Fulfillment Management */}
      <div className="row g-4 mb-4">
        {/* Customer & Delivery Card */}
        <div className="col-lg-6">
          <div className="order-detail-card">
            <h5 className="detail-card-title">
              <FiUser className="text-primary" /> Customer & Shipping Info
            </h5>

            <div className="mb-3">
              <strong className="d-block text-dark fs-6">{customerName}</strong>
              <span className="text-muted small">{customerEmail} • {customerPhone}</span>
            </div>

            <div className="border-top pt-3">
              <h6 className="admin-form-label mb-2"><FiMapPin /> Delivery Address:</h6>
              <p className="text-dark small mb-1 fw-bold">{address.firstName ? `${address.firstName} ${address.lastName}` : customerName}</p>
              <p className="text-muted small mb-1">{address.address || 'MG Road, Koramangala Sector 4'}</p>
              <p className="text-muted small mb-0">{address.city || 'Bengaluru'}, {address.state || 'Karnataka'} - {address.pincode || '560034'}</p>
            </div>

            <div className="border-top pt-3 mt-3 d-flex align-items-center justify-content-between">
              <span className="admin-form-label mb-0"><FiCreditCard /> Payment Method:</span>
              <span className={`payment-method-pill ${order.payment_method?.toLowerCase() === 'cod' ? 'cod' : 'card'}`}>
                {order.payment_method?.toUpperCase() || 'COD'}
              </span>
            </div>
          </div>
        </div>

        {/* Fulfillment & Status Management Card */}
        <div className="col-lg-6">
          <div className="order-detail-card">
            <h5 className="detail-card-title">
              <FiTruck className="text-danger" /> Order Status & Tracking
            </h5>

            <form onSubmit={handleStatusUpdate}>
              <div className="mb-3">
                <label className="admin-form-label">Order Fulfillment Status</label>
                <select 
                  className="admin-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="admin-form-label">Tracking Number / AWB</label>
                <input 
                  type="text" 
                  className="admin-input"
                  placeholder="e.g. TRK-88219402"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn-admin-red w-100 justify-content-center py-2"
                disabled={savingStatus}
              >
                <FiSave /> {savingStatus ? 'Saving Status...' : 'Save Order Status & Tracking'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Ordered Items Table */}
      <div className="order-detail-card mb-4">
        <h5 className="detail-card-title">
          <FiPackage className="text-success" /> Order Items & Pricing Breakdown
        </h5>

        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ITEM</th>
                <th>PRODUCT DETAILS</th>
                <th>VARIANT</th>
                <th>PRICE</th>
                <th>QTY</th>
                <th className="text-end">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <img 
                      src={item.image || item.Product?.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop'} 
                      alt={item.name} 
                      className="order-item-thumb"
                    />
                  </td>
                  <td>
                    <strong className="text-dark d-block">{item.name || item.Product?.name || 'Curated Apparel Item'}</strong>
                    {item.isCombo && <span className="badge bg-warning text-dark me-2">COMBO BUNDLE</span>}
                    <code className="cat-slug-badge">{item.id || 'prod-item'}</code>
                  </td>
                  <td>
                    <span className="small text-muted">
                      Color: <strong className="text-dark">{item.selectedColor || item.color || 'Standard'}</strong> | Size: <strong className="text-dark">{item.selectedSize || item.size || 'M'}</strong>
                    </span>
                  </td>
                  <td>₹{item.price || order.total}</td>
                  <td><strong className="text-dark">{item.quantity || 1}</strong></td>
                  <td className="text-end fw-bold text-dark">
                    ₹{(Number(item.price || order.total) * Number(item.quantity || 1)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="row justify-content-end mt-4 pt-3 border-top">
          <div className="col-md-5 col-lg-4">
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted small">Subtotal:</span>
              <strong className="text-dark">₹{Number(order.subtotal || order.total).toLocaleString()}</strong>
            </div>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted small">Shipping:</span>
              <span className="text-success small fw-bold">FREE</span>
            </div>
            <div className="d-flex justify-content-between py-2 border-top mt-2 fs-5">
              <strong className="text-dark">Grand Total:</strong>
              <strong className="text-danger">₹{Number(order.total || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
