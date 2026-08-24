import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiHeart, FiCheck, FiShoppingBag, FiChevronDown } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useQuickView } from '../../context/QuickViewContext';
import { formatPrice, calculateDiscount, normalizeProduct, colorImages } from '../../utils/formatters';
import './ProductCard.css';

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

const isProductFullyOutOfStock = (prod) => {
  if (!prod) return false;
  if (prod.inventory && Object.keys(prod.inventory).length > 0) {
    const total = Object.values(prod.inventory).reduce((sum, val) => sum + Number(val || 0), 0);
    return total <= 0;
  }
  if (prod.stock !== undefined) return Number(prod.stock) <= 0;
  return false;
};

const isSizeOutOfStock = (prod, colorName, size) => {
  if (!prod) return false;
  if (isProductFullyOutOfStock(prod)) return true;
  if (!prod.inventory || Object.keys(prod.inventory).length === 0) return false;

  const key1 = `${colorName}-${size}`;
  if (prod.inventory[key1] !== undefined) return Number(prod.inventory[key1]) <= 0;
  const key2 = `${colorName} - ${size}`;
  if (prod.inventory[key2] !== undefined) return Number(prod.inventory[key2]) <= 0;
  if (prod.inventory[size] !== undefined) return Number(prod.inventory[size]) <= 0;
  if (prod.inventory[`Standard-${size}`] !== undefined) return Number(prod.inventory[`Standard-${size}`]) <= 0;

  const normColor = String(colorName || '').toLowerCase().trim();
  const normSize = String(size || '').toLowerCase().trim();
  for (const [k, v] of Object.entries(prod.inventory)) {
    const kClean = k.toLowerCase().trim();
    const parts = kClean.split('-');
    const kSize = parts[parts.length - 1]?.trim();
    const kColor = parts.slice(0, parts.length - 1).join('-').trim();
    if (kSize === normSize) {
      if (!kColor || kColor === normColor || normColor.includes(kColor) || kColor.includes(normColor)) {
        return Number(v) <= 0;
      }
    }
  }
  return false;
};

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const sizeDropdownRef = useRef(null);

  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { openQuickView } = useQuickView();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(e.target)) {
        setIsSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  if (!product) return null;

  const p = normalizeProduct(product);
  const isOutOfStock = isProductFullyOutOfStock(p);

  const images = p.images && p.images.length > 0 ? p.images : [];
  const colors = p.colors && p.colors.length > 0 ? p.colors : [];
  const sizes = useMemo(() => {
    return (p.sizes && p.sizes.length > 0 ? p.sizes : []).map(String);
  }, [p.sizes]);

  const [selectedSize, setSelectedSize] = useState(() => sizes[0] || 'M');

  useEffect(() => {
    if (sizes.length > 0) {
      if (!selectedSize || !sizes.includes(selectedSize)) {
        setSelectedSize(sizes[0]);
      }
    }
  }, [p.id, sizes]);

  const activeColor = colors[selectedColorIndex % colors.length];
  const activeColorImgs = activeColor ? colorImages(p, activeColor?.name) : [];
  const colorImgs = activeColorImgs.length > 0 ? activeColorImgs : images;
  const primaryImg = colorImgs[0] || images[0];
  const secondaryImg = colorImgs[1] || images[1] || primaryImg;

  const isWishlisted = wishlist.some(item => String(item.id) === String(p.id));

  // Dynamic price & original price based on selected size
  const cardPrice = getSizePrice(p, selectedSize);
  const cardOriginalPrice = getSizeOriginalPrice(p, selectedSize, cardPrice);
  const discountPercent = calculateDiscount(cardOriginalPrice, cardPrice);

  const isCurrentVariantOutOfStock = isOutOfStock || (sizes.length > 0 && isSizeOutOfStock(p, activeColor?.name, selectedSize));

  const rawCount = p.reviews_count || p.reviewsCount || p.numReviews || p.ratings_count || p.ratingsCount;
  const reviewCount = (rawCount !== undefined && rawCount !== null && !isNaN(rawCount)) 
    ? Number(rawCount) 
    : (Math.floor(Math.abs(Math.sin(Number(p.id) || 1) * 80)) + 45);

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentVariantOutOfStock) return;
    addToCart(product, selectedSize, activeColor, 1, cardPrice, cardOriginalPrice);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div 
      className={`product-card ${isOutOfStock ? 'card-out-of-stock' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Container */}
      <div className="product-card-media">
        <Link to={`/product/${p.slug || p.id}`} className="product-image-link">
          <div className="product-image-wrapper">
            <img
              src={primaryImg || '/logo.png'}
              alt={p.name}
              className={`product-card-img ${isHovered && secondaryImg && secondaryImg !== primaryImg ? 'hover-hidden' : ''}`}
              loading="lazy"
              decoding="async"
              style={isOutOfStock ? { filter: 'grayscale(0.5)', opacity: 0.7 } : {}}
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            />
            {secondaryImg && secondaryImg !== primaryImg && (
              <img
                src={secondaryImg}
                alt={p.name}
                className={`product-card-img hover-image ${isHovered ? 'hover-visible' : ''}`}
                loading="lazy"
                decoding="async"
                style={isOutOfStock ? { filter: 'grayscale(0.5)', opacity: 0.7 } : {}}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>
        </Link>

        {/* Wishlist button removed per design */}

        {/* Top-Left Badges Stack (Discount / Out of Stock / Color Badges) */}
        <div className="card-badges-stack">
          {isOutOfStock ? (
            <span className="card-top-badge badge-out">
              OUT OF STOCK
            </span>
          ) : p.badge ? (
            <span className="card-top-badge badge-red-tag">
              {p.badge}
            </span>
          ) : discountPercent > 0 ? (
            <span className="card-top-badge badge-red-tag">
              {discountPercent}% OFF
            </span>
          ) : null}

          {colors.length > 1 && (
            <span className="card-top-badge badge-colors-tag">
              {colors.length} Colors
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <button 
          type="button"
          className="card-quickview-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openQuickView(product);
          }}
          title="Quick View"
        >
          <FiEye /> Quick View
        </button>
      </div>

      {/* Product Content Info */}
      <div className="product-card-info">
        <h5 className="product-name">
          <Link to={`/product/${p.slug || p.id}`}>{p.name}</Link>
        </h5>

        {/* Rating Stars & Count */}
        <div className="product-rating-row">
          <div className="stars-gold">
            <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
          </div>
          <span className="rating-count">({reviewCount})</span>
        </div>

        {/* Price Row (Without discount % badge) */}
        <div className="product-price-row">
          <span className="current-price">{formatPrice(cardPrice)}</span>
          {cardOriginalPrice && Number(cardOriginalPrice) > Number(cardPrice) && (
            <span className="old-price">{formatPrice(cardOriginalPrice)}</span>
          )}
        </div>

        {/* Action Row: Size Selector (only if > 1 size) + Cart Button */}
        <div className={`product-card-action-row ${sizes.length > 1 ? 'has-size-select' : 'no-size-select'}`} onClick={(e) => e.stopPropagation()}>
          {sizes.length > 1 && (
            <div className="card-custom-size-wrapper" ref={sizeDropdownRef}>
              <button
                type="button"
                className={`card-custom-size-btn ${isSizeDropdownOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSizeDropdownOpen(prev => !prev);
                }}
                title="Select Size"
                aria-label="Select Size"
              >
                <span className="size-label-text">Size: {selectedSize}</span>
                <FiChevronDown className={`size-chevron-icon ${isSizeDropdownOpen ? 'open' : ''}`} />
              </button>

              {isSizeDropdownOpen && (
                <div className="card-size-dropdown-menu">
                  {sizes.map((sz, idx) => {
                    const outOfStock = isSizeOutOfStock(p, activeColor?.name, sz);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`card-size-menu-item ${sz === selectedSize ? 'selected' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedSize(sz);
                          setIsSizeDropdownOpen(false);
                        }}
                      >
                        <span>Size: {sz}</span>
                        {outOfStock && <span className="size-sold-tag">Sold Out</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className={`btn-add-to-cart-card ${sizes.length > 1 ? 'split-btn' : 'full-width-btn'} ${isCurrentVariantOutOfStock ? 'disabled' : ''} ${addedAnimation ? 'added' : ''}`}
            onClick={handleAddToCartClick}
            disabled={isCurrentVariantOutOfStock}
            title={addedAnimation ? 'Added to Bag' : isCurrentVariantOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            aria-label={addedAnimation ? 'Added to Bag' : isCurrentVariantOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          >
            {addedAnimation ? (
              <><FiCheck className="card-btn-icon me-1" /> ADDED</>
            ) : isCurrentVariantOutOfStock ? (
              'OUT OF STOCK'
            ) : sizes.length > 1 ? (
              <><FiShoppingBag className="card-btn-icon me-1" /> ADD</>
            ) : (
              <><FiShoppingBag className="card-btn-icon me-1" /> ADD TO CART</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
