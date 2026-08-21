import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiHeart, FiStar } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useQuickView } from '../../context/QuickViewContext';
import { formatPrice, calculateDiscount, normalizeProduct, colorImages } from '../../utils/formatters';
import OptimizedImage from '../../components/common/OptimizedImage';
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

  const rawCount = p.reviews_count || p.reviewsCount || p.numReviews || p.ratings_count || p.ratingsCount;
  const reviewCount = (rawCount !== undefined && rawCount !== null && !isNaN(rawCount)) 
    ? Number(rawCount) 
    : (Math.floor(Math.abs(Math.sin(Number(p.id) || 1) * 80)) + 45);

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

        {/* Top-Right Heart Wishlist Button */}
        <button 
          type="button"
          className={`card-wishlist-top-btn ${isWishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <FiHeart />
        </button>

        {/* Top-Left Badge */}
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

        {/* Price Row */}
        <div className="product-price-row">
          <span className="current-price">{formatPrice(p.price)}</span>
          {originalPrice && (
            <span className="old-price">{formatPrice(originalPrice)}</span>
          )}
        </div>

        {/* Full-width ADD TO CART Button */}
        <button
          type="button"
          className={`btn-add-to-cart-card ${isOutOfStock ? 'disabled' : ''}`}
          onClick={() => !isOutOfStock && addToCart(product, sizes[0] || 'M', activeColor)}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
