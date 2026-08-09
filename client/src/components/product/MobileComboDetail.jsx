import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHeart, FiShoppingBag, FiShield, FiRefreshCw, FiChevronRight,
  FiChevronLeft, FiCheck, FiAlertCircle, FiEye, FiMaximize2,
  FiMinus, FiPlus, FiTruck, FiLock, FiX, FiTag, FiChevronDown,
  FiHelpCircle, FiFileText, FiEdit3, FiStar
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { formatPrice, calculateDiscount } from '../../utils/formatters';
import { getVariantStock } from '../../pages/ProductDetail';
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

const MobileComboDetail = ({
  combo,
  relatedCombos,
  productsCatalog,
  pieceSelections,
  handleSelectColor,
  handleSelectSize,
  quantity,
  handleQuantityChange,
  handleAddToCart,
  toggleWishlist,
  isWishlisted,
  validationError,
  setShowSizeGuide
}) => {
  /* Active thumbnail index */
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /* Accordion States */
  const [openAccordions, setOpenAccordions] = useState({
    description: true,
    details: false,
    shipping: false,
    reviews: false
  });

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const mainCtaRef = useRef(null);
  const alsoLikeRef = useRef(null);

  /* Touch Gesture State for Gallery */
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const comboImages = combo.images?.length > 0 ? combo.images : [];
  const currentMainImg = comboImages[activeImgIndex] || comboImages[0] || '';
  const discountPercent = calculateDiscount(combo.original_price, combo.offer_price);

  const goToPrevImage = () => {
    if (!comboImages.length) return;
    setActiveImgIndex(prev => prev > 0 ? prev - 1 : comboImages.length - 1);
  };

  const goToNextImage = () => {
    if (!comboImages.length) return;
    setActiveImgIndex(prev => prev < comboImages.length - 1 ? prev + 1 : 0);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 40) {
      goToNextImage();
    } else if (distance < -40) {
      goToPrevImage();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  /* Sticky Bar Scroll Observer */
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
    <div className="orderly-mobile-combo-pdp">
      {/* ── 0. ANNOUNCEMENT BAR & MOBILE HEADER ───────────────────── */}
      <div className="mobile-announcement-bar">
        Free Shipping on Orders Above <span className="mobile-announcement-highlight">₹1499</span> | Easy 7 Days Returns
      </div>

      <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* ── 1. BREADCRUMB ────────────────────────────────────────── */}
      <nav className="m-c-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <FiChevronRight />
        <Link to="/combos">Combos</Link>
        <FiChevronRight />
        <span className="m-c-crumb-active">{combo.name}</span>
      </nav>

      {/* ── 2. COMBO IMAGE GALLERY ───────────────────────────────── */}
      <section className="m-c-gallery-section">
        <div
          className="m-c-main-image-box"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Discount Badge */}
          {discountPercent > 0 && (
            <span className="m-c-discount-badge">-{discountPercent}%</span>
          )}

          {/* Wishlist Overlay Button */}
          <button
            type="button"
            className={`m-c-wishlist-overlay-btn ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(combo);
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <FiHeart />
          </button>

          {/* Hero Image */}
          {currentMainImg ? (
            <img
              src={currentMainImg}
              alt={combo.name}
              className="m-c-hero-img"
              onClick={() => setIsFullscreen(true)}
            />
          ) : (
            <div className="m-c-hero-placeholder">No Image Available</div>
          )}

          {/* Prev/Next Touch Arrows */}
          {comboImages.length > 1 && (
            <>
              <button
                type="button"
                className="m-c-img-arrow m-c-arrow-left"
                onClick={goToPrevImage}
                aria-label="Previous image"
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                className="m-c-img-arrow m-c-arrow-right"
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
              className="m-c-fullscreen-btn"
              onClick={() => setIsFullscreen(true)}
              aria-label="Fullscreen view"
            >
              <FiMaximize2 />
            </button>
          )}
        </div>

        {/* Horizontal Thumbnails Strip */}
        {comboImages.length > 1 && (
          <div className="m-c-thumbs-strip">
            {comboImages.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`m-c-thumb-btn ${activeImgIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveImgIndex(idx)}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} />
              </button>
            ))}
            {comboImages.length > 5 && (
              <button
                type="button"
                className={`m-c-thumb-btn m-c-thumb-more ${activeImgIndex >= 5 ? 'active' : ''}`}
                onClick={() => setActiveImgIndex(5)}
              >
                <img src={comboImages[5]} alt="More thumbnails" />
                <span className="m-c-thumb-more-overlay">+{comboImages.length - 5}</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── 3. COMBO NAME ────────────────────────────────────────── */}
      <h1 className="m-c-combo-title">{combo.name}</h1>

      {/* ── 4. RATING ────────────────────────────────────────────── */}
      <div className="m-c-rating-row">
        <div className="m-c-rating-stars">
          {renderStars(combo.rating || 4.9)}
        </div>
        <span className="m-c-rating-count">({combo.reviewsCount || 236} Reviews)</span>
        <span className="m-c-rating-divider">|</span>
        <button
          type="button"
          className="m-c-add-review-link"
          onClick={() => setOpenAccordions(prev => ({ ...prev, reviews: true }))}
        >
          Add Your Review
        </button>
      </div>

      {/* ── 5. PRICE & DISCOUNT ──────────────────────────────────── */}
      <div className="m-c-price-row">
        <span className="m-c-price-current">{formatPrice(combo.offer_price)}</span>
        {combo.original_price && (
          <span className="m-c-price-original">{formatPrice(combo.original_price)}</span>
        )}
        {discountPercent > 0 && (
          <span className="m-c-discount-tag">{discountPercent}% OFF</span>
        )}
      </div>
      <p className="m-c-tax-note">Inclusive of all taxes</p>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="m-c-validation-alert">
          <FiAlertCircle />
          <span>{validationError}</span>
        </div>
      )}

      {/* ── 6. COMBO INCLUDES (Summary Card) ─────────────────────── */}
      <div className="m-c-includes-card">
        <div className="m-c-includes-header">
          <FiTag className="m-c-tag-icon" />
          <span>Combo Includes ({combo.items?.length || combo.pieces_count || 5} Items)</span>
        </div>
        <div className="m-c-includes-list">
          {combo.items?.map((item, idx) => {
            const sel = pieceSelections[item.pieceIndex] || {};
            const targetProd = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
            const itemImg = item.image || (targetProd && targetProd.images?.[0]) || combo.images?.[idx] || '';

            return (
              <div key={item.pieceIndex || idx} className="m-c-includes-item">
                <div className="m-c-item-thumb">
                  {itemImg ? <img src={itemImg} alt={item.name} /> : <div className="m-c-item-thumb-placeholder" />}
                </div>
                <div className="m-c-item-info">
                  <h4 className="m-c-item-name">{item.name}</h4>
                  <div className="m-c-item-sub">
                    <span>Size: <strong>{sel.size || 'M'}</strong></span>
                    <span className="m-c-sub-sep">|</span>
                    <span>Qty: <strong>1</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 7. SELECT OPTIONS FOR EACH ITEM (Mobile Customizer) ──── */}
      <div className="m-c-customizer-section">
        <h3 className="m-c-customizer-title">Select Options for Each Item</h3>
        <div className="m-c-customizer-list">
          {combo.items?.map((item, idx) => {
            const sel = pieceSelections[item.pieceIndex] || {};
            const targetProd = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
            const itemImg = item.image || (targetProd && targetProd.images?.[0]) || combo.images?.[idx] || '';

            const isTrousersOrJeans = item.name.toLowerCase().includes('trouser') || item.name.toLowerCase().includes('pant') || item.name.toLowerCase().includes('jean') || item.name.toLowerCase().includes('chino');
            const isShoes = item.name.toLowerCase().includes('shoe') || item.name.toLowerCase().includes('oxford') || item.name.toLowerCase().includes('boot') || item.name.toLowerCase().includes('loafer');

            const defaultSizes = isTrousersOrJeans
              ? ['30', '32', '34', '36', '38']
              : isShoes
              ? ['7', '8', '9', '10', '11']
              : ['S', 'M', 'L', 'XL', 'XXL'];

            const availableSizes = item.sizes?.length > 0 ? item.sizes : defaultSizes;

            return (
              <div key={item.pieceIndex || idx} className="m-c-custom-card">
                <div className="m-c-card-top">
                  <div className="m-c-card-thumb">
                    {itemImg ? <img src={itemImg} alt={item.name} /> : <div className="m-c-item-thumb-placeholder" />}
                  </div>
                  <h4 className="m-c-card-name">{item.name}</h4>
                </div>

                <div className="m-c-card-options">
                  <div className="m-c-size-row-label">
                    <span>{isTrousersOrJeans ? 'Waist Size:' : isShoes ? 'Shoe Size (UK):' : 'Size:'}</span>
                    <strong>{sel.size || 'M'}</strong>
                  </div>

                  <div className="m-c-size-pills">
                    {availableSizes.map((sz, sIdx) => {
                      const szStock = targetProd ? getVariantStock(targetProd, sel.color, sz) : 10;
                      const isOut = szStock <= 0;
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          className={`m-c-size-pill ${sel.size === sz ? 'active' : ''} ${isOut ? 'out-of-stock' : ''}`}
                          onClick={() => handleSelectSize(item.pieceIndex, sz)}
                          disabled={isOut}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 8. STOCK STATUS ──────────────────────────────────────── */}
      <div className="m-c-stock-row">
        <span className="m-c-stock-in">
          <span className="m-c-green-dot" /> In Stock — Ships within 24 hours
        </span>
      </div>

      {/* ── 9. QUANTITY & PRIMARY CTA ────────────────────────────── */}
      <div className="m-c-cta-container" ref={mainCtaRef}>
        <div className="m-c-qty-stepper">
          <button
            type="button"
            className="m-c-qty-btn"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <FiMinus />
          </button>
          <span className="m-c-qty-num">{quantity}</span>
          <button
            type="button"
            className="m-c-qty-btn"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= 10}
          >
            <FiPlus />
          </button>
        </div>

        <button
          type="button"
          className="m-c-add-cart-btn"
          onClick={handleAddToCart}
        >
          <FiShoppingBag /> ADD TO CART
        </button>
      </div>

      {/* ── 10. WISHLIST & COMPARE ───────────────────────────────── */}
      <div className="m-c-secondary-actions">
        <button
          type="button"
          className={`m-c-sec-btn ${isWishlisted ? 'active' : ''}`}
          onClick={() => toggleWishlist(combo)}
        >
          <FiHeart /> {isWishlisted ? 'WISHLISTED' : 'WISHLIST'}
        </button>
        <button
          type="button"
          className={`m-c-sec-btn ${isCompared ? 'active' : ''}`}
          onClick={() => setIsCompared(prev => !prev)}
        >
          <FiRefreshCw /> {isCompared ? 'COMPARING' : 'COMPARE'}
        </button>
      </div>

      {/* ── 11. PRODUCT INFORMATION ACCORDIONS ───────────────────── */}
      <div className="m-c-accordions-group">
        {/* Description */}
        <div className="m-c-accordion-item">
          <button
            type="button"
            className="m-c-accordion-header"
            onClick={() => toggleAccordion('description')}
          >
            <span>DESCRIPTION</span>
            <FiChevronDown className={`m-c-acc-arrow ${openAccordions.description ? 'open' : ''}`} />
          </button>
          {openAccordions.description && (
            <div className="m-c-accordion-body">
              <p className="m-c-desc-text">
                {combo.description || 'Step into confidence with our Midnight Formal Combo. A perfectly curated set of essentials that brings sophistication, comfort, and style together.'}
              </p>
              <ul className="m-c-desc-list">
                <li>Premium fabrics for all-day comfort</li>
                <li>Perfect for office, meetings & formal events</li>
                <li>Tailored fit for a sharp look</li>
                <li>Handpicked matching pieces</li>
                <li>Best value — Save more with combos</li>
              </ul>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="m-c-accordion-item">
          <button
            type="button"
            className="m-c-accordion-header"
            onClick={() => toggleAccordion('details')}
          >
            <span>DETAILS</span>
            <FiChevronDown className={`m-c-acc-arrow ${openAccordions.details ? 'open' : ''}`} />
          </button>
          {openAccordions.details && (
            <div className="m-c-accordion-body">
              <div className="m-c-specs-list">
                <div className="m-c-spec-row">
                  <span className="m-c-spec-k">Combo Items</span>
                  <span className="m-c-spec-v">{combo.items?.length || combo.pieces_count || 5} Pieces</span>
                </div>
                <div className="m-c-spec-row">
                  <span className="m-c-spec-k">Category</span>
                  <span className="m-c-spec-v">Formal / Business Essentials</span>
                </div>
                <div className="m-c-spec-row">
                  <span className="m-c-spec-k">Care</span>
                  <span className="m-c-spec-v">Dry Clean Recommended</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Returns */}
        <div className="m-c-accordion-item">
          <button
            type="button"
            className="m-c-accordion-header"
            onClick={() => toggleAccordion('shipping')}
          >
            <span>SHIPPING & RETURNS</span>
            <FiChevronDown className={`m-c-acc-arrow ${openAccordions.shipping ? 'open' : ''}`} />
          </button>
          {openAccordions.shipping && (
            <div className="m-c-accordion-body">
              <ul className="m-c-desc-list">
                <li>Free standard shipping on orders above ₹1,499</li>
                <li>Standard delivery within 5–7 business days</li>
                <li>Easy 7 days return & exchange policy</li>
              </ul>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="m-c-accordion-item">
          <button
            type="button"
            className="m-c-accordion-header"
            onClick={() => toggleAccordion('reviews')}
          >
            <span>RATINGS & REVIEWS ({combo.reviewsCount || 236})</span>
            <FiChevronDown className={`m-c-acc-arrow ${openAccordions.reviews ? 'open' : ''}`} />
          </button>
          {openAccordions.reviews && (
            <div className="m-c-accordion-body text-center py-2">
              <div className="m-c-big-score">{combo.rating || 4.9} / 5</div>
              <div className="m-c-stars-lg justify-content-center d-flex gap-1 mb-2">
                {renderStars(combo.rating || 4.9)}
              </div>
              <p className="small text-muted mb-0">Based on verified customer reviews</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 12. YOU MAY ALSO LIKE ────────────────────────────────── */}
      {relatedCombos.length > 0 && (
        <section className="m-c-section-block">
          <div className="m-c-sec-head">
            <h3 className="m-c-sec-title">YOU MAY ALSO LIKE</h3>
            <Link to="/combos" className="m-c-sec-link">View All →</Link>
          </div>
          <div className="m-c-carousel-wrapper">
            <div className="m-c-carousel-track" ref={alsoLikeRef}>
              {relatedCombos.map(rel => {
                const relDiscount = calculateDiscount(rel.original_price, rel.offer_price);
                return (
                  <Link key={rel.id} to={`/combo/${rel.id}`} className="m-c-combo-card">
                    <div className="m-c-card-img-wrap">
                      {rel.images?.[0] ? <img src={rel.images[0]} alt={rel.name} /> : <div className="m-c-item-thumb-placeholder" />}
                      {relDiscount > 0 && <span className="m-c-card-badge">-{relDiscount}%</span>}
                      <button
                        type="button"
                        className="m-c-card-wish-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(rel);
                        }}
                        aria-label="Wishlist"
                      >
                        <FiHeart />
                      </button>
                    </div>
                    <div className="m-c-card-info">
                      <h4 className="m-c-card-title">{rel.name}</h4>
                      <div className="m-c-card-price-row">
                        <span className="m-c-card-price">{formatPrice(rel.offer_price)}</span>
                        {rel.original_price && <span className="m-c-card-orig">{formatPrice(rel.original_price)}</span>}
                        {relDiscount > 0 && <span className="m-c-card-disc">-{relDiscount}%</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 14. FULLSCREEN LIGHTBOX MODAL ────────────────────────── */}
      {isFullscreen && currentMainImg && (
        <div className="m-c-fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <button
            type="button"
            className="m-c-fullscreen-close"
            onClick={() => setIsFullscreen(false)}
          >
            <FiX />
          </button>
          <img src={currentMainImg} alt={combo.name} className="m-c-fs-img" />
          {comboImages.length > 1 && (
            <>
              <button
                type="button"
                className="m-c-fs-arrow m-c-fs-prev"
                onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                className="m-c-fs-arrow m-c-fs-next"
                onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
              >
                <FiChevronRight />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── 14. MOBILE FOOTER ACCORDIONS ─────────────────────────── */}
      <MobileFooterAccordion />

      {/* ── 15. STICKY MOBILE PURCHASE BAR ───────────────────────── */}
      {showStickyBar && (
        <div className="m-c-sticky-purchase-bar">
          <div className="m-c-sticky-info">
            <span className="m-c-sticky-name">{combo.name}</span>
            <span className="m-c-sticky-price">{formatPrice(combo.offer_price)}</span>
          </div>
          <button
            type="button"
            className="m-c-sticky-add-btn"
            onClick={handleAddToCart}
          >
            <FiShoppingBag /> ADD TO CART
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileComboDetail;
