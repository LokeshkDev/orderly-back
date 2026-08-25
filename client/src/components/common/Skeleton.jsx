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

export const CategoryCardSkeleton = () => (
  <div className="category-skeleton-card">
    <SkeletonBox width="60%" height="22px" className="mb-2" />
    <SkeletonBox width="80%" height="14px" className="mb-3" />
    <SkeletonBox width="40%" height="14px" />
  </div>
);

export const HomeCategoryGridSkeleton = () => (
  <div className="category-cards-grid">
    {[1, 2, 3, 4, 5].map((i) => (
      <CategoryCardSkeleton key={i} />
    ))}
  </div>
);

export const HomeTrendingSkeleton = () => (
  <div className="trending-products-grid">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="trending-grid-col">
        <ProductCardSkeleton />
      </div>
    ))}
  </div>
);

export const CatchyCombosSkeleton = () => (
  <div className="d-flex gap-3 overflow-hidden">
    {[1, 2, 3].map((i) => (
      <div key={i} className="catchy-combo-skeleton-card flex-shrink-0" style={{ width: '380px' }}>
        <SkeletonBox height="220px" borderRadius="12px 12px 0 0" />
        <div className="p-3">
          <SkeletonBox width="80%" height="20px" className="mb-2" />
          <div className="d-flex gap-2 mb-3">
            <SkeletonBox width="30%" height="24px" borderRadius="20px" />
            <SkeletonBox width="30%" height="24px" borderRadius="20px" />
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <SkeletonBox width="40%" height="26px" />
            <SkeletonBox width="45%" height="38px" borderRadius="6px" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const MobileProductGridSkeleton = () => (
  <div className="mobile-product-grid">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="mobile-product-skeleton-card">
        <SkeletonBox height="190px" borderRadius="8px" className="mb-2" />
        <SkeletonBox width="50%" height="12px" className="mb-1" />
        <SkeletonBox width="90%" height="16px" className="mb-2" />
        <SkeletonBox width="60%" height="18px" />
      </div>
    ))}
  </div>
);

export const MobileCategorySkeleton = () => (
  <div className="d-flex gap-2 overflow-hidden px-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex-shrink-0 text-center" style={{ width: '80px' }}>
        <SkeletonBox width="68px" height="68px" borderRadius="50%" className="mx-auto mb-2" />
        <SkeletonBox width="60px" height="12px" className="mx-auto" />
      </div>
    ))}
  </div>
);

export const ComboCategoryCardSkeleton = () => (
  <div className="combo-category-card">
    <div className="combo-cat-img-wrapper">
      <SkeletonBox height="180px" borderRadius="8px" />
    </div>
    <div className="combo-cat-content">
      <SkeletonBox width="65%" height="18px" className="mb-2" />
      <SkeletonBox width="90%" height="12px" />
    </div>
  </div>
);

export const ComboCardSkeleton = () => (
  <div className="creative-combo-card p-3">
    <div className="d-flex justify-content-between mb-2">
      <SkeletonBox width="50px" height="22px" borderRadius="999px" />
      <SkeletonBox width="34px" height="34px" borderRadius="50%" />
    </div>
    <div className="d-flex gap-2 mb-3">
      <SkeletonBox height="130px" borderRadius="8px" />
      <SkeletonBox height="130px" borderRadius="8px" />
    </div>
    <SkeletonBox width="80%" height="18px" className="mb-2" />
    <SkeletonBox width="40%" height="12px" className="mb-2" />
    <SkeletonBox width="55%" height="24px" className="mb-3" />
    <div className="d-flex gap-2">
      <SkeletonBox width="50%" height="38px" borderRadius="6px" />
      <SkeletonBox width="50%" height="38px" borderRadius="6px" />
    </div>
  </div>
);

export const MobileComboCategorySkeleton = () => (
  <div className="m-combo-single-cat-card">
    <div className="m-combo-cat-card-img-wrap">
      <SkeletonBox height="110px" borderRadius="8px" />
    </div>
    <div className="p-2">
      <SkeletonBox width="70%" height="16px" className="mb-1" />
      <SkeletonBox width="50%" height="11px" />
    </div>
  </div>
);

export const MobileComboCardSkeleton = () => (
  <div className="mobile-combo-card-skeleton mb-3 p-2">
    <div className="d-flex gap-2 mb-2">
      <SkeletonBox height="120px" borderRadius="8px" />
      <SkeletonBox height="120px" borderRadius="8px" />
    </div>
    <SkeletonBox width="75%" height="16px" className="mb-1" />
    <SkeletonBox width="45%" height="12px" className="mb-2" />
    <SkeletonBox width="60%" height="22px" className="mb-2" />
    <SkeletonBox width="100%" height="38px" borderRadius="6px" />
  </div>
);

