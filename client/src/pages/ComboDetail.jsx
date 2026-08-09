import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiShoppingBag, FiCheck, FiChevronRight, FiChevronLeft, FiHeart, FiRefreshCw,
  FiAlertCircle, FiMaximize2, FiMinus, FiPlus, FiX, FiInfo, FiEdit3
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import SEO from '../components/common/SEO';
import MobileComboDetail from '../components/product/MobileComboDetail';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getComboById, getCombos, getProducts } from '../services/api';
import { getVariantStock } from './ProductDetail';
import { formatPrice, calculateDiscount } from '../utils/formatters';
import './ComboDetail.css';

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

const ComboDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  const [combo, setCombo] = useState(null);
  const [allCombos, setAllCombos] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Gallery State */
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  /* Selections per piece: { 1: { color: 'Black', size: 'M' }, 2: { color: 'Black', size: 'M' } } */
  const [pieceSelections, setPieceSelections] = useState({});
  const [globalComboSize, setGlobalComboSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [validationError, setValidationError] = useState('');
  const [addedToast, setAddedToast] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

  const alsoLikeRef = useRef(null);

  /* Fetch catalog data */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setValidationError('');
      try {
        const [comboRes, combosListRes, productsRes] = await Promise.all([
          getComboById(id),
          getCombos(),
          getProducts()
        ]);

        if (productsRes && productsRes.success && Array.isArray(productsRes.data)) {
          setProductsCatalog(productsRes.data);
        }

        let targetCombo = null;
        if (comboRes && comboRes.success && comboRes.data) {
          targetCombo = comboRes.data;
        } else if (combosListRes && combosListRes.success && Array.isArray(combosListRes.data)) {
          targetCombo = combosListRes.data.find(c => c.id === id || c.slug === id);
        }

        if (combosListRes && combosListRes.success && Array.isArray(combosListRes.data)) {
          setAllCombos(combosListRes.data.filter(c => c.status !== 'Inactive' && String(c.id) !== String(id)));
        }

        if (targetCombo) {
          setCombo(targetCombo);
          setActiveImgIndex(0);
          const initial = {};
          targetCombo.items?.forEach(item => {
            initial[item.pieceIndex] = {
              color: item.colors?.[0]?.name || 'Standard',
              size: item.sizes?.[0] || 'M'
            };
          });
          setPieceSelections(initial);
        } else {
          setCombo(null);
        }
      } catch (err) {
        console.warn('Failed to load combo data:', err);
        setCombo(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  /* Handlers for per-piece selections */
  const handleSelectColor = (pieceIndex, colorName) => {
    setPieceSelections(prev => ({
      ...prev,
      [pieceIndex]: {
        ...prev[pieceIndex],
        color: colorName
      }
    }));
    setValidationError('');
  };

  const handleSelectSize = (pieceIndex, sizeVal) => {
    setPieceSelections(prev => ({
      ...prev,
      [pieceIndex]: {
        ...prev[pieceIndex],
        size: sizeVal
      }
    }));
    setValidationError('');
  };

  /* Helper to apply a size preset across all pieces */
  const handleApplyGlobalSize = (sizeVal) => {
    setGlobalComboSize(sizeVal);
    if (!combo || !combo.items) return;
    const updated = { ...pieceSelections };
    combo.items.forEach(item => {
      if (item.sizes && item.sizes.includes(sizeVal)) {
        updated[item.pieceIndex] = {
          ...updated[item.pieceIndex],
          size: sizeVal
        };
      }
    });
    setPieceSelections(updated);
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const goToPrevImage = () => {
    if (!comboImages.length) return;
    setActiveImgIndex(prev => prev > 0 ? prev - 1 : comboImages.length - 1);
  };

  const goToNextImage = () => {
    if (!comboImages.length) return;
    setActiveImgIndex(prev => prev < comboImages.length - 1 ? prev + 1 : 0);
  };

  const scrollAlsoLike = (direction) => {
    if (alsoLikeRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      alsoLikeRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleAddToCart = () => {
    if (!combo) return;

    // Validate that all pieces have color & size selected
    for (const item of combo.items || []) {
      const sel = pieceSelections[item.pieceIndex];
      if (!sel || !sel.size) {
        setValidationError(`Please select a size for ${item.name}`);
        return;
      }

      // Check stock
      const targetProd = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
      if (targetProd) {
        const stock = getVariantStock(targetProd, sel.color, sel.size);
        if (stock <= 0) {
          setValidationError(`Cannot add to bag: ${item.name} (${sel.size}) is OUT OF STOCK. Please choose an available size.`);
          return;
        }
      }
    }

    const selectedPiecesSummary = combo.items.map(item => {
      const sel = pieceSelections[item.pieceIndex];
      return {
        pieceIndex: item.pieceIndex,
        pieceLabel: item.pieceLabel || `Piece ${item.pieceIndex}`,
        productId: item.productId,
        name: item.name,
        color: sel?.color || 'Standard',
        size: sel?.size || 'M'
      };
    });

    const comboCartItem = {
      id: `${combo.id}-${Date.now()}`,
      comboId: combo.id,
      name: combo.name,
      price: combo.offer_price,
      originalPrice: combo.original_price,
      image: combo.images?.[0] || '',
      badge: combo.badge || '',
      isCombo: true,
      selectedPieces: selectedPiecesSummary
    };

    addToCart(comboCartItem, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3500);
  };

  if (loading) {
    return (
      <div className="text-center py-5 my-5 text-white">
        <span className="spinner-border text-danger" role="status" />
        <p className="mt-2 text-muted">Loading luxury combo deal...</p>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="text-center py-5 my-5 text-white">
        <h2>Combo Offer Not Found</h2>
        <p className="text-muted">The combo deal you are looking for is no longer active.</p>
        <Link to="/combos" className="btn-primary-orderly mt-3">Back to Combo Offers</Link>
      </div>
    );
  }

  const comboImages = combo.images?.length > 0 ? combo.images : [];
  const currentMainImg = comboImages[activeImgIndex] || comboImages[0] || '';
  const discountPercent = calculateDiscount(combo.original_price, combo.offer_price);
  const isWishlisted = wishlist.some(item => item && String(item.id) === String(combo.id));
  const relatedCombos = allCombos.slice(0, 4);

  const tabs = [
    { key: 'description', label: 'DESCRIPTION' },
    { key: 'details', label: 'DETAILS' },
    { key: 'shipping', label: 'SHIPPING & RETURNS' },
    { key: 'reviews', label: `REVIEWS (${combo.reviewsCount || 236})` },
  ];

  return (
    <>
      <SEO
        title={`${combo.name} | ORDERLY Menswear`}
        description={combo.description}
      />

      {/* ── Mobile Combo PDP (<= 767px) ───────────────────────────── */}
      <div className="orderly-mobile-combo-pdp-wrapper">
        <MobileComboDetail
          combo={combo}
          relatedCombos={relatedCombos}
          productsCatalog={productsCatalog}
          pieceSelections={pieceSelections}
          handleSelectColor={handleSelectColor}
          handleSelectSize={handleSelectSize}
          quantity={quantity}
          handleQuantityChange={handleQuantityChange}
          handleAddToCart={handleAddToCart}
          toggleWishlist={toggleWishlist}
          isWishlisted={isWishlisted}
          validationError={validationError}
          setShowSizeGuide={setShowSizeGuide}
        />
      </div>

      {/* ── Desktop Combo PDP (>= 768px) ──────────────────────────── */}
      <div className="orderly-desktop-combo-pdp-wrapper">
        <div className="orderly-combo-pdp-page">
        {/* Toast Banner */}
        {addedToast && (
          <div className="combo-added-toast">
            <FiCheck className="fs-5" /> Added Complete {combo.pieces_count || combo.items?.length || 5}-Piece Combo to Your Bag!
          </div>
        )}

        {/* ── BREADCRUMB ─────────────────────────────────────────── */}
        <nav className="c-pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <FiChevronRight />
          <Link to="/combos">Combos</Link>
          <FiChevronRight />
          <span className="c-pdp-crumb-current">{combo.name}</span>
        </nav>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MAIN COMBO SECTION (Gallery + Customizer)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="c-pdp-main-section">
          {/* ── LEFT COLUMN: Combo Image Gallery ─────────────────── */}
          <div className="c-pdp-gallery-col">
            <div className="c-pdp-gallery-layout">
              {/* Main Image Container */}
              <div className="c-pdp-main-image-box">
                {/* Discount Badge (Top-Left) */}
                {discountPercent > 0 && (
                  <span className="c-pdp-discount-badge">-{discountPercent}%</span>
                )}

                {/* Hero Image */}
                {currentMainImg ? (
                  <img
                    src={currentMainImg}
                    alt={combo.name}
                    className="c-pdp-hero-img"
                    onClick={() => setIsFullscreen(true)}
                  />
                ) : (
                  <div className="c-pdp-hero-img c-pdp-img-placeholder d-flex align-items-center justify-content-center">
                    <span className="text-muted">No Image Available</span>
                  </div>
                )}

                {/* Image Navigation Arrows */}
                {comboImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="c-pdp-img-nav c-pdp-img-prev"
                      onClick={goToPrevImage}
                      aria-label="Previous image"
                    >
                      <FiChevronLeft />
                    </button>
                    <button
                      type="button"
                      className="c-pdp-img-nav c-pdp-img-next"
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
                    className="c-pdp-fullscreen-trigger"
                    onClick={() => setIsFullscreen(true)}
                    aria-label="Fullscreen view"
                  >
                    <FiMaximize2 />
                  </button>
                )}
              </div>

              {/* Horizontal Thumbnail Strip Below */}
              {comboImages.length > 1 && (
                <div className="c-pdp-thumbs-strip">
                  {comboImages.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`c-pdp-thumb-btn ${activeImgIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveImgIndex(idx)}
                      aria-label={`View thumbnail ${idx + 1}`}
                    >
                      <img src={img} alt={`${combo.name} thumbnail ${idx + 1}`} />
                    </button>
                  ))}
                  {comboImages.length > 6 && (
                    <button
                      type="button"
                      className={`c-pdp-thumb-btn c-pdp-thumb-more ${activeImgIndex >= 6 ? 'active' : ''}`}
                      onClick={() => setActiveImgIndex(6)}
                    >
                      <img src={comboImages[6]} alt="More thumbnails" />
                      <span className="c-pdp-thumb-more-overlay">+{comboImages.length - 6}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Combo Information & Customizer ─────── */}
          <div className="c-pdp-info-col">
            <div className="c-pdp-info-inner">
              {/* Title */}
              <h1 className="c-pdp-title">{combo.name}</h1>

              {/* Rating Row */}
              <div className="c-pdp-rating-row">
                <div className="c-pdp-stars">
                  {renderStars(combo.rating || 4.9)}
                </div>
                <span className="c-pdp-rating-score">{combo.rating || 4.9}</span>
                <span className="c-pdp-rating-count">({combo.reviewsCount || 236} Reviews)</span>
                <span className="c-pdp-rating-divider">|</span>
                <button
                  type="button"
                  className="c-pdp-add-review-link"
                  onClick={() => setActiveTab('reviews')}
                >
                  Add Your Review
                </button>
              </div>

              {/* Price Block */}
              <div className="c-pdp-price-block">
                <span className="c-pdp-current-price">{formatPrice(combo.offer_price)}</span>
                {combo.original_price && (
                  <span className="c-pdp-original-price">{formatPrice(combo.original_price)}</span>
                )}
                {discountPercent > 0 && (
                  <span className="c-pdp-off-tag">{discountPercent}% OFF</span>
                )}
              </div>
              <p className="c-pdp-tax-note">Inclusive of all taxes</p>

              {/* Validation Error Alert */}
              {validationError && (
                <div className="c-pdp-validation-alert">
                  <FiAlertCircle />
                  <span>{validationError}</span>
                </div>
              )}

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  COMBO INCLUDES CARD (Individual Item Variant Customizer)
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <div className="c-pdp-includes-card">
                <div className="c-pdp-includes-header">
                  <span className="c-pdp-includes-title">
                    Combo Includes <strong>({combo.items?.length || combo.pieces_count || 5} Items)</strong>
                  </span>
                </div>

                <div className="c-pdp-items-list">
                  {combo.items?.map((item, idx) => {
                    const sel = pieceSelections[item.pieceIndex] || {};
                    const targetProd = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
                    const itemImg = item.image || (targetProd && targetProd.images?.[0]) || combo.images?.[idx] || '';

                    return (
                      <div key={item.pieceIndex || idx} className="c-pdp-item-row">
                        {/* Left: Thumbnail & Info */}
                        <div className="c-pdp-item-left">
                          <div className="c-pdp-item-thumb">
                            {itemImg ? (
                              <img src={itemImg} alt={item.name} />
                            ) : (
                              <div className="c-pdp-item-thumb-placeholder" />
                            )}
                          </div>
                          <div className="c-pdp-item-meta">
                            <h4 className="c-pdp-item-name">{item.name}</h4>
                            <div className="c-pdp-item-specs-summary">
                              <span>Size: <strong>{sel.size || 'M'}</strong></span>
                              <span className="c-pdp-meta-sep">|</span>
                              <span>Qty: <strong>1</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Per-Item Size Selector Buttons */}
                        <div className="c-pdp-item-right">
                          <span className="c-pdp-item-size-lbl">
                            Size <FiInfo title="Select size for this item" />
                          </span>
                          <div className="c-pdp-item-size-pills">
                            {(item.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((sz, sIdx) => {
                              const szStock = targetProd ? getVariantStock(targetProd, sel.color, sz) : 10;
                              const isOut = szStock <= 0;
                              return (
                                <button
                                  key={sIdx}
                                  type="button"
                                  className={`c-pdp-item-size-pill ${sel.size === sz ? 'active' : ''} ${isOut ? 'out-of-stock' : ''}`}
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

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  GLOBAL COMBO SIZE SELECTOR (Shortcut)
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <div className="c-pdp-global-size-row">
                <div className="c-pdp-global-size-header">
                  <span className="c-pdp-global-size-title">
                    Choose Combo Size <FiInfo title="Applies size to all items in this combo" />
                  </span>
                  <button
                    type="button"
                    className="c-pdp-size-guide-btn"
                    onClick={() => setShowSizeGuide(true)}
                  >
                    <FiEdit3 /> Size Guide
                  </button>
                </div>
                <div className="c-pdp-global-size-pills">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      className={`c-pdp-global-size-pill ${globalComboSize === sz ? 'active' : ''}`}
                      onClick={() => handleApplyGlobalSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div className="c-pdp-stock-row">
                <span className="c-pdp-stock-available">
                  <span className="c-pdp-green-dot" /> In Stock
                  <span className="c-pdp-ship-note">Ships within 24 hours</span>
                </span>
              </div>

              {/* CTA Row (Qty + Add to Cart + Wishlist + Compare) */}
              <div className="c-pdp-cta-row">
                <div className="c-pdp-qty-control">
                  <button
                    type="button"
                    className="c-pdp-qty-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <span className="c-pdp-qty-num">{quantity}</span>
                  <button
                    type="button"
                    className="c-pdp-qty-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 10}
                  >
                    <FiPlus />
                  </button>
                </div>

                <button
                  type="button"
                  className="c-pdp-add-cart-btn"
                  onClick={handleAddToCart}
                >
                  <FiShoppingBag /> ADD TO CART
                </button>

                <button
                  type="button"
                  className={`c-pdp-icon-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={() => toggleWishlist(combo)}
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <FiHeart />
                </button>

                <button
                  type="button"
                  className={`c-pdp-icon-btn ${isCompared ? 'active' : ''}`}
                  onClick={() => setIsCompared(prev => !prev)}
                  aria-label="Compare"
                  title="Compare"
                >
                  <FiRefreshCw />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PRODUCT INFORMATION TABS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="c-pdp-content-section">
          <div className="c-pdp-tabs-nav">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`c-pdp-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="c-pdp-tab-panel">
            {activeTab === 'description' && (
              <div className="c-pdp-desc-content">
                <p className="c-pdp-desc-text">
                  {combo.description || 'Step into confidence with our curated formal combo. A perfectly matched set of essentials that brings sophistication, comfort, and style together for any occasion.'}
                </p>
                <ul className="c-pdp-desc-features">
                  <li>Premium fabrics for all-day comfort</li>
                  <li>Perfect for office, meetings & formal events</li>
                  <li>Tailored fit for a sharp look</li>
                  <li>Handpicked matching pieces</li>
                  <li>Best value — Save more with combos</li>
                </ul>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="c-pdp-specs-content">
                <div className="c-pdp-specs-grid">
                  <div className="c-pdp-spec-row">
                    <span className="c-pdp-spec-k">COMBO ITEMS</span>
                    <span className="c-pdp-spec-v">{combo.pieces_count || combo.items?.length || 5} Pieces Included</span>
                  </div>
                  <div className="c-pdp-spec-row">
                    <span className="c-pdp-spec-k">FIT TYPE</span>
                    <span className="c-pdp-spec-v">Tailored Slim / Modern Fit</span>
                  </div>
                  <div className="c-pdp-spec-row">
                    <span className="c-pdp-spec-k">FABRIC</span>
                    <span className="c-pdp-spec-v">Premium Wool Blend / Oxford Cotton</span>
                  </div>
                  <div className="c-pdp-spec-row">
                    <span className="c-pdp-spec-k">CARE INSTRUCTIONS</span>
                    <span className="c-pdp-spec-v">Dry Clean Only for Blazer; Machine Wash Cold for Shirt & Trousers</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="c-pdp-shipping-content">
                <ul className="c-pdp-desc-features">
                  <li>Free standard shipping on orders above ₹1,499</li>
                  <li>Standard delivery within 5–7 business days</li>
                  <li>Express delivery available at checkout</li>
                  <li>Easy 7 days return & exchange policy</li>
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="c-pdp-reviews-content">
                <div className="c-pdp-reviews-summary">
                  <div className="c-pdp-reviews-score">{combo.rating || 4.9} / 5</div>
                  <div className="c-pdp-stars justify-content-center d-flex gap-1 mb-2">
                    {renderStars(combo.rating || 4.9)}
                  </div>
                  <p className="c-pdp-reviews-total">Based on {combo.reviewsCount || 236} customer reviews</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            YOU MAY ALSO LIKE (Related Combos Carousel)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {relatedCombos.length > 0 && (
          <section className="c-pdp-also-like-section">
            <div className="c-pdp-section-header">
              <h3 className="c-pdp-section-title">YOU MAY ALSO LIKE</h3>
              <Link to="/combos" className="c-pdp-view-all-link">View All →</Link>
            </div>
            <div className="c-pdp-also-like-wrapper">
              {relatedCombos.length > 4 && (
                <button
                  type="button"
                  className="c-pdp-carousel-nav c-pdp-carousel-prev"
                  onClick={() => scrollAlsoLike('left')}
                  aria-label="Previous"
                >
                  <FiChevronLeft />
                </button>
              )}
              <div className="c-pdp-also-like-track" ref={alsoLikeRef}>
                {relatedCombos.map(rel => {
                  const relDiscount = calculateDiscount(rel.original_price, rel.offer_price);
                  return (
                    <Link key={rel.id} to={`/combo/${rel.id}`} className="c-pdp-combo-card">
                      <div className="c-pdp-card-img-wrap">
                        {rel.images?.[0] ? (
                          <img src={rel.images[0]} alt={rel.name} />
                        ) : (
                          <div className="c-pdp-card-placeholder">No Image</div>
                        )}
                        {relDiscount > 0 && (
                          <span className="c-pdp-card-badge">-{relDiscount}%</span>
                        )}
                        <button
                          type="button"
                          className="c-pdp-card-wish-btn"
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
                      <div className="c-pdp-card-info">
                        <h4 className="c-pdp-card-title">{rel.name}</h4>
                        <div className="c-pdp-card-price-row">
                          <span className="c-pdp-card-price">{formatPrice(rel.offer_price)}</span>
                          {rel.original_price && (
                            <span className="c-pdp-card-orig-price">{formatPrice(rel.original_price)}</span>
                          )}
                          {relDiscount > 0 && (
                            <span className="c-pdp-card-disc">-{relDiscount}%</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {relatedCombos.length > 4 && (
                <button
                  type="button"
                  className="c-pdp-carousel-nav c-pdp-carousel-next"
                  onClick={() => scrollAlsoLike('right')}
                  aria-label="Next"
                >
                  <FiChevronRight />
                </button>
              )}
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FULLSCREEN IMAGE LIGHTBOX MODAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isFullscreen && currentMainImg && (
          <div className="c-pdp-fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
            <button
              type="button"
              className="c-pdp-fullscreen-close"
              onClick={() => setIsFullscreen(false)}
            >
              <FiX />
            </button>
            <img src={currentMainImg} alt={combo.name} className="c-pdp-fs-img" />
            {comboImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="c-pdp-fs-arrow c-pdp-fs-prev"
                  onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  className="c-pdp-fs-arrow c-pdp-fs-next"
                  onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                >
                  <FiChevronRight />
                </button>
              </>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SIZE GUIDE MODAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {showSizeGuide && (
          <div className="c-pdp-size-modal-overlay" onClick={() => setShowSizeGuide(false)}>
            <div className="c-pdp-size-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="c-pdp-size-modal-header">
                <h3>Combo Size Chart Guide</h3>
                <button
                  type="button"
                  className="c-pdp-modal-close-btn"
                  onClick={() => setShowSizeGuide(false)}
                >
                  <FiX />
                </button>
              </div>
              <table className="c-pdp-size-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Blazer (Chest)</th>
                    <th>Shirt (Chest)</th>
                    <th>Trousers (Waist)</th>
                    <th>Shoes (UK)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>38"</td><td>38"</td><td>30"</td><td>7</td></tr>
                  <tr><td>M</td><td>40"</td><td>40"</td><td>32"</td><td>8</td></tr>
                  <tr><td>L</td><td>42"</td><td>42"</td><td>34"</td><td>9</td></tr>
                  <tr><td>XL</td><td>44"</td><td>44"</td><td>36"</td><td>10</td></tr>
                  <tr><td>XXL</td><td>46"</td><td>46"</td><td>38"</td><td>11</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  </>
);
};

export default ComboDetail;
