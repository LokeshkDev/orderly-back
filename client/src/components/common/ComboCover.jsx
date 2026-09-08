import React from 'react';
import './ComboCover.css';

/**
 * Helper to extract primary images from combo items or images array.
 * Strictly uses primary product image (index 0), never secondary/hover/back views.
 */
export const getComboPrimaryImages = (items = [], images = []) => {
  const extracted = [];

  if (Array.isArray(items) && items.length > 0) {
    items.forEach((item) => {
      if (!item) return;
      // 1. Explicit primary image field
      let primary = item.primaryImage || item.primary_image;

      // 2. First image in product/item images array
      if (!primary && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
        primary = typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url || item.images[0].image_url;
      }

      // 3. First image of first color variant
      if (!primary && Array.isArray(item.colors) && item.colors[0]) {
        const cImgs = item.colors[0].images;
        if (Array.isArray(cImgs) && cImgs.length > 0 && cImgs[0]) {
          primary = typeof cImgs[0] === 'string' ? cImgs[0] : cImgs[0].url || cImgs[0].image_url;
        }
      }

      // 4. Flat image string property
      if (!primary && typeof item.image === 'string' && item.image.trim().length > 0) {
        primary = item.image;
      }

      if (primary && typeof primary === 'string') {
        extracted.push(primary);
      }
    });
  }

  // If no item-level images extracted, fall back to combo.images array
  if (extracted.length === 0 && Array.isArray(images) && images.length > 0) {
    images.forEach((img) => {
      const url = typeof img === 'string' ? img : img?.url || img?.image_url;
      if (url && typeof url === 'string') {
        extracted.push(url);
      }
    });
  }

  return extracted;
};

const ComboCover = ({
  items = [],
  images = [],
  comboName = 'Combo Bundle',
  className = '',
  showPlusBadge = true
}) => {
  const primaryImages = getComboPrimaryImages(items, images);
  const count = primaryImages.length;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/logo.png';
  };

  if (count === 0) {
    return (
      <div className={`combo-cover-wrapper combo-cover-fallback ${className}`}>
        <div className="combo-cover-empty">
          <span className="combo-cover-empty-logo">ORDERLY</span>
          <span className="combo-cover-empty-sub">CURATED COMBO</span>
        </div>
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className={`combo-cover-wrapper combo-cover-1 ${className}`}>
        <div className="combo-cover-single">
          <img
            src={primaryImages[0]}
            alt={`${comboName} - Product 1`}
            className="combo-cover-img"
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className={`combo-cover-wrapper combo-cover-2 ${className}`}>
        <div className="combo-cover-cell">
          <img
            src={primaryImages[0]}
            alt={`${comboName} - Piece 1`}
            className="combo-cover-img"
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        </div>
        {showPlusBadge && (
          <div className="combo-cover-plus-badge" aria-hidden="true">+</div>
        )}
        <div className="combo-cover-cell">
          <img
            src={primaryImages[1]}
            alt={`${comboName} - Piece 2`}
            className="combo-cover-img"
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        </div>
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className={`combo-cover-wrapper combo-cover-3 ${className}`}>
        {primaryImages.slice(0, 3).map((imgUrl, idx) => (
          <div key={idx} className="combo-cover-cell">
            <img
              src={imgUrl}
              alt={`${comboName} - Piece ${idx + 1}`}
              className="combo-cover-img"
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className={`combo-cover-wrapper combo-cover-4 ${className}`}>
        {primaryImages.slice(0, 4).map((imgUrl, idx) => (
          <div key={idx} className="combo-cover-cell">
            <img
              src={imgUrl}
              alt={`${comboName} - Piece ${idx + 1}`}
              className="combo-cover-img"
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 5) {
    return (
      <div className={`combo-cover-wrapper combo-cover-5 ${className}`}>
        {primaryImages.slice(0, 5).map((imgUrl, idx) => (
          <div key={idx} className={`combo-cover-cell combo-cell-5-${idx + 1}`}>
            <img
              src={imgUrl}
              alt={`${comboName} - Piece ${idx + 1}`}
              className="combo-cover-img"
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
    );
  }

  // 6 or more products
  return (
    <div className={`combo-cover-wrapper combo-cover-multi ${className}`}>
      {primaryImages.slice(0, 6).map((imgUrl, idx) => (
        <div key={idx} className="combo-cover-cell">
          <img
            src={imgUrl}
            alt={`${comboName} - Piece ${idx + 1}`}
            className="combo-cover-img"
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        </div>
      ))}
    </div>
  );
};

export default ComboCover;