export const PdpSkeleton = () => (
  <>
    {/* Desktop PDP skeleton */}
    <div className="orderly-desktop-pdp-wrapper">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-5">
            <SkeletonBox height="480px" borderRadius="12px" className="mb-3" />
            <div className="d-flex gap-2">
              <SkeletonBox width="70px" height="84px" borderRadius="8px" />
              <SkeletonBox width="70px" height="84px" borderRadius="8px" />
              <SkeletonBox width="70px" height="84px" borderRadius="8px" />
              <SkeletonBox width="70px" height="84px" borderRadius="8px" />
            </div>
          </div>
          <div className="col-lg-7">
            <SkeletonBox width="25%" height="12px" className="mb-2" />
            <SkeletonBox width="85%" height="28px" className="mb-2" />
            <SkeletonBox width="55%" height="16px" className="mb-3" />
            <SkeletonBox width="40%" height="30px" className="mb-3" />
            <SkeletonBox width="95%" height="14px" className="mb-2" />
            <SkeletonBox width="90%" height="14px" className="mb-4" />
            <SkeletonBox width="100%" height="120px" borderRadius="10px" className="mb-4" />
            <div className="d-flex gap-2">
              <SkeletonBox width="60%" height="52px" borderRadius="8px" />
              <SkeletonBox width="60px" height="52px" borderRadius="8px" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile PDP skeleton */}
    <div className="orderly-mobile-pdp-wrapper">
      <div className="p-3">
        <SkeletonBox height="320px" borderRadius="10px" className="mb-3" />
        <SkeletonBox width="35%" height="12px" className="mb-2" />
        <SkeletonBox width="80%" height="20px" className="mb-2" />
        <SkeletonBox width="45%" height="26px" className="mb-3" />
        <SkeletonBox width="100%" height="100px" borderRadius="8px" className="mb-3" />
        <SkeletonBox width="100%" height="46px" borderRadius="8px" className="mb-3" />
        <SkeletonBox width="100%" height="120px" borderRadius="8px" className="mb-3" />
        <SkeletonBox width="100%" height="120px" borderRadius="8px" />
      </div>
    </div>
  </>
);

export const ComboDetailSkeleton = () => (
  <>
    {/* Desktop combo detail skeleton */}
    <div className="orderly-desktop-combo-pdp-wrapper">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-5">
            <SkeletonBox height="460px" borderRadius="12px" className="mb-3" />
            <div className="d-flex gap-2">
              <SkeletonBox width="80px" height="90px" borderRadius="8px" />
              <SkeletonBox width="80px" height="90px" borderRadius="8px" />
              <SkeletonBox width="80px" height="90px" borderRadius="8px" />
            </div>
          </div>
          <div className="col-lg-7">
            <SkeletonBox width="30%" height="14px" className="mb-2" />
            <SkeletonBox width="80%" height="28px" className="mb-2" />
            <SkeletonBox width="50%" height="16px" className="mb-3" />
            <SkeletonBox width="42%" height="30px" className="mb-4" />
            <SkeletonBox width="100%" height="150px" borderRadius="10px" className="mb-4" />
            <div className="d-flex gap-2">
              <SkeletonBox width="60%" height="52px" borderRadius="8px" />
              <SkeletonBox width="40%" height="52px" borderRadius="8px" />
            </div>
          </div>
        </div>
        <div className="row g-3 mt-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-6 col-lg-3">
              <SkeletonBox height="150px" borderRadius="10px" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Mobile combo detail skeleton */}
    <div className="orderly-mobile-combo-pdp-wrapper">
      <div className="p-3">
        <SkeletonBox height="300px" borderRadius="10px" className="mb-3" />
        <SkeletonBox width="60%" height="20px" className="mb-2" />
        <SkeletonBox width="40%" height="24px" className="mb-3" />
        <SkeletonBox width="100%" height="120px" borderRadius="8px" className="mb-3" />
        <SkeletonBox width="100%" height="46px" borderRadius="8px" className="mb-3" />
        <SkeletonBox width="100%" height="90px" borderRadius="8px" className="mb-3" />
        <SkeletonBox width="100%" height="90px" borderRadius="8px" />
      </div>
    </div>
  </>
);

export default SkeletonBox;
