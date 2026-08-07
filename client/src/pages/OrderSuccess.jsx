import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { formatPrice } from '../utils/formatters';
import { FiCheckCircle, FiHome, FiArrowRight, FiShoppingBag, FiTruck, FiMail, FiCreditCard, FiExternalLink } from 'react-icons/fi';
import { getSettings, getOrderByNumber } from '../services/api';
import './OrderSuccess.css';

const getStatusBadgeClass = (status = '') => {
  const s = status.toLowerCase();
  if (s === 'delivered') return 'bg-success';
  if (s === 'shipped') return 'bg-primary';
  if (s === 'cancelled') return 'bg-secondary';
  return 'bg-success';
};

const OrderSuccess = () => {
  const location = useLocation();
  const state = location.state || {};
  const [deliveryEstimate, setDeliveryEstimate] = useState('');
  const [liveOrder, setLiveOrder] = useState(null);
  const [liveLoaded, setLiveLoaded] = useState(false);

  const orderId = state.orderId ? String(state.orderId).trim() : '';
  const total = state.total || 0;
  const customerName = state.customerName || 'Valued Customer';
  const email = state.email || '';
  const paymentMethod = state.paymentMethod || 'COD';

  useEffect(() => {
    let active = true;
    const load = async () => {
      const res = await getSettings();
      if (active && res?.success) setDeliveryEstimate(res.data?.delivery_estimate_text || '3-5 Business Days Express Delivery');
    };
    load();
    window.addEventListener('orderly_settings_updated', load);
    return () => { active = false; window.removeEventListener('orderly_settings_updated', load); };
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const loadOrder = async () => {
      const res = await getOrderByNumber(orderId);
      if (active) {
        if (res?.success && res.data) setLiveOrder(res.data);
        setLiveLoaded(true);
      }
    };
    loadOrder();
    const timer = setInterval(loadOrder, 5000);
    window.addEventListener('focus', loadOrder);
    window.addEventListener('orderly_orders_updated', loadOrder);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', loadOrder);
      window.removeEventListener('orderly_orders_updated', loadOrder);
    };
  }, [orderId]);

  const currentStatus = liveOrder?.status || (liveLoaded ? '' : 'pending');
  const trackingNumber = liveOrder?.tracking_number || '';
  const courierName = liveOrder?.courier_name || '';
  const isShippedOrAfter = ['shipped', 'delivered'].includes(String(currentStatus).toLowerCase());

  return (
    <>
      <SEO title="Order Confirmed | ORDERLY Menswear" />
      <div className="orderly-success-page py-5">
        <div className="container" style={{ maxWidth: '780px' }}>
          <div className="success-glass-card mx-auto rounded-4 p-4 text-center fade-in-up">
            
            {/* Animated Ring Checkmark */}
            <div className="success-icon-animated-ring mx-auto mb-4">
              <FiCheckCircle className="success-check-icon" />
            </div>

            <span className="order-confirmed-pill mb-3 d-inline-block">ORDER CONFIRMED & IN FULFILLMENT</span>
            
            <h1 className="success-greeting-heading text-white fw-bold mb-2">
              Thank You, {customerName}!
            </h1>
            <p className="text-muted max-w-500 mx-auto mb-4">
              Your order <strong className="text-warning">#{orderId}</strong> has been successfully placed. Our atelier team is preparing your bespoke items.
            </p>

            {/* Order Invoice Summary Panel with Generous Padding */}
            <div className="order-receipt-panel p-4 rounded-4 text-start mb-4">
              <div className="receipt-header pb-3 mb-3 border-bottom border-secondary d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted extra-small fw-bold d-block">ORDER REFERENCE</span>
                  <strong className="text-warning fs-5 font-monospace">#{orderId}</strong>
                </div>
                <span className={`badge ${getStatusBadgeClass(currentStatus)} text-white px-3 py-2 fw-bold rounded-pill text-uppercase`}>
                  {currentStatus || (liveLoaded ? 'PENDING' : 'CONFIRMED')}
                </span>
              </div>

              {isShippedOrAfter && (
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 p-3 rounded-3 mb-4 bg-dark border border-secondary">
                  <div>
                    <span className="text-muted extra-small d-block fw-bold mb-1">TRACKING INFORMATION</span>
                    <span className="text-white small fw-bold d-inline-flex align-items-center gap-2">
                      <FiTruck /> {courierName || 'SHIPPING CARRIER'} — {trackingNumber || 'Tracking number will appear shortly'}
                    </span>
                  </div>
                  {trackingNumber && (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-warning text-white fw-bold px-3 py-1.5"
                    >
                      Track Package <FiExternalLink className="ms-1" />
                    </a>
                  )}
                </div>
              )}

              <div className="row g-4">
                <div className="col-12 col-sm-6 col-md-3">
                  <span className="text-muted extra-small d-block fw-bold mb-1">TOTAL PAID</span>
                  <strong className="text-danger fs-5">{formatPrice(total)}</strong>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <span className="text-muted extra-small d-block fw-bold mb-1">PAYMENT METHOD</span>
                  <span className="badge bg-dark text-warning border border-warning px-2.5 py-1.5 text-uppercase fw-bold">
                    <FiCreditCard className="me-1" /> {paymentMethod}
                  </span>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <span className="text-muted extra-small d-block fw-bold mb-1">ESTIMATED DELIVERY</span>
                  <span className="text-success small fw-bold d-inline-flex align-items-center gap-1">
                    <FiTruck /> {deliveryEstimate}
                  </span>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <span className="text-muted extra-small d-block fw-bold mb-1">CONFIRMATION TO</span>
                  <span className="text-white small fw-bold text-break d-block"><FiMail className="me-1 text-muted" /> {email || 'On File'}</span>
                </div>
              </div>
            </div>

            {/* Dual Action Buttons with 20px Explicit Gap */}
            <div className="order-success-actions-row">
              <Link to="/" className="btn-outline-orderly py-3 px-4 fw-bold d-inline-flex align-items-center justify-content-center gap-2">
                <FiHome /> Return To Home
              </Link>
              <Link to="/shop" className="btn-primary-orderly py-3 px-4 fw-bold d-inline-flex align-items-center justify-content-center gap-2">
                <FiShoppingBag /> Explore More Collections <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;