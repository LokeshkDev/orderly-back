import React from 'react';
import './ComboCover.css';

export const getComboPrimaryImages = (items = [], images = []) => {
  const extracted = [];

  if (Array.isArray(items) && items.length > 0) {
    items.forEach((item) => {
      if (!item) return;
      let primary = item.primaryImage || item.primary_image;

      if (!primary && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
        primary = typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url || item.images[0].image_url;
      }

      if (!primary && Array.isArray(item.colors) && item.colors[0]) {
        const cImgs = item.colors[0].images;
        if (Array.isArray(cImgs) && cImgs.length > 0 && cImgs[0]) {
          primary = typeof cImgs[0] === 'string' ? cImgs[0] : cImgs[0].url || cImgs[0].image_url;
        }
      }

      if (!primary && typeof item.image === 'string' && item.image.trim().length > 0) {
        primary = item.image;
      }

      if (primary && typeof primary === 'string') {
        extracted.push(primary);
      }
    });
  }

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
      <div className={`admin-combo-cover-wrapper admin-combo-cover-fallback ${className}`}>
        <div className="admin-combo-cover-empty">
          <span className="admin-combo-cover-empty-logo">ORDERLY</span>
          <span className="admin-combo-cover-empty-sub">SELECT PRODUCTS</span>
        </div>
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className={`admin-combo-cover-wrapper admin-combo-cover-1 ${className}`}>
        <div className="admin-combo-cover-single">
          <img
            src={primaryImages[0]}
            alt={`${comboName} - Piece 1`}
            className="admin-combo-cover-img"
            onError={handleImageError}
          />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className={`admin-combo-cover-wrapper admin-combo-cover-2 ${className}`}>
        <div className="admin-combo-cover-cell">
          <img
            src={primaryImages[0]}
            alt={`${comboName} - Piece 1`}
            className="admin-combo-cover-img"
            onError={handleImageError}
          />
        </div>
        {showPlusBadge && (
          <div className="admin-combo-cover-plus-badge" aria-hidden="true">+</div>
        )}
        <div className="admin-combo-cover-cell">
          <img
            src={primaryImages[1]}
            alt={`${comboName} - Piece 2`}
            className="admin-combo-cover-img"
            onError={handleImageError}
          />
        </div>
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className={`admin-combo-cover-wrapper admin-combo-cover-3 ${className}`}>
        {primaryImages.slice(0, 3).map((imgUrl, idx) => (
          <div key={idx} className="admin-combo-cover-cell">
            <img
              src={imgUrl}
              alt={`${comboName} - Piece ${idx + 1}`}
              className="admin-combo-cover-img"
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className={`admin-combo-cover-wrapper admin-combo-cover-4 ${className}`}>
        {primaryImages.slice(0, 4).map((imgUrl, idx) => (
          <div key={idx} className="admin-combo-cover-cell">
            <img
              src={imgUrl}
              alt={`${comboName} - Piece ${idx + 1}`}
              className="admin-combo-cover-img"
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 5) {
    return (
      <div className={`admin-combo-cover-wrapper admin-combo-cover-5 ${className}`}>
        {primaryImages.slice(0, 5).map((imgUrl, idx) => (
          <div key={idx} className={`admin-combo-cover-cell admin-combo-cell-5-${idx + 1}`}>
            <img
              src={imgUrl}
              alt={`${comboName} - Piece ${idx + 1}`}
              className="admin-combo-cover-img"
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`admin-combo-cover-wrapper admin-combo-cover-multi ${className}`}>
      {primaryImages.slice(0, 6).map((imgUrl, idx) => (
        <div key={idx} className="admin-combo-cover-cell">
          <img
            src={imgUrl}
            alt={`${comboName} - Piece ${idx + 1}`}
            className="admin-combo-cover-img"
            onError={handleImageError}
          />
        </div>
      ))}
    </div>
  );
};

export default ComboCover;

