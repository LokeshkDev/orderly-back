import React from 'react';
import './ComboCover.css';

/**
 * Helper to extract the primary cover image for a combo card.
 * Prefers explicitly configured combo coverImage first, then combo images array,
 * then primary image of the first product in items.
 */
export const getComboPrimaryImages = (items = [], images = [], coverImage = '') => {
  if (coverImage && typeof coverImage === 'string' && coverImage.trim()) {
    return [coverImage.trim()];
  }

  // Fallback 1: First image in images array
  if (Array.isArray(images) && images.length > 0 && images[0]) {
    const url = typeof images[0] === 'string' ? images[0] : images[0].url || images[0].image_url;
    if (url && typeof url === 'string' && url.trim()) {
      return [url.trim()];
    }
  }

  // Fallback 2: Primary image of first item
  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      if (!item) continue;
      let primary = item.primaryImage || item.primary_image;
      if (!primary && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
        primary = typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url || item.images[0].image_url;
      }
      if (!primary && Array.isArray(item.colors) && item.colors[0] && Array.isArray(item.colors[0].images) && item.colors[0].images[0]) {
        const c0 = item.colors[0].images[0];
        primary = typeof c0 === 'string' ? c0 : c0.url || c0.image_url;
      }
      if (!primary && typeof item.image === 'string' && item.image.trim()) {
        primary = item.image.trim();
      }
      if (primary && typeof primary === 'string' && primary.trim()) {
        return [primary.trim()];
      }
    }
  }

  return [];
};

const ComboCover = ({
  items = [],
  images = [],
  coverImage = '',
  comboName = 'Combo Bundle',
  className = ''
}) => {
  const primaryImages = getComboPrimaryImages(items, images, coverImage);
  const primaryImg = coverImage || primaryImages[0];

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/logo.png';
  };

  if (!primaryImg) {
    return (
      <div className={`combo-cover-wrapper combo-cover-fallback ${className}`}>
        <div className="combo-cover-empty">
          <span className="combo-cover-empty-logo">ORDERLY</span>
          <span className="combo-cover-empty-sub">CURATED COMBO</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`combo-cover-wrapper combo-cover-single ${className}`}>
      <div className="combo-cover-single">
        <img
          src={primaryImg}
          alt={`${comboName} - Cover`}
          className="combo-cover-img"
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      </div>
    </div>
  );
};

export default ComboCover;
