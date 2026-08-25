import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiShoppingBag, FiCheck, FiChevronRight, FiChevronLeft, FiHeart, FiRefreshCw,
  FiAlertCircle, FiMaximize2, FiMinus, FiPlus, FiX, FiInfo, FiTrash2
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import SEOHead from '../components/common/SEOHead';
import MobileComboDetail from '../components/product/MobileComboDetail';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getComboById, getCombos, getProducts } from '../services/api';
import { ComboDetailSkeleton } from '../components/common/Skeleton';
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
  const { addToCart, setIsCartOpen } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  const [combo, setCombo] = useState(null);
  const [allCombos, setAllCombos] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Gallery State */
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* Selections per piece: { 1: { color: 'Black', size: 'M' }, 2: { color: 'Black', size: 'M' } } */
  const [pieceSelections, setPieceSelections] = useState({});
  const [removedPieceIndices, setRemovedPieceIndices] = useState([]);
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
      setRemovedPieceIndices([]);
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
          // Normalize items to guarantee valid, unique numerical pieceIndex (1-indexed)
          const normalizedItems = (targetCombo.items || []).map((item, idx) => ({
            ...item,
            pieceIndex: Number(item.pieceIndex ?? (idx + 1)),
            sizes: (item.sizes && item.sizes.length > 0) ? item.sizes : (
              item.name.toLowerCase().includes('trouser') || item.name.toLowerCase().includes('pant') || item.name.toLowerCase().includes('jean') || item.name.toLowerCase().includes('shirt slick') || item.name.toLowerCase().includes('slick')
                ? ['30', '32', '34', '36', '38']
                : item.name.toLowerCase().includes('blazer') || item.name.toLowerCase().includes('suit')
                ? ['38', '40', '42', '44', '46']
                : ['S', 'M', 'L', 'XL', 'XXL']
            )
          }));

          const normalizedCombo = {
            ...targetCombo,
            items: normalizedItems
          };

          setCombo(normalizedCombo);
          setActiveImgIndex(0);
          const initial = {};
          normalizedItems.forEach((item) => {
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

  /* ── Combo Piece Removal & Dynamic Pricing Calculations ───────── */
  const totalComboPieces = combo?.items?.length || combo?.pieces_count || 0;
  // 2-piece combo: no removal allowed. 3-piece: up to 1 item. 4-piece: up to 2 items.
  const maxRemovablePieces = totalComboPieces >= 3 ? Math.min(2, Math.max(0, totalComboPieces - 2)) : 0;
  const canRemoveMore = removedPieceIndices.length < maxRemovablePieces;

  const includedItems = (combo?.items || []).filter(
    item => !removedPieceIndices.includes(Number(item.pieceIndex))
  );
  const includedCount = includedItems.length;

  // Base prices
  const baseOfferPrice = Number(combo?.offer_price || 0);
  const baseOriginalPrice = Number(combo?.original_price || combo?.offer_price || 0);

  // Proportional price calculation for included items
  const activeOfferPrice = totalComboPieces > 0
    ? Math.round((baseOfferPrice / totalComboPieces) * includedCount)
    : baseOfferPrice;

  const activeOriginalPrice = totalComboPieces > 0
    ? Math.round((baseOriginalPrice / totalComboPieces) * includedCount)
    : baseOriginalPrice;

  const discountPercent = calculateDiscount(activeOriginalPrice, activeOfferPrice);

  const toggleRemovePiece = (pieceIdx) => {
    const targetIdx = Number(pieceIdx);
    if (removedPieceIndices.includes(targetIdx)) {
      // Re-include piece
      setRemovedPieceIndices(prev => prev.filter(idx => Number(idx) !== targetIdx));
      setValidationError('');
    } else {
      // Check restriction: cannot remove more than maxRemovablePieces (at most 2)
      if (removedPieceIndices.length >= maxRemovablePieces) {
        setValidationError(`You can remove a maximum of ${maxRemovablePieces} items from this combo set.`);
        setTimeout(() => setValidationError(''), 4000);
        return;
      }
      setRemovedPieceIndices(prev => [...prev, targetIdx]);
      setValidationError('');
    }
  };

  /* Handlers for per-piece selections */
  const handleSelectColor = (pieceIndex, colorName) => {
    const pIdx = Number(pieceIndex);
    setPieceSelections(prev => ({
      ...prev,
      [pIdx]: {
        ...(prev[pIdx] || {}),
        color: colorName
      }
    }));
    setValidationError('');
  };

  const handleSelectSize = (pieceIndex, sizeVal) => {
    const pIdx = Number(pieceIndex);
    setPieceSelections(prev => ({
      ...prev,
      [pIdx]: {
        ...(prev[pIdx] || {}),
        size: sizeVal
      }
    }));
    setValidationError('');
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

    if (includedItems.length === 0) {
      setValidationError('At least 1 item must remain in the combo.');
      return;
    }

    // Validate only the INCLUDED pieces
    for (const item of includedItems) {
      const pIdx = Number(item.pieceIndex);
      const sel = pieceSelections[pIdx] || {};
      const chosenSize = sel.size || item.sizes?.[0] || 'M';

      // Check explicit out of stock if catalog product exists
      const targetProd = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
      if (targetProd && targetProd.inventory && Object.keys(targetProd.inventory).length > 0) {
        const stock = getVariantStock(targetProd, sel.color || 'Standard', chosenSize);
        if (stock <= 0 && targetProd.inventory[`Standard-${chosenSize}`] === 0) {
          setValidationError(`Cannot add to bag: ${item.name} (${chosenSize}) is OUT OF STOCK. Please choose an available size.`);
          return;
        }
      }
    }

    const selectedPiecesSummary = includedItems.map(item => {
      const pIdx = Number(item.pieceIndex);
      const sel = pieceSelections[pIdx] || {};
      return {
        pieceIndex: pIdx,
        pieceLabel: item.pieceLabel || `Piece ${pIdx}`,
        productId: item.productId,
        name: item.name,
        color: sel.color || 'Standard',
        size: sel.size || item.sizes?.[0] || 'M'
      };
    });

    const comboCartItem = {
      id: `${combo.id}-${Date.now()}`,
      comboId: combo.id,
      name: removedPieceIndices.length > 0 
        ? `${combo.name} (${includedCount}-Piece Set)` 
        : combo.name,
      price: activeOfferPrice,
      originalPrice: activeOriginalPrice,
      image: combo.images?.[0] || '',
      badge: combo.badge || '',
      isCombo: true,
      isCustomizedCombo: removedPieceIndices.length > 0,
      removedPiecesCount: removedPieceIndices.length,
      totalPieces: totalComboPieces,
      selectedPieces: selectedPiecesSummary
    };

    addToCart(comboCartItem, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3500);
    if (typeof setIsCartOpen === 'function') {
      setIsCartOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="pt-5 pb-5">
        <ComboDetailSkeleton />
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
  const isWishlisted = wishlist.some(item => item && String(item.id) === String(combo.id));
  const relatedCombos = allCombos
    .filter(rel => String(rel.id) !== String(combo.id) && String(rel.slug || '') !== String(combo.slug || ''))
    .slice(0, 8);

  const tabs = [
    { key: 'description', label: 'DESCRIPTION' },
    { key: 'details', label: 'DETAILS' },
    { key: 'shipping', label: 'SHIPPING & RETURNS' },
    { key: 'reviews', label: `REVIEWS (${combo.reviewsCount || 236})` },
  ];

  return (
    <>
      <SEOHead
        title={`${combo.name} | Premium Menswear Combo | ORDERLY`}
        description={combo.description || "Curated luxury menswear combo set. Save up to 35% on complete styling sets."}
        canonicalPath={`/combo/${combo.slug || combo.id}`}
        image={combo.images?.[0] || 'https://orderlymenswear.in/assets/media/logo-07E_iIRS.png'}
        type="product"
        product={combo}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Combos', url: '/combos' },
          { name: combo.name, url: `/combo/${combo.slug || combo.id}` }
        ]}
      />

      {/* ── Mobile Combo PDP (<= 767px) ───────────────────────────── */}
      <div className="orderly-mobile-combo-pdp-wrapper">
        <MobileComboDetail
          combo={combo}
          relatedCombos={relatedCombos}
          productsCatalog={productsCatalog}
          pieceSelections={pieceSelections}
          removedPieceIndices={removedPieceIndices}
          toggleRemovePiece={toggleRemovePiece}
          maxRemovablePieces={maxRemovablePieces}
          canRemoveMore={canRemoveMore}
          activeOfferPrice={activeOfferPrice}
          activeOriginalPrice={activeOriginalPrice}
          includedCount={includedCount}
          totalComboPieces={totalComboPieces}
          handleSelectColor={handleSelectColor}
          handleSelectSize={handleSelectSize}
          quantity={quantity}
          handleQuantityChange={handleQuantityChange}
          handleAddToCart={handleAddToCart}
          toggleWishlist={toggleWishlist}
          isWishlisted={isWishlisted}
          validationError={validationError}
        />
      </div>

      {/* ── Desktop Combo PDP (>= 768px) ──────────────────────────── */}
      <div className="orderly-desktop-combo-pdp-wrapper">
        <div className="orderly-combo-pdp-page">
        {/* Toast Banner */}
        {addedToast && (
          <div className="combo-added-toast">
            <FiCheck className="fs-5" /> Added {includedCount}-Piece Combo Set to Your Bag!
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

              

              {/* Price Block */}
              <div className="c-pdp-price-block">
                <span className="c-pdp-current-price">{formatPrice(activeOfferPrice)}</span>
                {activeOriginalPrice > 0 && (
                  <span className="c-pdp-original-price">{formatPrice(activeOriginalPrice)}</span>
                )}
                {discountPercent > 0 && (
                  <span className="c-pdp-off-tag">{discountPercent}% OFF</span>
                )}
                {removedPieceIndices.length > 0 && (
                  <span className="badge bg-warning text-dark px-2 py-1 ms-2 font-weight-bold">
                    Custom {includedCount}-Piece Set
                  </span>
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
                  <div className="c-pdp-includes-header-text">
                    <span className="c-pdp-includes-title">
                      Combo Includes <strong>({includedCount}/{totalComboPieces} Items Selected)</strong>
                    </span>
                    {totalComboPieces >= 3 && (
                      <span className="c-pdp-remove-hint">
                        {removedPieceIndices.length === 0
                          ? `• You can remove up to ${maxRemovablePieces} item${maxRemovablePieces > 1 ? 's' : ''} if not needed`
                          : `• ${removedPieceIndices.length}/${maxRemovablePieces} Items Removed (${formatPrice(baseOfferPrice - activeOfferPrice)} reduced)`}
                      </span>
                    )}
                  </div>
                  {removedPieceIndices.length > 0 && (
                    <button
                      type="button"
                      className="c-pdp-reset-combo-btn"
                      onClick={() => setRemovedPieceIndices([])}
                    >
                      <FiRefreshCw className="me-1" /> Reset All Items
                    </button>
                  )}
                </div>

                <div className="c-pdp-items-list">
                  {combo.items?.map((item, idx) => {
                    const pIdx = Number(item.pieceIndex);
                    const isRemoved = removedPieceIndices.includes(pIdx);
                    const sel = pieceSelections[pIdx] || {};
                    const targetProd = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
                    const itemImg = item.image || (targetProd && targetProd.images?.[0]) || combo.images?.[idx] || '';

                    return (
                      <div key={pIdx || idx} className={`c-pdp-item-row ${isRemoved ? 'removed' : ''}`}>
                        {/* Left: Thumbnail & Info */}
                        <div className="c-pdp-item-left">
                          <div className="c-pdp-item-thumb">
                            {itemImg ? (
                              <img src={itemImg} alt={item.name} />
                            ) : (
                              <div className="c-pdp-item-thumb-placeholder" />
                            )}
                            {isRemoved && (
                              <div className="c-pdp-item-thumb-removed-overlay">
                                <FiX />
                              </div>
                            )}
                          </div>
                          <div className="c-pdp-item-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <h4 className={`c-pdp-item-name ${isRemoved ? 'text-decoration-line-through text-muted' : ''}`}>{item.name}</h4>
                              {isRemoved && <span className="c-pdp-removed-badge">REMOVED FROM SET</span>}
                            </div>
                            {!isRemoved ? (
                              <div className="c-pdp-item-specs-summary">
                                <span>Size: <strong>{sel.size || item.sizes?.[0] || 'M'}</strong></span>
                                <span className="c-pdp-meta-sep">|</span>
                                <span>Qty: <strong>1</strong></span>
                              </div>
                            ) : (
                              <div className="c-pdp-item-specs-summary text-muted">
                                <span>Item excluded from bundle price</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Per-Item Size Selector Buttons or Re-Add Button */}
                        <div className="c-pdp-item-right">
                          {!isRemoved ? (
                            <>
                              <div className="d-flex align-items-center justify-content-between w-100 mb-1 gap-3">
                                <span className="c-pdp-item-size-lbl">
                                  Size <FiInfo title="Select size for this item" />
                                </span>
                                {totalComboPieces >= 3 && (
                                  <button
                                    type="button"
                                    className={`c-pdp-item-remove-btn ${!canRemoveMore ? 'disabled' : ''}`}
                                    onClick={() => toggleRemovePiece(pIdx)}
                                    title={canRemoveMore ? "Remove this item from combo" : `Maximum ${maxRemovablePieces} items removed`}
                                    disabled={!canRemoveMore}
                                  >
                                    <FiTrash2 /> Remove Piece
                                  </button>
                                )}
                              </div>
                              <div className="c-pdp-item-size-pills">
                                {(item.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((sz, sIdx) => {
                                  const szStock = targetProd ? getVariantStock(targetProd, sel.color, sz) : 10;
                                  const isOut = szStock <= 0;
                                  const activeSize = sel.size || item.sizes?.[0] || 'M';
                                  return (
                                    <button
                                      key={sIdx}
                                      type="button"
                                      className={`c-pdp-item-size-pill ${activeSize === sz ? 'active' : ''} ${isOut ? 'out-of-stock' : ''}`}
                                      onClick={() => handleSelectSize(pIdx, sz)}
                                      disabled={isOut}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="c-pdp-item-readd-btn"
                              onClick={() => toggleRemovePiece(pIdx)}
                            >
                              <FiPlus /> Include Back to Set
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

      </div>
    </div>
  </>
);
};

export default ComboDetail;
