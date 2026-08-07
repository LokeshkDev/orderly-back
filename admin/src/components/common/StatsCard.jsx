import React from 'react';

const StatsCard = ({ title, value, icon, color = 'var(--accent-color)', trend }) => {
  return (
    <div className="admin-card">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>{title}</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>
            {value}
          </h3>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
              <span style={{ color: trend > 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 500 }}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-muted">vs last month</span>
            </div>
          )}
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: `${color}20`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem'
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
