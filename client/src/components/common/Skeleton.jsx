import React from 'react';
import './SkeletonLoader.css';

export const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '8px', className = '' }) => (
  <div 
    className={`orderly-skeleton-shimmer ${className}`}
    style={{ width, height, borderRadius }}
  />
);

export const ProductCardSkeleton = () => (
  <div className="orderly-product-skeleton-card p-3 rounded-3 border border-secondary mb-4">
    <SkeletonBox height="280px" borderRadius="12px" className="mb-3" />
    <SkeletonBox width="40%" height="14px" className="mb-2" />
    <SkeletonBox width="85%" height="20px" className="mb-3" />
    <div className="d-flex justify-content-between align-items-center">
      <SkeletonBox width="30%" height="22px" />
      <SkeletonBox width="35%" height="36px" borderRadius="6px" />
    </div>
  </div>
);

export const PageSectionSkeleton = () => (
  <div className="container py-5 text-center">
    <div className="mx-auto max-w-500 mb-5">
      <SkeletonBox width="30%" height="16px" className="mx-auto mb-2" />
      <SkeletonBox width="70%" height="32px" className="mx-auto mb-3" />
      <SkeletonBox width="90%" height="16px" className="mx-auto" />
    </div>

    <div className="row g-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="col-12 col-sm-6 col-lg-3">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonBox;
