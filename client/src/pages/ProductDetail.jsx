import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiHeart, FiShoppingBag, FiShield, FiRefreshCw, FiChevronRight,
  FiCheck, FiArrowDown, FiAlertCircle, FiEye, FiChevronLeft,
  FiMaximize2, FiMinus, FiPlus, FiTruck, FiLock, FiX, FiTag,
  FiStar, FiEdit3
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import SEO from '../components/common/SEO';
import ProductCard from '../components/product/ProductCard';
import MobileProductDetail from '../components/product/MobileProductDetail';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useQuickView } from '../context/QuickViewContext';
import { getProductById, getProducts } from '../services/api';
import { formatPrice, calculateDiscount } from '../utils/formatters';
import './ProductDetail.css';

/* ── Promotional offers displayed on PDP ──────────────────────────
   In production these should be managed from admin settings or a
   dedicated marketing CMS endpoint.  Update this array or create
   an admin-managed "pdp_offers" site-setting to make them dynamic. */
const PDP_PROMOTIONAL_OFFERS = [
  { text: 'Get extra 10% off on prepaid orders', code: 'ORDERLY10' },
  { text: 'Buy 2 Get extra 15% off', code: 'COMBO15' },
];

/* ── Universal bulletproof stock resolution helper ──────────────── */
export const getVariantStock = (productObj, colorVal, sizeVal) => {
  if (!productObj) return 0;
  if (productObj.status === 'Draft') return 0;

  if (productObj.inventory && Object.keys(productObj.inventory).length > 0) {
    const totalInventoryStock = Object.values(productObj.inventory).reduce((sum, val) => sum + Number(val || 0), 0);
    if (totalInventoryStock <= 0) return 0;
  }

  if (productObj.stock !== undefined && Number(productObj.stock) <= 0 && (!productObj.inventory || Object.keys(productObj.inventory).length === 0)) {
    return 0;
  }

  const colorName = (typeof colorVal === 'object' ? colorVal?.name : colorVal) || productObj.colors?.[0]?.name || '';
  const sizeName = String(sizeVal || '').trim();

  if (productObj.inventory && Object.keys(productObj.inventory).length > 0) {
    const key1 = `${colorName}-${sizeName}`;
    if (productObj.inventory[key1] !== undefined) return Number(productObj.inventory[key1]);

    const key2 = `${colorName} - ${sizeName}`;
    if (productObj.inventory[key2] !== undefined) return Number(productObj.inventory[key2]);

    const normColor = colorName.toLowerCase().trim();
    const normSize = sizeName.toLowerCase().trim();

    for (const [k, v] of Object.entries(productObj.inventory)) {
      const kClean = k.toLowerCase().trim();
      const parts = kClean.split('-');
      const kSize = parts[parts.length - 1]?.trim();
      const kColor = parts.slice(0, parts.length - 1).join('-').trim();

      if (kSize === normSize) {
        if (!kColor || kColor === normColor || normColor.includes(kColor) || kColor.includes(normColor)) {
          return Number(v);
        }
      }
    }

    if (productObj.inventory[sizeName] !== undefined) return Number(productObj.inventory[sizeName]);
  }

  if (productObj.stock !== undefined) return Number(productObj.stock);
  return 0;
};

/* ── Safe image extractor ──────────────────────────────────────── */
const getSafeProductImage = (item) => {
  if (item && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0];
  }
  if (item && Array.isArray(item.colors) && item.colors[0] && Array.isArray(item.colors[0].images) && item.colors[0].images[0]) {
    return item.colors[0].images[0];
  }
  return '';
};

const mergePairOffer = (productItem, pairOffers = {}) => {
  if (!productItem) return null;
  const productId = String(productItem.id);
  const offer = pairOffers?.[productId];
  const enabled = Boolean(offer?.enabled);
  const basePrice = Number(productItem.originalPrice ?? productItem.original_price ?? productItem.price ?? 0);
  const discountPercent = Math.max(0, Math.min(90, Number(offer?.discount_percent ?? offer?.discountPercent ?? 0)));
  const offerPrice = discountPercent > 0
    ? Math.max(0, Math.round(basePrice * (100 - discountPercent) / 100))
    : Number(offer?.offer_price ?? productItem.price ?? 0);

  return {
    ...productItem,
    price: enabled ? offerPrice : Number(productItem.price ?? 0),
    originalPrice: basePrice,
    pairOffer: enabled
      ? {
          enabled: true,
          discount_percent: discountPercent,
          offer_price: offerPrice,
          badge: offer?.badge || (discountPercent > 0 ? `AVAIL ${discountPercent}% OFF` : ''),
          note: offer?.note || ''
        }
      : null
  };
};

