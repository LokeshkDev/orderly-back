import React from 'react';
import { 
  FiStar, 
  FiCheckCircle, 
  FiClock, 
  FiCheck, 
  FiTruck, 
  FiRefreshCw, 
  FiXCircle, 
  FiSlash, 
  FiRotateCcw,
  FiAlertTriangle
} from 'react-icons/fi';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  
  const normalized = String(status).toLowerCase().trim();
  
  // 1. VIP Platinum / Premium
  if (['vip', 'vip member', 'vip platinum', 'platinum'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill shadow-sm d-inline-flex align-items-center gap-1.5" 
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiStar style={{ fontSize: '0.85rem' }} /> VIP PLATINUM
      </span>
    );
  }

  // 2. Pending Order Status - Warm Amber / Orange-Yellow
  if (['pending', 'awaiting', 'payment_pending'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiClock style={{ fontSize: '0.85rem', color: '#d97706' }} /> PENDING
      </span>
    );
  }

  // 3. Confirmed Order Status - Vibrant Indigo / Royal Blue
  if (['confirmed', 'accepted', 'order_confirmed'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiCheck style={{ fontSize: '0.9rem', color: '#4f46e5' }} /> CONFIRMED
      </span>
    );
  }

  // 4. Processing Order Status - Soft Purple / Violet
  if (['processing', 'in_progress', 'packing', 'in_production'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiRefreshCw style={{ fontSize: '0.8rem', color: '#7c3aed' }} /> PROCESSING
      </span>
    );
  }

  // 5. Shipped Order Status - Sky Blue / Cyan
  if (['shipped', 'dispatched', 'in_transit', 'out_for_delivery'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiTruck style={{ fontSize: '0.85rem', color: '#0284c7' }} /> SHIPPED
      </span>
    );
  }

  // 6. Delivered Order Status - Fresh Emerald Green
  if (['delivered', 'completed', 'received'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiCheckCircle style={{ fontSize: '0.85rem', color: '#16a34a' }} /> DELIVERED
      </span>
    );
  }

  // 7. Cancelled Order Status - Rose / Crimson Red
  if (['cancelled', 'canceled', 'rejected', 'failed'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiXCircle style={{ fontSize: '0.85rem', color: '#e11d48' }} /> CANCELLED
      </span>
    );
  }

  // 8. Returned Order Status - Warm Tangerine / Peach Orange
  if (['returned', 'return_requested', 'return_received', 'refunded'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiRotateCcw style={{ fontSize: '0.85rem', color: '#ea580c' }} /> RETURNED
      </span>
    );
  }

  // 9. Active (Customer / Coupon / Entity status)
  if (['active', 'active member', 'success'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiCheckCircle style={{ fontSize: '0.85rem', color: '#16a34a' }} /> ACTIVE
      </span>
    );
  }

  // 10. Inactive (Customer / Coupon / Entity status)
  if (['inactive'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiSlash style={{ fontSize: '0.85rem', color: '#64748b' }} /> INACTIVE
      </span>
    );
  }

  // 11. Low Stock / Stock Alert
  if (['low_stock', 'low stock'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiAlertTriangle style={{ fontSize: '0.85rem', color: '#f59e0b' }} /> LOW STOCK
      </span>
    );
  }

  // 12. Out of Stock
  if (['out_of_stock', 'out of stock'].includes(normalized)) {
    return (
      <span 
        className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
        style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiSlash style={{ fontSize: '0.85rem', color: '#ef4444' }} /> OUT OF STOCK
      </span>
    );
  }

  // Default Fallback
  return (
    <span 
      className="badge fw-bold px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
      style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', fontSize: '0.75rem', letterSpacing: '0.04em' }}
    >
      {String(status).replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

export default StatusBadge;
