import React from 'react';
import { FiStar, FiCheckCircle, FiSlash } from 'react-icons/fi';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  
  const normalized = String(status).toLowerCase().trim();
  
  if (['vip', 'vip member', 'vip platinum', 'platinum'].includes(normalized)) {
    return (
      <span 
        className="badge text-dark fw-bold px-3 py-1.5 rounded-pill shadow-sm d-inline-flex align-items-center gap-1" 
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#0f172a', fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiStar style={{ fontSize: '0.85rem' }} /> VIP PLATINUM
      </span>
    );
  }

  if (['active', 'active member', 'delivered', 'success', 'completed'].includes(normalized)) {
    return (
      <span 
        className="badge bg-success text-white fw-bold px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1"
        style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiCheckCircle style={{ fontSize: '0.85rem' }} /> ACTIVE
      </span>
    );
  }

  if (['inactive', 'cancelled', 'failed', 'out_of_stock'].includes(normalized)) {
    return (
      <span 
        className="badge bg-secondary text-white fw-bold px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1"
        style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}
      >
        <FiSlash style={{ fontSize: '0.85rem' }} /> INACTIVE
      </span>
    );
  }

  let badgeClass = 'bg-info text-dark';
  if (['pending', 'processing', 'shipped', 'low_stock'].includes(normalized)) {
    badgeClass = 'bg-warning text-dark';
  }

  return (
    <span className={`badge ${badgeClass} text-uppercase fw-bold px-3 py-1.5 rounded-pill`} style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