/* ── Star rating renderer ──────────────────────────────────────── */
const renderStars = (rating = 5) => {
  const r = Number(rating) || 0;
  const full = Math.floor(r);
  const hasHalf = r % 1 >= 0.3;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <>
      {[...Array(Math.max(0, full))].map((_, i) => <FaStar key={`f${i}`} />)}
      {hasHalf && <FaStarHalfAlt key="h" />}
      {[...Array(Math.max(0, empty))].map((_, i) => <FaRegStar key={`e${i}`} />)}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ProductDetail — Premium Desktop PDP
   ═══════════════════════════════════════════════════════════════════ */
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { openQuickView } = useQuickView();

  const pairsWellRef = useRef(null);
  const alsoLikeRef = useRef(null);

  /* ── State ─────────────────────────────────────────────────────── */
  const [product, setProduct] = useState(null);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToast, setAddedToast] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ── Fetch product from API ────────────────────────────────────── */
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setNotFound(false);
      setQuantity(1);
      const res = await getProductById(id);
      if (res && res.success && res.data) {
        const item = res.data;
        setProduct(item);
        setSelectedColor(item.colors?.[0]?.name || '');
        setSelectedSize(item.sizes?.[0] || '');
        setSelectedImgIndex(0);

        const relRes = await getProducts();
        if (relRes && relRes.success && Array.isArray(relRes.data)) {
          const catalog = relRes.data.filter(p => p && String(p.id) !== String(item.id));
          const chosenIds = Array.isArray(item.suggested_products) ? item.suggested_products.map(String) : [];
          const pairOffers = item.pair_offers || {};
          const chosen = chosenIds
            .map(sid => catalog.find(p => String(p.id) === String(sid)))
            .map(prod => mergePairOffer(prod, pairOffers))
            .filter(Boolean);
          setSuggestedProducts(chosen.length > 0 ? chosen.slice(0, 4) : []);

          // Category-based related products for "You May Also Like"
          const related = catalog
            .filter(p => p.category === item.category && !chosenIds.includes(String(p.id)))
            .slice(0, 8);
          setRelatedProducts(related);
        }
      } else {
        setProduct(null);
        setSuggestedProducts([]);
        setRelatedProducts([]);
        setNotFound(true);
      }
      setLoading(false);
    };

    fetchProductData();

    const handleStorageChange = () => { fetchProductData(); };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('orderly_products_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderly_products_updated', handleStorageChange);
    };
  }, [id]);

  /* ── Derived values ────────────────────────────────────────────── */
  const activeProduct = product;
  const activeColorObj = activeProduct?.colors?.find(c => c && c.name === selectedColor) || activeProduct?.colors?.[0];
  const galleryImages = (activeColorObj?.images && activeColorObj.images.length > 0)
    ? activeColorObj.images
    : (activeProduct?.images && activeProduct.images.length > 0 ? activeProduct.images : []);
  const currentMainImg = galleryImages[selectedImgIndex] || galleryImages[0] || '';
  const isWishlisted = wishlist.some(item => item && String(item.id) === String(activeProduct?.id));
  const discountPercent = calculateDiscount(activeProduct?.originalPrice, activeProduct?.price);
  const stockCount = activeProduct ? getVariantStock(activeProduct, selectedColor, selectedSize) : 0;

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleAddToCart = () => {
    if (!activeProduct || stockCount <= 0) return;
    addToCart(activeProduct, selectedSize, activeColorObj, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3500);
    if (pairsWellRef.current) {
      pairsWellRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const goToPrevImage = () => setSelectedImgIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
  const goToNextImage = () => setSelectedImgIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);
  const handleQuantityChange = (delta) => setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));

  const scrollAlsoLike = (direction) => {
    if (alsoLikeRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      alsoLikeRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="text-center py-5 my-5 text-white">
        <span className="spinner-border text-danger" role="status" />
        <p className="mt-2 text-muted">Loading product details...</p>
      </div>
    );
  }

  /* ── Not Found ─────────────────────────────────────────────────── */
  if (notFound || !activeProduct) {
    return (
      <div className="text-center py-5 my-5 text-white">
        <h2>Product Not Found</h2>
        <p className="text-muted">This product is no longer available in the catalog.</p>
        <Link to="/shop" className="btn-primary-orderly mt-3">Back to Shop</Link>
      </div>
    );
  }

  const validSuggested = suggestedProducts.filter(item => item !== null && item !== undefined);
  const isMainProductInCart = cart.some(item => String(item.id) === String(activeProduct?.id));
  const alsoLikeProducts = relatedProducts.length > 0 ? relatedProducts : validSuggested;

  const tabs = [
    { key: 'description', label: 'DESCRIPTION' },
    { key: 'details', label: 'DETAILS' },
    { key: 'sizeFit', label: 'SIZE & FIT' },
    { key: 'shipping', label: 'SHIPPING & RETURNS' },
    { key: 'reviews', label: `REVIEWS (${activeProduct.reviewsCount || 0})` },
  ];

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <>
      <SEO
        title={`${activeProduct.name} | ORDERLY Menswear`}
        description={activeProduct.description}
      />

      {/* ── Mobile PDP (<= 767px) ────────────────────────────────── */}
      <div className="orderly-mobile-pdp-wrapper">
        <MobileProductDetail
          activeProduct={activeProduct}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          selectedImgIndex={selectedImgIndex}
          setSelectedImgIndex={setSelectedImgIndex}
          quantity={quantity}
          handleQuantityChange={handleQuantityChange}
          handleAddToCart={handleAddToCart}
          addToCart={addToCart}
          toggleWishlist={toggleWishlist}
          isWishlisted={isWishlisted}
          openQuickView={openQuickView}
          setShowSizeGuide={setShowSizeGuide}
          validSuggested={validSuggested}
          alsoLikeProducts={alsoLikeProducts}
          cart={cart}
          wishlist={wishlist}
        />
      </div>

      {/* ── Desktop PDP (>= 768px) ───────────────────────────────── */}
      <div className="orderly-desktop-pdp-wrapper">
        <main className="product-detail-page">
        {/* ── Toast ─────────────────────────────────────────────── */}
        {addedToast && (
          <div className="pdp-added-toast-banner">
            <FiCheck /> Item Added to Bag! Check popular picks below… <FiArrowDown />
          </div>
        )}

        {/* ── Breadcrumb ────────────────────────────────────────── */}
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <FiChevronRight />
          <Link to="/shop">Shop</Link>
          <FiChevronRight />
          <Link to={`/shop?category=${encodeURIComponent(activeProduct.category || 'All')}`}>
            {activeProduct.category}
          </Link>
          <FiChevronRight />
          <span className="pdp-crumb-current">{activeProduct.name}</span>
        </nav>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MAIN PRODUCT SECTION (Gallery + Info)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="pdp-main-section">
          {/* ── LEFT: Image Gallery ─────────────────────────────── */}
          <div className="pdp-gallery-col">
            <div className="pdp-gallery-layout">
              {/* Vertical Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="pdp-thumbs-strip">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`pdp-thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImgIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img src={img} alt={`${activeProduct.name} thumbnail ${idx + 1}`} />
                    </button>
                  ))}
                  {galleryImages.length > 4 && (
                    <button
                      type="button"
                      className="pdp-thumbs-scroll-hint"
                      onClick={goToNextImage}
                      aria-label="More images"
                    >
                      <FiArrowDown />
                    </button>
                  )}
                </div>
              )}

              {/* Main Image */}
              <div className="pdp-main-image-box">
                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <span className="pdp-discount-badge-overlay">-{discountPercent}%</span>
                )}

                {currentMainImg ? (
                  <img
                    src={currentMainImg}
                    alt={activeProduct.name}
                    className="pdp-hero-img"
                    onClick={() => setIsFullscreen(true)}
                  />
                ) : (
                  <div className="pdp-hero-img pdp-img-placeholder d-flex align-items-center justify-content-center">
                    <span className="text-muted">No Image Available</span>
                  </div>
                )}

                {/* Image Navigation Arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="pdp-img-nav pdp-img-prev"
                      onClick={goToPrevImage}
                      aria-label="Previous image"
                    >
                      <FiChevronLeft />
                    </button>
                    <button
                      type="button"
                      className="pdp-img-nav pdp-img-next"
                      onClick={goToNextImage}
                      aria-label="Next image"
                    >
                      <FiChevronRight />
                    </button>
                  </>
                )}

                {/* Fullscreen Button */}
                {currentMainImg && (
                  <button
                    type="button"
                    className="pdp-fullscreen-trigger"
                    onClick={() => setIsFullscreen(true)}
                    aria-label="View fullscreen"
                  >
                    <FiMaximize2 />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Product Information ───────────────────────── */}
          <div className="pdp-info-col">
            <div className="pdp-info-inner">
              {/* Product Title */}
              <h1 className="pdp-product-name">{activeProduct.name}</h1>

              {/* Rating & Reviews */}
              {(activeProduct.rating || activeProduct.reviewsCount) && (
                <div className="pdp-rating-row">
                  <div className="pdp-rating-stars">
                    {renderStars(activeProduct.rating || 4.8)}
                  </div>
                  <span className="pdp-rating-score">{activeProduct.rating || 4.8}</span>
                  {activeProduct.reviewsCount && (
                    <>
                      <span className="pdp-rating-count">
                        ({activeProduct.reviewsCount} Reviews)
                      </span>
                      <span className="pdp-rating-divider">|</span>
                      <button
                        type="button"
                        className="pdp-add-review-link"
                        onClick={() => setActiveTab('reviews')}
                      >
                        Add Your Review
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Price Block */}
              <div className="pdp-price-block">
                <span className="pdp-current-price">{formatPrice(activeProduct.price)}</span>
                {activeProduct.originalPrice && (
                  <span className="pdp-original-price">{formatPrice(activeProduct.originalPrice)}</span>
                )}
                {discountPercent > 0 && (
                  <span className="pdp-off-tag">{discountPercent}% OFF</span>
                )}
              </div>
              <p className="pdp-tax-note">Inclusive of all taxes</p>

              {/* Offers Section */}
              {PDP_PROMOTIONAL_OFFERS.length > 0 && (
                <div className="pdp-offers-card">
                  <div className="pdp-offers-heading">
                    <FiTag /> <span>Offers for you</span>
                  </div>
                  {PDP_PROMOTIONAL_OFFERS.map((offer, idx) => (
                    <div key={idx} className="pdp-offer-row">
                      <span className="pdp-offer-text">{offer.text}</span>
                      <div className="pdp-offer-code-row">
                        <span className="pdp-offer-code-label">Use code:</span>
                        <span className="pdp-coupon-badge">{offer.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Color Selector */}
              {activeProduct.colors && activeProduct.colors.length > 0 && (
                <div className="pdp-option-group">
                  <span className="pdp-option-label">
                    Color: <strong>{selectedColor}</strong>
                  </span>
                  <div className="pdp-color-swatches">
                    {activeProduct.colors.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`pdp-swatch ${selectedColor === color.name ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedColor(color.name);
                          setSelectedImgIndex(0);
                        }}
                        title={color.name}
                        aria-label={`Select color ${color.name}`}
                      >
                        <span className="pdp-swatch-inner" style={{ backgroundColor: color.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {activeProduct.sizes && activeProduct.sizes.length > 0 && (
                <div className="pdp-option-group">
                  <div className="pdp-size-header">
                    <span className="pdp-option-label">Size:</span>
                    <button
                      type="button"
                      className="pdp-size-guide-link"
                      onClick={() => setShowSizeGuide(true)}
                    >
                      <FiEdit3 /> Size Guide
                    </button>
                  </div>
                  <div className="pdp-size-options">
                    {activeProduct.sizes.map((sz, idx) => {
                      const szStock = getVariantStock(activeProduct, selectedColor, sz);
                      const isOut = szStock <= 0;
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`pdp-size-option ${selectedSize === sz ? 'active' : ''} ${isOut ? 'out-of-stock' : ''}`}
                          onClick={() => setSelectedSize(sz)}
                          aria-label={`Size ${sz}${isOut ? ' - out of stock' : ''}`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="pdp-stock-row">
                {stockCount > 3 ? (
                  <span className="pdp-stock-available">
                    <span className="pdp-stock-dot" /> In Stock
                    <span className="pdp-stock-ship">Ships within 24 hours</span>
                  </span>
                ) : stockCount > 0 ? (
                  <span className="pdp-stock-limited">
                    <FiAlertCircle /> Limited Stock — Only {stockCount} left!
                  </span>
                ) : (
                  <span className="pdp-stock-out">
                    <FiAlertCircle /> OUT OF STOCK FOR {selectedColor?.toUpperCase()} ({selectedSize})
                  </span>
                )}
              </div>

              {/* Quantity + CTA Row */}
              <div className="pdp-cta-row">
                <div className="pdp-qty-control">
                  <button
                    type="button"
                    className="pdp-qty-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <FiMinus />
                  </button>
                  <span className="pdp-qty-value">{quantity}</span>
                  <button
                    type="button"
                    className="pdp-qty-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 10 || stockCount <= 0}
                    aria-label="Increase quantity"
                  >
                    <FiPlus />
                  </button>
                </div>

                <button
                  type="button"
                  className={`pdp-add-cart-btn ${stockCount <= 0 ? 'disabled' : ''}`}
                  onClick={handleAddToCart}
                  disabled={stockCount <= 0}
                >
                  <FiShoppingBag />
                  {stockCount > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
                </button>

                <button
                  type="button"
                  className={`pdp-action-icon-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={() => toggleWishlist(activeProduct)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  title={isWishlisted ? 'Wishlisted' : 'Save'}
                >
                  <FiHeart />
                </button>
              </div>

              {/* Trust & Service Strip */}
              <div className="pdp-trust-strip">
                <div className="pdp-trust-item">
                  <FiShield className="pdp-trust-icon" />
                  <div>
                    <strong>100% Original</strong>
                    <span>Products</span>
                  </div>
                </div>
                <div className="pdp-trust-item">
                  <FiRefreshCw className="pdp-trust-icon" />
                  <div>
                    <strong>Easy 7 Days</strong>
                    <span>Returns</span>
                  </div>
                </div>
                <div className="pdp-trust-item">
                  <FiTruck className="pdp-trust-icon" />
                  <div>
                    <strong>Free Shipping</strong>
                    <span>on orders ₹1499+</span>
                  </div>
                </div>
                <div className="pdp-trust-item">
                  <FiLock className="pdp-trust-icon" />
                  <div>
                    <strong>Secure</strong>
                    <span>Payments</span>
                  </div>
                </div>
              </div>

              {/* Pairs Well With Section (inside right column below trust strip) */}
              {validSuggested.length > 0 && (
                <div ref={pairsWellRef} className="pdp-pairs-section">
                  <div className="pdp-section-header">
                    <h3 className="pdp-section-title">PAIRS WELL WITH</h3>
                    <Link to="/shop" className="pdp-view-all-link">View All</Link>
                  </div>
                  <div className="pdp-pairs-grid">
                    {validSuggested.slice(0, 2).map((item, idx) => (
                      <div key={item.id || idx} className="pdp-pair-card">
                        <div className="pdp-pair-img-wrap">
                          {getSafeProductImage(item) ? (
                            <img src={getSafeProductImage(item)} alt={item.name || 'Product'} />
                          ) : (
                            <div className="pdp-pair-img-placeholder">
                              <span>No Image</span>
                            </div>
                          )}
                          {item.pairOffer?.badge && (
                            <span className="pdp-pair-badge">{item.pairOffer.badge}</span>
                          )}
                        </div>
                        <div className="pdp-pair-info">
                          <h5 className="pdp-pair-name">{item.name}</h5>
                          <div className="pdp-pair-price">
                            {item.pairOffer ? (
                              <>
                                <span className="pdp-pair-from">offer </span>
                                <strong>{formatPrice(item.price)}</strong>
                                {Number(item.originalPrice || 0) > Number(item.price || 0) && (
                                  <span className="pdp-pair-old">{formatPrice(item.originalPrice)}</span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="pdp-pair-from">from </span>
                                <strong>{formatPrice(item.price)}</strong>
                              </>
                            )}
                          </div>
                          {item.pairOffer?.note && (
                            <div className="pdp-pair-note">{item.pairOffer.note}</div>
                          )}
                          {item.rating && (
                            <div className="pdp-pair-rating">
                              <span className="pdp-pair-stars">{renderStars(item.rating)}</span>
                              <span className="pdp-pair-count">({item.reviewsCount || 0})</span>
                            </div>
                          )}
                          <div className="pdp-pair-actions">
                            <button
                              type="button"
                              className="pdp-pair-quick-view"
                              onClick={() => openQuickView(item)}
                            >
                              <FiEye /> QUICK VIEW
                            </button>
                            <button
                              type="button"
                              className={`pdp-pair-add-btn ${!isMainProductInCart ? 'disabled' : ''}`}
                              disabled={!isMainProductInCart}
                              onClick={() => {
                                if (!isMainProductInCart) return;
                                if (item.colors?.length > 1 || item.sizes?.length > 1) {
                                  openQuickView(item);
                                } else {
                                  const offerPrice = item.pairOffer?.enabled ? Number(item.pairOffer.offer_price || item.price || 0) : Number(item.price || 0);
                                  const originalPrice = item.pairOffer?.enabled
                                    ? Number(item.originalPrice || item.original_price || item.price || 0)
                                    : Number(item.originalPrice || item.original_price || 0);
                                  addToCart({
                                    id: item.id,
                                    name: item.name,
                                    price: offerPrice,
                                    originalPrice,
                                    pairOffer: item.pairOffer || null,
                                    isPairOffer: Boolean(item.pairOffer?.enabled),
                                    image: getSafeProductImage(item),
                                    quantity: 1,
                                    selectedColor: item.colors?.[0]?.name || 'Standard',
                                    selectedSize: item.sizes?.[0] || 'M'
                                  });
                                }
                              }}
                              title={!isMainProductInCart ? 'Add main item to bag first' : 'Add to Bag'}
                            >
                              <FiShoppingBag />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TABS SECTION (FULL WIDTH)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="pdp-content-section">
          {/* Tab Navigation */}
          <div className="pdp-tabs-nav">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`pdp-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panel (Full Width) */}
          <div className="pdp-tab-panel pdp-tab-panel-fullwidth">
            {/* Description */}
            {activeTab === 'description' && (
              <div className="pdp-desc-content">
                {activeProduct.description && (
                  <p className="pdp-desc-text">{activeProduct.description}</p>
                )}
                {activeProduct.specifications && activeProduct.specifications.length > 0 && (
                  <ul className="pdp-desc-features">
                    {activeProduct.specifications.slice(0, 6).map((spec, i) => (
                      <li key={i}>{spec.value || spec.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Details / Specifications */}
            {activeTab === 'details' && (
              <div className="pdp-specs-content">
                {activeProduct.specifications && activeProduct.specifications.length > 0 ? (
                  <div className="pdp-specs-grid">
                    {activeProduct.specifications.map((spec, i) => (
                      <div key={i} className="pdp-spec-row">
                        <span className="pdp-spec-label">{spec.label}</span>
                        <span className="pdp-spec-value">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No specifications available for this product.</p>
                )}
              </div>
            )}

            {/* Size & Fit */}
            {activeTab === 'sizeFit' && (
              <div className="pdp-size-fit-content">
                <p className="pdp-desc-text">Refer to the size chart below for accurate measurements. For the best fit, we recommend measuring yourself and comparing with the chart.</p>
                <table className="pdp-size-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Chest (in)</th>
                      <th>Waist (in)</th>
                      <th>Length (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>S</td><td>38"</td><td>30"</td><td>27"</td></tr>
                    <tr><td>M</td><td>40"</td><td>32"</td><td>28"</td></tr>
                    <tr><td>L</td><td>42"</td><td>34"</td><td>29"</td></tr>
                    <tr><td>XL</td><td>44"</td><td>36"</td><td>30"</td></tr>
                    <tr><td>XXL</td><td>46"</td><td>38"</td><td>31"</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Shipping & Returns */}
            {activeTab === 'shipping' && (
              <div className="pdp-shipping-content">
                <h4>Shipping</h4>
                <ul className="pdp-desc-features">
                  <li>Free standard shipping on orders above ₹1,499</li>
                  <li>Standard delivery within 5–7 business days</li>
                  <li>Express delivery available at checkout</li>
                  <li>Orders placed before 2 PM are shipped the same day</li>
                </ul>
                <h4 style={{ marginTop: '20px' }}>Returns & Exchanges</h4>
                <ul className="pdp-desc-features">
                  <li>Easy returns within 7 days of delivery</li>
                  <li>Product must be unused with original tags attached</li>
                  <li>Refund processed within 5–7 business days</li>
                  <li>Exchange subject to product availability</li>
                </ul>
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="pdp-reviews-content">
                <div className="pdp-reviews-summary">
                  <div className="pdp-reviews-big-score">
                    <span className="pdp-reviews-number">{activeProduct.rating || 4.8}</span>
                    <span className="pdp-reviews-outof">/5</span>
                  </div>
                  <div className="pdp-reviews-stars-large">
                    {renderStars(activeProduct.rating || 4.8)}
                  </div>
                  <p className="pdp-reviews-total">
                    Based on {activeProduct.reviewsCount || 0} customer reviews
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            YOU MAY ALSO LIKE — Full Width Section
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {alsoLikeProducts.length > 0 && (
          <section className="pdp-also-like-section pdp-also-like-fullwidth">
            <div className="pdp-section-header">
              <h3 className="pdp-section-title">YOU MAY ALSO LIKE</h3>
              <Link to="/shop" className="pdp-view-all-link">View All</Link>
            </div>
            <div className="pdp-also-like-wrapper">
              {alsoLikeProducts.length > 4 && (
                <button
                  type="button"
                  className="pdp-carousel-nav pdp-carousel-prev"
                  onClick={() => scrollAlsoLike('left')}
                  aria-label="Scroll left"
                >
                  <FiChevronLeft />
                </button>
              )}
              <div className="pdp-also-like-track" ref={alsoLikeRef}>
                {alsoLikeProducts.map(rel => (
                  <div key={rel.id} className="pdp-also-like-card">
                    <ProductCard product={rel} />
                  </div>
                ))}
              </div>
              {alsoLikeProducts.length > 4 && (
                <button
                  type="button"
                  className="pdp-carousel-nav pdp-carousel-next"
                  onClick={() => scrollAlsoLike('right')}
                  aria-label="Scroll right"
                >
                  <FiChevronRight />
                </button>
              )}
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FULLSCREEN IMAGE MODAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isFullscreen && currentMainImg && (
          <div className="pdp-fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
            <button
              type="button"
              className="pdp-fullscreen-close"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen"
            >
              <FiX />
            </button>
            <img
              src={currentMainImg}
              alt={activeProduct.name}
              className="pdp-fullscreen-image"
              onClick={(e) => e.stopPropagation()}
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="pdp-fs-nav pdp-fs-prev"
                  onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
                  aria-label="Previous image"
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  className="pdp-fs-nav pdp-fs-next"
                  onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                  aria-label="Next image"
                >
                  <FiChevronRight />
                </button>
              </>
            )}
            <div className="pdp-fs-counter">
              {selectedImgIndex + 1} / {galleryImages.length}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SIZE GUIDE MODAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {showSizeGuide && (
          <div className="pdp-size-modal-overlay" onClick={() => setShowSizeGuide(false)}>
            <div className="pdp-size-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="pdp-size-modal-header">
                <h3>Size Chart Guide</h3>
                <button
                  type="button"
                  className="pdp-modal-close-btn"
                  onClick={() => setShowSizeGuide(false)}
                >
                  <FiX />
                </button>
              </div>
              <table className="pdp-size-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (Inches)</th>
                    <th>Waist (Inches)</th>
                    <th>Length (Inches)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>38"</td><td>30"</td><td>27"</td></tr>
                  <tr><td>M</td><td>40"</td><td>32"</td><td>28"</td></tr>
                  <tr><td>L</td><td>42"</td><td>34"</td><td>29"</td></tr>
                  <tr><td>XL</td><td>44"</td><td>36"</td><td>30"</td></tr>
                  <tr><td>XXL</td><td>46"</td><td>38"</td><td>31"</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  </>
);
};

export default ProductDetail;
