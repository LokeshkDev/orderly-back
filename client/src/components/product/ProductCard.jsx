import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useQuickView } from '../../context/QuickViewContext';
import { formatPrice, calculateDiscount, normalizeProduct, colorImages } from '../../utils/formatters';
import './ProductCard.css';

const isProductFullyOutOfStock = (prod) => {
  if (!prod) return false;
  if (prod.inventory && Object.keys(prod.inventory).length > 0) {
    const total = Object.values(prod.inventory).reduce((sum, val) => sum + Number(val || 0), 0);
    return total <= 0;
  }
  if (prod.stock !== undefined) return Number(prod.stock) <= 0;
  return false;
};

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { openQuickView } = useQuickView();

  if (!product) return null;

  const p = normalizeProduct(product);
  const isOutOfStock = isProductFullyOutOfStock(p);

  const images = p.images && p.images.length > 0 ? p.images : [];

  const colors = p.colors && p.colors.length > 0 ? p.colors : [];

  const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : [];

  const originalPrice = p.originalPrice || p.original_price;
  const isWishlisted = wishlist.some(item => String(item.id) === String(p.id));
  const discountPercent = calculateDiscount(originalPrice, p.price);

  const activeColor = colors[selectedColorIndex % colors.length];
  const activeColorImgs = activeColor ? colorImages(p, activeColor?.name) : [];
  const colorImgs = activeColorImgs.length > 0 ? activeColorImgs : images;
  const primaryImg = colorImgs[0] || images[0];
  const secondaryImg = colorImgs[1] || images[1] || primaryImg;

  return (
    <div 
      className={`product-card ${isOutOfStock ? 'card-out-of-stock' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Image Container */}
      <div className="product-card-media">
        <Link to={`/product/${p.slug || p.id}`} className="product-image-link">
          {primaryImg ? (
            <img
              src={isHovered ? secondaryImg : primaryImg}
              alt={p.name}
              className="product-card-img"
              style={isOutOfStock ? { filter: 'grayscale(0.5)', opacity: 0.7 } : {}}
            />
          ) : (
            <div className="product-card-img product-card-img-placeholder d-flex align-items-center justify-content-center bg-light">
              <span className="text-muted small">No Image</span>
            </div>
          )}
        </Link>

        {/* Top Badge */}
        {isOutOfStock ? (
          <span className="badge-orderly card-badge" style={{ background: '#ef4444', color: '#ffffff' }}>
            OUT OF STOCK
          </span>
        ) : p.badge ? (
          <span className={`badge-orderly badge-${String(p.badge).toLowerCase()} card-badge`}>
            {p.badge}
          </span>
        ) : null}

        {/* Color Dots Overlaid ON TOP of Product Image */}
        {colors && colors.length > 0 && (
          <div className="card-color-swatches-overlay">
            {colors.slice(0, 5).map((color, idx) => (
              <button
                key={idx}
                type="button"
                className={`card-color-dot ${selectedColorIndex === idx ? 'active' : ''}`}
                style={{ backgroundColor: color.hex || color.hex_code }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedColorIndex(idx);
                }}
                title={color.name}
              />
            ))}
          </div>
        )}

        {/* Sizes Overlay Badge */}
        {sizes && sizes.length > 0 && (
          <div className="card-sizes-badge">
            <span>SIZES {sizes[0]} - {sizes[sizes.length - 1]}</span>
          </div>
        )}

        {/* Action Overlay Icons */}
        <div className="card-action-overlay">
          <button 
            className={`card-action-btn ${isWishlisted ? 'active' : ''}`}
            onClick={() => toggleWishlist(product)}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <FiHeart />
          </button>

          <button 
            className="card-action-btn"
            onClick={() => openQuickView(product)}
            title="Quick View"
          >
            <FiEye />
          </button>

          <button 
            className={`card-action-btn highlight-cart ${isOutOfStock ? 'disabled' : ''}`}
            onClick={() => !isOutOfStock && addToCart(product, sizes[0] || 'M', activeColor)}
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
            disabled={isOutOfStock}
          >
            <FiShoppingBag />
          </button>
        </div>
      </div>

      {/* Product Content info */}
      <div className="product-card-info">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <span className="product-brand">{p.brand || 'ORDERLY'}</span>
          <div className="product-rating-sm">
            <FiStar className="star-icon" /> <span>{p.rating || 4.9}</span>
          </div>
        </div>

        <h5 className="product-name">
          <Link to={`/product/${p.slug || p.id}`}>{p.name}</Link>
        </h5>

        <div className="product-price-wrapper">
          <span className="current-price">{formatPrice(p.price)}</span>
          {originalPrice && (
            <span className="old-price">{formatPrice(originalPrice)}</span>
          )}
          {discountPercent > 0 && (
            <span className="discount-off">{discountPercent}% OFF</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
