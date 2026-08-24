import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHeart, FiShoppingBag, FiShield, FiRefreshCw, FiChevronRight,
  FiCheck, FiAlertCircle, FiEye, FiChevronLeft,
  FiMaximize2, FiMinus, FiPlus, FiTruck, FiLock, FiX, FiTag,
  FiChevronDown, FiEdit3,
  FiCheckCircle, FiGift
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import ProductCard from './ProductCard';
import { formatPrice, calculateDiscount } from '../../utils/formatters';
import { getVariantStock } from '../../pages/ProductDetail';
import { getActiveCoupons } from '../../services/api';
import MobileHeader from '../common/MobileHeader';
import MobileMenu from '../common/MobileMenu';
import MobileFooterAccordion from '../common/MobileFooterAccordion';

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

const getSafeProductImage = (item) => {
  if (item && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0];
  }
  if (item && Array.isArray(item.colors) && item.colors[0] && Array.isArray(item.colors[0].images) && item.colors[0].images[0]) {
    return item.colors[0].images[0];
  }
  return '';
};

const MobileProductDetail = ({
  activeProduct,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  selectedImgIndex,
  setSelectedImgIndex,
  quantity,
  handleQuantityChange,
  handleAddToCart,
  addToCart,
  toggleWishlist,
  isWishlisted,
  openQuickView,
  setShowSizeGuide,
  validSuggested,
  alsoLikeProducts,
  cart,
  isMainProductInCart = false,
  mainReqToast = null,
  selectedPairMap = {},
  updatePairVariant,
  pairOfferPercent = 25
}) => {
  /* ── Accordion States ──────────────────────────────────────────── */
  const [openAccordions, setOpenAccordions] = useState({
    description: true,
    details: false,
    sizeFit: false,
    shipping: false,
    reviews: false
  });

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  /* ── Add main to cart + auto-scroll to Pair Well With section ──── */
  const handleAddMainToCart = () => {
    handleAddToCart();
    setTimeout(() => {
      if (pairsWellRef.current) {
        pairsWellRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 400);
  };

  /* ── Fullscreen modal ──────────────────────────────────────────── */
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ── Compare State (Local UI feedback) ─────────────────────────── */
  const [isCompared, setIsCompared] = useState(false);

  /* ── Active coupons (admin-managed, show_on_pdp) ───────────────── */
  const [mPdpCoupons, setMPdpCoupons] = useState([]);

  useEffect(() => {
    const loadCoupons = async () => {
      const res = await getActiveCoupons();
      if (res && res.success && Array.isArray(res.data)) {
        setMPdpCoupons(res.data.filter(c => c.show_on_pdp !== false));
      } else {
        setMPdpCoupons([]);
      }
    };
    loadCoupons();

    const handleCouponsUpdated = () => loadCoupons();
    window.addEventListener('orderly_coupons_updated', handleCouponsUpdated);
    window.addEventListener('storage', handleCouponsUpdated);
    return () => {
      window.removeEventListener('orderly_coupons_updated', handleCouponsUpdated);
      window.removeEventListener('storage', handleCouponsUpdated);
    };
  }, []);

  /* ── Sticky Purchase Bar Visibility ────────────────────────────── */
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mainCtaRef = useRef(null);
  const pairsWellRef = useRef(null);
  const alsoLikeRef = useRef(null);

  /* Touch Gesture State for Main Image ───────────────────────────── */
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  /* Size-wise price helpers */
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

  const activeColorObj = activeProduct?.colors?.find(c => c && c.name === selectedColor) || activeProduct?.colors?.[0];
  const galleryImages = (activeColorObj?.images && activeColorObj.images.length > 0)
    ? activeColorObj.images
    : (activeProduct?.images && activeProduct.images.length > 0 ? activeProduct.images : []);
  const currentMainImg = galleryImages[selectedImgIndex] || galleryImages[0] || '';
  const currentPrice = getSizePrice(activeProduct, selectedSize);
  const currentOriginalPrice = getSizeOriginalPrice(activeProduct, selectedSize, currentPrice);
  const discountPercent = calculateDiscount(currentOriginalPrice, currentPrice);
  const stockCount = activeProduct ? getVariantStock(activeProduct, selectedColor, selectedSize) : 0;

  const goToPrevImage = () => setSelectedImgIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
  const goToNextImage = () => setSelectedImgIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe) {
      goToNextImage();
    } else if (isRightSwipe) {
      goToPrevImage();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  /* Sticky bar scroll observer */
  useEffect(() => {
    const handleScroll = () => {
      if (mainCtaRef.current) {
        const rect = mainCtaRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="orderly-mobile-pdp">
      {/* ── 0. ANNOUNCEMENT BAR & MOBILE HEADER ───────────────────── */}
      <div className="mobile-announcement-bar">
        Free Shipping on Orders Above <span className="mobile-announcement-highlight">₹1499</span> | Easy 7 Days Returns
      </div>

      <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {mainReqToast && (
        <div className="m-pdp-main-req-toast">
          <FiAlertCircle /> {mainReqToast}
        </div>
      )}

      {/* ── 1. BREADCRUMB ────────────────────────────────────────── */}
      <nav className="m-pdp-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <FiChevronRight />
        <Link to="/shop">Shop</Link>
        <FiChevronRight />
        <Link to={`/shop?category=${encodeURIComponent(activeProduct.category || 'All')}`}>
          {activeProduct.category}
        </Link>
        <FiChevronRight />
        <span className="m-pdp-crumb-active">{activeProduct.name}</span>
      </nav>

      {/* ── 2. PRODUCT IMAGE GALLERY ─────────────────────────────── */}
      <section className="m-pdp-gallery-section">
        <div
          className="m-pdp-main-image-box"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Discount Badge */}
          {discountPercent > 0 && (
            <span className="m-pdp-discount-badge">-{discountPercent}%</span>
          )}

          {/* Wishlist Button Overlay */}
          <button
            type="button"
            className={`m-pdp-wishlist-overlay-btn ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(activeProduct);
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <FiHeart />
          </button>

          {/* Main Image */}
          {currentMainImg ? (
            <img
              src={currentMainImg}
              alt={activeProduct.name}
              className="m-pdp-hero-img"
              onClick={() => setIsFullscreen(true)}
            />
          ) : (
            <div className="m-pdp-hero-placeholder">No Image Available</div>
          )}

          {/* Prev/Next Touch Arrows */}
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                className="m-pdp-img-arrow m-pdp-arrow-left"
                onClick={goToPrevImage}
                aria-label="Previous image"
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                className="m-pdp-img-arrow m-pdp-arrow-right"
                onClick={goToNextImage}
                aria-label="Next image"
              >
                <FiChevronRight />
              </button>
            </>
          )}

          {/* Fullscreen Trigger */}
          {currentMainImg && (
            <button
              type="button"
              className="m-pdp-fullscreen-btn"
              onClick={() => setIsFullscreen(true)}
              aria-label="Fullscreen view"
            >
              <FiMaximize2 />
            </button>
          )}
        </div>

        {/* Horizontal Thumbnails Strip */}
        {galleryImages.length > 1 && (
          <div className="m-pdp-thumbs-strip">
            {galleryImages.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`m-pdp-thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                onClick={() => setSelectedImgIndex(idx)}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} />
              </button>
            ))}
            {galleryImages.length > 4 && (
              <button
                type="button"
                className={`m-pdp-thumb-btn m-pdp-thumb-more ${selectedImgIndex >= 4 ? 'active' : ''}`}
                onClick={() => setSelectedImgIndex(4)}
              >
                <img src={galleryImages[4]} alt="More thumbnails" />
                <span className="m-pdp-thumb-more-overlay">+{galleryImages.length - 4}</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── 3. PRODUCT TITLE ─────────────────────────────────────── */}
      <h1 className="m-pdp-product-name">{activeProduct.name}</h1>

      {/* ── 4. RATING ────────────────────────────────────────────── */}
      {(activeProduct.rating || activeProduct.reviewsCount) && (
        <div className="m-pdp-rating-row">
          <div className="m-pdp-rating-stars">
            {renderStars(activeProduct.rating || 4.8)}
          </div>
          <span className="m-pdp-rating-count">
            ({activeProduct.reviewsCount || 128} Reviews)
          </span>
          <span className="m-pdp-rating-divider">|</span>
          <button
            type="button"
            className="m-pdp-add-review-link"
            onClick={() => setOpenAccordions(prev => ({ ...prev, reviews: true }))}
          >
            Add Your Review
          </button>
        </div>
      )}

      {/* ── 5. PRICE SECTION ─────────────────────────────────────── */}
      <div className="m-pdp-price-row">
        <span className="m-pdp-price-current">{formatPrice(currentPrice)}</span>
        {currentOriginalPrice && Number(currentOriginalPrice) > Number(currentPrice) && (
          <span className="m-pdp-price-original">{formatPrice(currentOriginalPrice)}</span>
        )}
        {discountPercent > 0 && (
          <span className="m-pdp-discount-tag">{discountPercent}% OFF</span>
        )}
      </div>
      <p className="m-pdp-tax-note">Inclusive of all taxes</p>

      {/* ── 6. OFFERS FOR YOU ────────────────────────────────────── */}
      {mPdpCoupons.length > 0 && (
        <div className="m-pdp-offers-box">
          <div className="m-pdp-offers-header">
            <FiTag className="m-pdp-tag-icon" />
            <span>Offers for you</span>
          </div>
          {mPdpCoupons.map((offer, idx) => (
            <div key={offer.id || idx} className="m-pdp-offer-item">
              <span className="m-pdp-offer-text">{offer.description || `${offer.discount_type === 'percentage' ? offer.discount_value + '% off' : '₹' + offer.discount_value + ' off'} on orders above ₹${Number(offer.min_order || 0).toLocaleString('en-IN')}`}</span>
              <div className="m-pdp-offer-code-row">
                <span className="m-pdp-code-lbl">Use code:</span>
                <span className="m-pdp-code-badge">{offer.code}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 7. COLOR SELECTOR ────────────────────────────────────── */}
      {activeProduct.colors && activeProduct.colors.length > 0 && (
        <div className="m-pdp-option-group">
          <span className="m-pdp-option-label">
            Color: <strong>{selectedColor}</strong>
          </span>
          <div className="m-pdp-color-swatches">
            {activeProduct.colors.map((color, idx) => (
              <button
                key={idx}
                type="button"
                className={`m-pdp-swatch-btn ${selectedColor === color.name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedColor(color.name);
                  setSelectedImgIndex(0);
                }}
                aria-label={`Color ${color.name}`}
              >
                <span className="m-pdp-swatch-circle" style={{ backgroundColor: color.hex }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. SIZE SELECTOR ─────────────────────────────────────── */}
      {activeProduct.sizes && activeProduct.sizes.length > 0 && (
        <div className="m-pdp-option-group">
          <div className="m-pdp-size-header">
            <span className="m-pdp-option-label">Size:</span>
            <button
              type="button"
              className="m-pdp-size-guide-btn"
              onClick={() => setShowSizeGuide(true)}
            >
              <FiEdit3 /> Size Guide
            </button>
          </div>
          <div className="m-pdp-size-pills">
            {activeProduct.sizes.map((sz, idx) => {
              const szStock = getVariantStock(activeProduct, selectedColor, sz);
              const isOut = szStock <= 0;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`m-pdp-size-pill ${selectedSize === sz ? 'active' : ''} ${isOut ? 'out-of-stock' : ''}`}
                  onClick={() => setSelectedSize(sz)}
                  aria-label={`Size ${sz}`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 9. INVENTORY STATUS ──────────────────────────────────── */}
      <div className="m-pdp-stock-row">
        {stockCount > 0 ? (
          <span className="m-pdp-stock-in">
            <span className="m-pdp-green-dot" /> In Stock
            <span className="m-pdp-stock-ship"> — Ships within 24 hours</span>
          </span>
        ) : (
          <span className="m-pdp-stock-out">
            <FiAlertCircle /> OUT OF STOCK FOR {selectedColor?.toUpperCase()} ({selectedSize})
          </span>
        )}
      </div>

      {/* ── 10. QUANTITY + ADD TO CART ───────────────────────────── */}
      <div className="m-pdp-cta-container" ref={mainCtaRef}>
        <div className="m-pdp-qty-stepper">
          <button
            type="button"
            className="m-pdp-qty-btn"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <FiMinus />
          </button>
          <span className="m-pdp-qty-num">{quantity}</span>
          <button
            type="button"
            className="m-pdp-qty-btn"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= 10 || stockCount <= 0}
          >
            <FiPlus />
          </button>
        </div>

        <button
          type="button"
          className={`m-pdp-add-cart-btn ${stockCount <= 0 ? 'disabled' : ''}`}
          onClick={handleAddMainToCart}
          disabled={stockCount <= 0}
        >
          <FiShoppingBag />
          {stockCount > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
        </button>
      </div>

      {/* ── 12. TRUST / SERVICE STRIP ────────────────────────────── */}
      <div className="m-pdp-trust-strip">
        <div className="m-pdp-trust-card">
          <FiShield className="m-pdp-t-icon" />
          <div>
            <strong>100% ORIGINAL</strong>
            <span>PRODUCTS</span>
          </div>
        </div>
        <div className="m-pdp-trust-card">
          <FiRefreshCw className="m-pdp-t-icon" />
          <div>
            <strong>EASY 7 DAYS</strong>
            <span>RETURNS</span>
          </div>
        </div>
        <div className="m-pdp-trust-card">
          <FiTruck className="m-pdp-t-icon" />
          <div>
            <strong>FREE SHIPPING</strong>
            <span>ON ORDERS ₹1499+</span>
          </div>
        </div>
        <div className="m-pdp-trust-card">
          <FiLock className="m-pdp-t-icon" />
          <div>
            <strong>SECURE</strong>
            <span>PAYMENTS</span>
          </div>
        </div>
      </div>

      {/* ── 13. PRODUCT TABS / INFORMATION ACCORDIONS ─────────────── */}
      <div className="m-pdp-accordions-group">
        {/* Accordion 1: Description */}
        <div className="m-pdp-accordion-item">
          <button
            type="button"
            className="m-pdp-accordion-header"
            onClick={() => toggleAccordion('description')}
          >
            <span>DESCRIPTION</span>
            <FiChevronDown className={`m-pdp-acc-arrow ${openAccordions.description ? 'open' : ''}`} />
          </button>
          {openAccordions.description && (
            <div className="m-pdp-accordion-body">
              {activeProduct.description && (
                <p className="m-pdp-desc-text">{activeProduct.description}</p>
              )}
              <ul className="m-pdp-desc-list">
                <li>Premium quality fabric</li>
                <li>Slim fit design</li>
                <li>Full sleeves with button cuffs</li>
                <li>Classic collar</li>
                <li>Easy to iron</li>
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 2: Product Details */}
        <div className="m-pdp-accordion-item">
          <button
            type="button"
            className="m-pdp-accordion-header"
            onClick={() => toggleAccordion('details')}
          >
            <span>PRODUCT DETAILS</span>
            <FiChevronDown className={`m-pdp-acc-arrow ${openAccordions.details ? 'open' : ''}`} />
          </button>
          {openAccordions.details && (
            <div className="m-pdp-accordion-body">
              {activeProduct.specifications && activeProduct.specifications.length > 0 ? (
                <div className="m-pdp-specs-list">
                  {activeProduct.specifications.map((spec, i) => (
                    <div key={i} className="m-pdp-spec-row">
                      <span className="m-pdp-spec-k">{spec.label}</span>
                      <span className="m-pdp-spec-v">{spec.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small">Standard premium menswear specifications apply.</p>
              )}
            </div>
          )}
        </div>

        {/* Accordion 3: Size & Fit */}
        <div className="m-pdp-accordion-item">
          <button
            type="button"
            className="m-pdp-accordion-header"
            onClick={() => toggleAccordion('sizeFit')}
          >
            <span>SIZE & FIT</span>
            <FiChevronDown className={`m-pdp-acc-arrow ${openAccordions.sizeFit ? 'open' : ''}`} />
          </button>
          {openAccordions.sizeFit && (
            <div className="m-pdp-accordion-body">
              <p className="m-pdp-desc-text">Model is 6'1" wearing Size M. Fits true to size.</p>
              <button
                type="button"
                className="m-pdp-inline-size-guide"
                onClick={() => setShowSizeGuide(true)}
              >
                <FiEdit3 /> View Size Chart Guide
              </button>
            </div>
          )}
        </div>

        {/* Accordion 4: Shipping & Returns */}
        <div className="m-pdp-accordion-item">
          <button
            type="button"
            className="m-pdp-accordion-header"
            onClick={() => toggleAccordion('shipping')}
          >
            <span>SHIPPING & RETURNS</span>
            <FiChevronDown className={`m-pdp-acc-arrow ${openAccordions.shipping ? 'open' : ''}`} />
          </button>
          {openAccordions.shipping && (
            <div className="m-pdp-accordion-body">
              <ul className="m-pdp-desc-list">
                <li>Free standard shipping on orders above ₹1,499</li>
                <li>Standard delivery within 5–7 business days</li>
                <li>Easy returns within 7 days of delivery</li>
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 5: Ratings & Reviews */}
        <div className="m-pdp-accordion-item">
          <button
            type="button"
            className="m-pdp-accordion-header"
            onClick={() => toggleAccordion('reviews')}
          >
            <span>RATINGS & REVIEWS ({activeProduct.reviewsCount || 128})</span>
            <FiChevronDown className={`m-pdp-acc-arrow ${openAccordions.reviews ? 'open' : ''}`} />
          </button>
          {openAccordions.reviews && (
            <div className="m-pdp-accordion-body text-center py-2">
              <div className="m-pdp-big-score">{activeProduct.rating || 4.8} / 5</div>
              <div className="m-pdp-stars-lg justify-content-center d-flex gap-1 mb-2">
                {renderStars(activeProduct.rating || 4.8)}
              </div>
              <p className="small text-muted mb-0">Based on verified customer reviews</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 14. PAIRS WELL WITH ──────────────────────────────────── */}
      {validSuggested.length > 0 && (
        <section className="m-pdp-section-block">
          <div className="m-pdp-sec-head">
            <div>
              <h3 className="m-pdp-sec-title">PAIRS WELL WITH</h3>
              <span className="text-muted extra-small">
                {isMainProductInCart ? 'Curated styling suggestions' : 'Add main product first to unlock styling add-ons'}
              </span>
            </div>
            <span className={`pdp-status-pill ${isMainProductInCart ? 'unlocked' : 'locked'}`}>
              {isMainProductInCart ? <><FiCheckCircle /> Unlocked</> : <><FiLock /> Add Main First</>}
            </span>
          </div>

          {/* Dynamic Banner */}
          {!isMainProductInCart ? (
            <div className="m-pdp-pair-offer-banner locked mb-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="pdp-pair-badge-pill warning"><FiLock /> Add Main Item First</span>
                <strong className="text-warning small">Add {activeProduct.name} to Bag First</strong>
              </div>
              <p className="mb-0 text-muted extra-small">
                Add this main item to your bag above to unlock Pair Well With add-ons and get flat <strong>{pairOfferPercent}% OFF</strong>!
              </p>
            </div>
          ) : cart.filter(i => Boolean(i.isPairOffer || i.pairOffer?.enabled)).length === 0 ? (
            <div className="m-pdp-pair-offer-banner idle mb-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="pdp-pair-badge-pill"><FiTag /> Offer</span>
                <strong className="text-white small">Pair Offer: Flat {pairOfferPercent}% OFF</strong>
              </div>
              <p className="mb-0 text-muted extra-small">
                Add 2 or more styling pieces to unlock <strong>{pairOfferPercent}% OFF on all items</strong>!
              </p>
            </div>
          ) : cart.filter(i => Boolean(i.isPairOffer || i.pairOffer?.enabled)).length === 1 ? (
            <div className="m-pdp-pair-offer-banner progress-unlock mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <div className="d-flex align-items-center gap-1">
                  <span className="pdp-pair-badge-pill warning"><FiGift /> Unlock</span>
                  <strong className="text-warning extra-small">Add 1 more for {pairOfferPercent}% OFF on ALL items!</strong>
                </div>
                <span className="badge bg-warning text-dark fw-bold px-2 py-1 extra-small">1/2 Added</span>
              </div>
              <div className="pdp-pair-progress-bar-bg">
                <div className="pdp-pair-progress-bar-fill" style={{ width: '50%' }} />
              </div>
            </div>
          ) : (
            <div className="m-pdp-pair-offer-banner unlocked mb-3">
              <div className="d-flex align-items-center justify-content-between flex-nowrap gap-2">
                <div className="d-flex align-items-center gap-1 flex-nowrap text-truncate">
                  <span className="pdp-pair-badge-pill theme-active flex-shrink-0"><FiCheckCircle /> ACTIVE</span>
                  <strong className="text-white extra-small text-truncate">🎉 {pairOfferPercent}% OFF ON ALL ITEMS</strong>
                </div>
              </div>
            </div>
          )}

          <div className="m-pdp-carousel-wrapper">
            <div className="m-pdp-carousel-track" ref={pairsWellRef}>
              {validSuggested.map((item, idx) => {
                const pId = String(item.id);
                const isInCart = cart.some(i => String(i.productId || i.product_id || i.id) === pId);
                const currentSelectedSize = selectedPairMap[pId]?.selectedSize || item.sizes?.[0] || 'M';
                const mrp = Number(item.originalPrice ?? item.original_price ?? item.mrp ?? item.price ?? 0);
                const singleDiscountPercent = Number(item.pairOffer?.discount_percent ?? 20);
                const isMultiActive = cart.filter(i => Boolean(i.isPairOffer || i.pairOffer?.enabled)).length >= 2;
                const itemDiscountedPrice = isMultiActive
                  ? Math.max(0, Math.round(mrp * (1 - pairOfferPercent / 100)))
                  : Math.max(0, Math.round(mrp * (1 - singleDiscountPercent / 100)));

                return (
                  <div key={item.id || idx} className={`m-pdp-pair-card ${isInCart ? 'selected in-cart' : ''} ${!isMainProductInCart ? 'locked-card' : ''}`}>
                    <div className="m-pdp-pair-img-wrap" onClick={() => {
                      if (!isMainProductInCart) {
                        if (!mainReqToast) alert('Please add the main item to bag first!');
                        return;
                      }
                      if (isInCart) {
                        const inItem = cart.find(i => String(i.productId || i.product_id || i.id) === pId);
                        if (inItem) removeFromCart(inItem.cartItemId || inItem.id);
                      } else {
                        addToCart({ ...item, originalPrice: mrp, price: item.price || mrp, isPairOffer: true, pairParentId: activeProduct?.id ?? null }, currentSelectedSize, 'Standard', 1);
                      }
                    }}>
                      {getSafeProductImage(item) ? (
                        <img src={getSafeProductImage(item)} alt={item.name || 'Product'} />
                      ) : (
                        <div className="m-pdp-pair-placeholder">No Image</div>
                      )}
                      <span className={`m-pdp-pair-badge ${isMultiActive ? 'highlight' : ''}`}>
                        {isMultiActive ? `${pairOfferPercent}% OFF` : `${singleDiscountPercent}% OFF`}
                      </span>
                      <button
                        type="button"
                        className="m-pdp-pair-wish-btn"
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(item); }}
                        aria-label="Wishlist"
                      >
                        <FiHeart />
                      </button>
                    </div>

                    <div className="m-pdp-pair-content">
                      <h5 className="m-pdp-pair-title">{item.name}</h5>
                      <div className="m-pdp-pair-price-row">
                        <span>offer </span>
                        <strong className="m-pdp-pair-price-accent">{formatPrice(itemDiscountedPrice)}</strong>
                        {mrp > itemDiscountedPrice && (
                          <del className="m-pdp-pair-old">{formatPrice(mrp)}</del>
                        )}
                      </div>

                      {/* Size picker */}
                      {Array.isArray(item.sizes) && item.sizes.length > 0 && (
                        <div className="m-pdp-pair-variant-picker mb-1">
                          <span className="extra-small text-muted me-1">Size:</span>
                          <select 
                            className="pdp-pair-select-sm"
                            value={currentSelectedSize}
                            onChange={(e) => updatePairVariant(item.id, { selectedSize: e.target.value })}
                          >
                            {item.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="m-pdp-pair-stars-row">
                        <span className="m-pdp-stars-sm">{renderStars(item.rating || 4.8)}</span>
                        <span className="m-pdp-count-sm">({item.reviewsCount || 64})</span>
                      </div>

                      <div className="m-pdp-pair-btns">
                        <button
                          type="button"
                          className="m-pdp-pair-qv-btn"
                          onClick={() => openQuickView(item)}
                        >
                          <FiEye /> VIEW
                        </button>
                        <button
                          type="button"
                          className={`m-pdp-pair-select-toggle-btn ${isInCart ? 'active in-cart' : ''} ${!isMainProductInCart ? 'locked' : ''}`}
                          onClick={() => {
                            if (!isMainProductInCart) {
                              return;
                            }
                            if (isInCart) {
                              const inItem = cart.find(i => String(i.productId || i.product_id || i.id) === pId);
                              if (inItem) removeFromCart(inItem.cartItemId || inItem.id);
                            } else {
addToCart({ ...item, originalPrice: mrp, price: item.price || mrp, isPairOffer: true, pairParentId: activeProduct?.id ?? null }, currentSelectedSize, 'Standard', 1);
                            }
                          }}
                        >
                          {!isMainProductInCart ? <><FiLock /> Add Main</> : isInCart ? <><FiCheck /> In Bag</> : <><FiPlus /> Add to Bag</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 15. YOU MAY ALSO LIKE ────────────────────────────────── */}
      {alsoLikeProducts.length > 0 && (
        <section className="m-pdp-section-block">
          <div className="m-pdp-sec-head">
            <h3 className="m-pdp-sec-title">YOU MAY ALSO LIKE</h3>
            <Link to="/shop" className="m-pdp-sec-link">View All →</Link>
          </div>
          <div className="m-pdp-carousel-wrapper">
            <div className="m-pdp-carousel-track" ref={alsoLikeRef}>
              {alsoLikeProducts.map(rel => (
                <div key={rel.id} className="m-pdp-also-card-item">
                  <ProductCard product={rel} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 17. FULLSCREEN LIGHTBOX MODAL ────────────────────────── */}
      {isFullscreen && currentMainImg && (
        <div className="m-pdp-fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <button
            type="button"
            className="m-pdp-fullscreen-close"
            onClick={() => setIsFullscreen(false)}
          >
            <FiX />
          </button>
          <img src={currentMainImg} alt={activeProduct.name} className="m-pdp-fs-img" />
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                className="m-pdp-fs-arrow m-pdp-fs-prev"
                onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                className="m-pdp-fs-arrow m-pdp-fs-next"
                onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
              >
                <FiChevronRight />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── 17. MOBILE FOOTER ACCORDIONS ─────────────────────────── */}
      <MobileFooterAccordion />

      {/* ── 18. STICKY MOBILE PURCHASE BAR ───────────────────────── */}
      {showStickyBar && (
        <div className="m-pdp-sticky-purchase-bar">
          <div className="m-pdp-sticky-info">
            <span className="m-pdp-sticky-name">{activeProduct.name}</span>
            <span className="m-pdp-sticky-price">{formatPrice(currentPrice)}</span>
          </div>
          <button
            type="button"
            className={`m-pdp-sticky-add-btn ${stockCount <= 0 ? 'disabled' : ''}`}
            onClick={handleAddMainToCart}
            disabled={stockCount <= 0}
          >
            <FiShoppingBag />
            {stockCount > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileProductDetail;
