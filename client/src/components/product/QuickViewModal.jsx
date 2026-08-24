import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiShoppingBag, FiHeart, FiStar, FiCheck, FiArrowRight } from 'react-icons/fi';
import { useQuickView } from '../../context/QuickViewContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice, calculateDiscount, normalizeProduct, colorImages } from '../../utils/formatters';
import './QuickViewModal.css';

const QuickViewModal = () => {
  const { quickViewProduct, closeQuickView } = useQuickView();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const getSizePrice = (prod, size) => {
    if (!prod || !size) return prod?.price ?? 0;
    if (prod.sizePrices && prod.sizePrices[size] !== undefined && prod.sizePrices[size] !== null) {
      return Number(prod.sizePrices[size]);
    }
    return prod.price ?? 0;
  };

  const getSizeOriginalPrice = (prod, size, sizePrice) => {
    if (!prod) return 0;
    const basePrice = Number(prod.price) || 0;
    const baseOrigPrice = Number(prod.originalPrice ?? prod.original_price) || 0;

    if (prod.sizeOriginalPrices && prod.sizeOriginalPrices[size] !== undefined && prod.sizeOriginalPrices[size] !== null) {
      return Number(prod.sizeOriginalPrices[size]);
    }

    if (!baseOrigPrice) return 0;
    if (!size || !prod.sizePrices || prod.sizePrices[size] === undefined || prod.sizePrices[size] === null) {
      return baseOrigPrice;
    }

    if (basePrice > 0) {
      const ratio = baseOrigPrice / basePrice;
      return Math.max(Number(sizePrice), Math.round(Number(sizePrice) * ratio));
    }
    return baseOrigPrice;
  };

  if (!quickViewProduct) return null;

  const product = normalizeProduct(quickViewProduct);
  const activeColor = selectedColor || product.colors?.[0];
  const isWishlisted = wishlist.some(item => item.id === product.id);
  const currentPrice = getSizePrice(product, selectedSize);
  const currentOriginalPrice = getSizeOriginalPrice(product, selectedSize, currentPrice);
  const discountPercent = calculateDiscount(currentOriginalPrice, currentPrice);

  const galleryImages = colorImages(product, activeColor?.name);
  const images = galleryImages.length > 0
    ? galleryImages
    : (product.images && product.images.length > 0 ? product.images : []);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, activeColor, quantity, currentPrice, currentOriginalPrice);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const selectColor = (c) => {
    setSelectedColor(c);
    setSelectedImg(0);
  };

  return (
    <div className="quickview-backdrop">
      <div className="quickview-modal glass-panel">
        <button className="quickview-close-btn" onClick={closeQuickView}>
          <FiX />
        </button>

        <div className="row g-0 h-100">
          {/* Gallery Column */}
          <div className="col-lg-6 quickview-gallery">
            <div className="main-img-wrapper">
              {images[selectedImg] || images[0] ? (
                <img
                  src={images[selectedImg] || images[0]}
                  alt={product.name}
                  className="quickview-main-img"
                />
              ) : (
                <div className="quickview-main-img quickview-img-placeholder d-flex align-items-center justify-content-center bg-light">
                  <span className="text-muted small">No Image</span>
                </div>
              )}
              {product.badge && (
                <span className={`badge-orderly badge-${product.badge.toLowerCase()} quickview-badge`}>
                  {product.badge}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="quickview-thumbs">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumb-btn ${selectedImg === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImg(idx)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="col-lg-6 quickview-details">
            <span className="qv-brand">{product.brand}</span>
            <h3 className="qv-title">{product.name}</h3>

            <div className="qv-rating">
              <span className="stars">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="star-icon filled" />
                ))}
              </span>
              <span className="rating-score">{product.rating}</span>
              <span className="reviews-count">({product.reviewsCount || product.reviews_count} reviews)</span>
            </div>

            {/* Pricing */}
            <div className="qv-price-box">
              <span className="qv-price">{formatPrice(currentPrice)}</span>
              {currentOriginalPrice && Number(currentOriginalPrice) > Number(currentPrice) && (
                <span className="qv-original-price">{formatPrice(currentOriginalPrice)}</span>
              )}
              {discountPercent > 0 && (
                <span className="qv-discount-badge">{discountPercent}% OFF</span>
              )}
            </div>

            <p className="qv-desc">{product.description}</p>

            {/* Color Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="qv-option-group">
                <label className="option-label">Color: <strong>{activeColor?.name}</strong></label>
                <div className="color-swatches">
                  {product.colors.map((c, i) => (
                    <button
                      key={i}
                      className={`color-swatch-btn ${activeColor?.name === c.name ? 'active' : ''}`}
                      style={{ backgroundColor: c.hex || c.hex_code }}
                      onClick={() => selectColor(c)}
                      title={c.name}
                    >
                      {activeColor?.name === c.name && <FiCheck className="swatch-check" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="qv-option-group">
                <label className="option-label">Select Size: <strong>{selectedSize}</strong></label>
                <div className="size-pills">
                  {product.sizes.map((s, i) => (
                    <button
                      key={i}
                      className={`size-pill-btn ${selectedSize === s ? 'active' : ''}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & CTA */}
            <div className="qv-actions">
              <div className="qv-qty-picker">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              <button className="btn-primary-orderly flex-grow-1 py-3" onClick={handleAddToCart}>
                <FiShoppingBag /> Add to Cart
              </button>

              <button 
                className={`qv-wishlist-btn ${isWishlisted ? 'active' : ''}`} 
                onClick={() => toggleWishlist(product)}
                title="Wishlist"
              >
                <FiHeart />
              </button>
            </div>

            {addedNotice && (
              <div className="qv-added-toast">
                <FiCheck /> Item added to bag!
              </div>
            )}

            <div className="qv-footer-link">
              <Link to={`/product/${product.slug || product.id}`} onClick={closeQuickView}>
                View Full Specifications & Wash Care <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
