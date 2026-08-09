import React from 'react';
import { FiTruck, FiRotateCcw, FiShield, FiHeadphones } from 'react-icons/fi';

const MobileTrustFeatures = () => {
  const features = [
    { icon: <FiTruck />, title: 'FREE SHIPPING', sub: 'On orders above ₹1499' },
    { icon: <FiRotateCcw />, title: 'EASY RETURNS', sub: 'Within 7 days' },
    { icon: <FiShield />, title: 'PREMIUM QUALITY', sub: '100% Original Products' },
    { icon: <FiHeadphones />, title: '24/7 SUPPORT', sub: "We're here to help" }
  ];

  return (
    <div className="mobile-trust-grid mobile-only">
      {features.map((item, idx) => (
        <div key={idx} className="mobile-trust-item">
          <div className="mobile-trust-icon">{item.icon}</div>
          <div className="mobile-trust-title">{item.title}</div>
          <div className="mobile-trust-sub">{item.sub}</div>
        </div>
      ))}
    </div>
  );
};

export default MobileTrustFeatures;
