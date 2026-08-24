import SEOHead from '../components/common/SEOHead';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiHeart, FiShoppingBag, FiShield, FiRefreshCw, FiChevronRight,
  FiCheck, FiArrowDown, FiAlertCircle, FiEye, FiChevronLeft,
  FiMaximize2, FiMinus, FiPlus, FiTruck, FiLock, FiX, FiTag,
  FiEdit3, FiCheckCircle, FiGift
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import SEO from '../components/common/SEO';
import ProductCard from '../components/product/ProductCard';
import MobileProductDetail from '../components/product/MobileProductDetail';
import { PdpSkeleton } from '../components/common/Skeleton';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useQuickView } from '../context/QuickViewContext';
import { getProductById, getProducts, getActiveCoupons } from '../services/api';
import { formatPrice, calculateDiscount } from '../utils/formatters';
import './ProductDetail.css';

/* ── Universal bulletproof stock resolution helper ──────────────── */

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

const PAIR_OFFER_PERCENT = 25;

const mergePairOffer = (productItem, pairOffers = {}) => {
  if (!productItem) return null;
  const productId = String(productItem.id);
  const offer = pairOffers?.[productId];
  const enabled = Boolean(offer?.enabled);
  const mrp = Number(productItem.originalPrice ?? productItem.original_price ?? productItem.mrp ?? productItem.price ?? 0);
  const discountPercent = Math.max(0, Math.min(90, Number(offer?.discount_percent ?? offer?.discountPercent ?? PAIR_OFFER_PERCENT)));
  const offerPrice = enabled
    ? Math.max(0, Math.round(mrp * (100 - discountPercent) / 100))
    : Number(productItem.price ?? mrp);

  return {
    ...productItem,
    price: Number(productItem.price ?? mrp),
    originalPrice: mrp,
    pairOffer: enabled
      ? {
          enabled: true,
          discount_percent: discountPercent,
          offer_price: offerPrice,
          badge: offer?.badge || `AVAIL ${discountPercent}% OFF`,
          note: offer?.note || ''
        }
      : {
          enabled: true,
          discount_percent: discountPercent,
          offer_price: offerPrice,
          badge: `AVAIL ${discountPercent}% OFF`,
          note: ''
        }
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
   ProductDetail — Premium Desktop PDP (40% Image / 60% Details)
   ═══════════════════════════════════════════════════════════════════ */
const ProductDetail = () => {
  const { id } = useParams();
  const { cart, addToCart, addMultipleToCart, removeFromCart, pairSettings, pricingBreakdown } = useCart();
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
  const [mainReqToast, setMainReqToast] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPairMap, setSelectedPairMap] = useState({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [pdpCoupons, setPdpCoupons] = useState([]);

  /* ── Fetch active coupons for the PDP offers box ──────────────── */
  useEffect(() => {
    const loadCoupons = async () => {
      const res = await getActiveCoupons();
      if (res && res.success && Array.isArray(res.data)) {
        setPdpCoupons(res.data.filter(c => c.show_on_pdp !== false));
      } else {
        setPdpCoupons([]);
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

  /* ── Fetch product from API ────────────────────────────────────── */
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setNotFound(false);
      setQuantity(1);
      setSelectedPairMap({});
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
          setSuggestedProducts(chosen.length > 0 ? chosen : []);

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

  /* ── Size-wise price helpers ─────────────────────────────────────── */
  const getSizePrice = (product, size) => {
    if (!product || !size) return product?.price ?? 0;
    if (product.sizePrices && product.sizePrices[size] !== undefined && product.sizePrices[size] !== null) {
      return Number(product.sizePrices[size]);
    }
    return product.price ?? 0;
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

    // Scale original compare price proportionally with the size variant price if base prices exist
    if (basePrice > 0) {
      const ratio = baseOrigPrice / basePrice;
      return Math.max(Number(sizePrice), Math.round(Number(sizePrice) * ratio));
    }
    return baseOrigPrice;
  };

  /* ── Derived values ────────────────────────────────────────────── */
  const activeProduct = product;
  const activeColorObj = activeProduct?.colors?.find(c => c && c.name === selectedColor) || activeProduct?.colors?.[0];
  const galleryImages = (activeColorObj?.images && activeColorObj.images.length > 0)
    ? activeColorObj.images
    : (activeProduct?.images && activeProduct.images.length > 0 ? activeProduct.images : []);
  const currentMainImg = galleryImages[selectedImgIndex] || galleryImages[0] || '';
  const isWishlisted = wishlist.some(item => item && String(item.id) === String(activeProduct?.id));
  const isMainProductInCart = cart.some(item => String(item.productId || item.product_id || item.id) === String(activeProduct?.id));
  const currentPrice = getSizePrice(activeProduct, selectedSize);
  const currentOriginalPrice = getSizeOriginalPrice(activeProduct, selectedSize, currentPrice);
  const discountPercent = calculateDiscount(currentOriginalPrice, currentPrice);
  const stockCount = activeProduct ? getVariantStock(activeProduct, selectedColor, selectedSize) : 0;
   
  // Popover states
  const [showAddedPopover, setShowAddedPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  // Find pair items that are already in cart
  const pairItemsInCart = cart.filter(item => Boolean(item.isPairOffer || item.pairOffer?.enabled));
  const distinctPairIdsInCart = new Set(pairItemsInCart.map(item => String(item.productId || item.product_id || item.id)));
  const pairCountInCart = distinctPairIdsInCart.size;

  const multiPairOfferPercent = Number(pairSettings?.discount_percent ?? PAIR_OFFER_PERCENT);
  const minDistinctRequired = Number(pairSettings?.min_distinct_products ?? 2);
  const isMultiOfferUnlocked = (pairSettings?.enabled !== false) && pairCountInCart >= minDistinctRequired;

  const updatePairVariant = (productId, patch) => {
    setSelectedPairMap(prev => {
      const key = String(productId);
      return {
        ...prev,
        [key]: { ...(prev[key] || {}), ...patch }
      };
    });
  };

  // Direct toggle add/remove on individual card
  const handleTogglePairInCart = (pairProduct, chosenSize) => {
    if (!isMainProductInCart) {
      setMainReqToast(`Please add "${activeProduct?.name || 'the main item'}" to your bag first!`);
      setTimeout(() => setMainReqToast(null), 3500);
      const ctaElem = document.querySelector('.pdp-add-bag-btn');
      if (ctaElem) ctaElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const pId = String(pairProduct.id);
    const inCartItem = cart.find(item => String(item.productId || item.product_id || item.id) === pId);

    if (inCartItem) {
      // Remove from cart if already in cart
      removeFromCart(inCartItem.cartItemId || inCartItem.id);
      setSelectedPairMap(prev => {
        const copy = { ...prev };
        delete copy[pId];
        return copy;
      });
    } else {
      // Add directly to cart once with selected size
      const selSize = chosenSize || selectedPairMap[pId]?.selectedSize || pairProduct.sizes?.[0] || 'M';
      const selColor = selectedPairMap[pId]?.selectedColor || pairProduct.colors?.[0]?.name || 'Standard';
      const mrp = Number(pairProduct.originalPrice || pairProduct.original_price || pairProduct.mrp || pairProduct.price || 0);
      const singlePercent = Number(pairProduct.pairOffer?.discount_percent || 20);

      addToCart({
        ...pairProduct,
        originalPrice: mrp,
        price: pairProduct.price || mrp,
        isPairOffer: true,
        pairParentId: activeProduct?.id ?? null,
        pairOffer: {
          enabled: true,
          discount_percent: singlePercent
        }
      }, selSize, selColor, 1);

      setSelectedPairMap(prev => ({
        ...prev,
        [pId]: {
          product: pairProduct,
          selectedSize: selSize,
          selectedColor: selColor,
          quantity: 1
        }
      }));

      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    }
  };

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleAddToCart = (e) => {
    if (!activeProduct || stockCount <= 0) return;
    setIsAddingToCart(true);

    // Show popover near the button
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPopoverPosition({ x: rect.left + rect.width / 2, y: rect.top });
    }

    setTimeout(() => {
      const sizePrice = getSizePrice(activeProduct, selectedSize);
      const sizeOriginalPrice = getSizeOriginalPrice(activeProduct, selectedSize, sizePrice);
      addToCart(activeProduct, selectedSize, activeColorObj, quantity, sizePrice, sizeOriginalPrice);
      setIsAddingToCart(false);
      setShowAddedPopover(true);
      setTimeout(() => setShowAddedPopover(false), 3000);
      
      // Auto scroll smoothly to Pair Well With section on desktop
      setTimeout(() => {
        if (window.innerWidth >= 768 && pairsWellRef.current) {
          pairsWellRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300);
    }, 200);
  };

  const goToPrevImage = () => setSelectedImgIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
  const goToNextImage = () => setSelectedImgIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);
  const handleQuantityChange = (delta) => setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));

  const scrollPairsWell = (direction) => {
    if (pairsWellRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      pairsWellRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollAlsoLike = (direction) => {
    if (alsoLikeRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      alsoLikeRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="pt-5 pb-5">
        <PdpSkeleton />
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
      <SEOHead
        title={activeProduct.metaTitle || `${activeProduct.name} | Premium Men's Apparel | ORDERLY`}
        description={activeProduct.metaDescription || activeProduct.description || "Shop premium luxury menswear at ORDERLY. Free shipping and cash on delivery in India."}
        keywords={activeProduct.metaKeywords || `${activeProduct.name}, men's apparel, luxury menswear, ORDERLY`}
        canonicalPath={`/product/${activeProduct.slug || activeProduct.id}`}
        image={activeProduct.images?.[0] || 'https://orderlymenswear.in/assets/media/logo-07E_iIRS.png'}
        type="product"
        product={activeProduct}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: activeProduct.category || 'Shop', url: `/shop?category=${activeProduct.category || ''}` },
          { name: activeProduct.name, url: `/product/${activeProduct.slug || activeProduct.id}` }
        ]}
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
          addMultipleToCart={addMultipleToCart}
          toggleWishlist={toggleWishlist}
          isWishlisted={isWishlisted}
          openQuickView={openQuickView}
          setShowSizeGuide={setShowSizeGuide}
          validSuggested={validSuggested}
          alsoLikeProducts={alsoLikeProducts}
          cart={cart}
          wishlist={wishlist}
          isMainProductInCart={isMainProductInCart}
          mainReqToast={mainReqToast}
          selectedPairMap={selectedPairMap}
          updatePairVariant={updatePairVariant}
          pairOfferPercent={multiPairOfferPercent}
        />
      </div>

      {/* ── Desktop PDP (>= 768px) ───────────────────────────────── */}
      <div className="orderly-desktop-pdp-wrapper">
        <main className="product-detail-page">
          {/* ── Toast Notifications ───────────────────────────────── */}
          {addedToast && (
            <div className="pdp-added-toast-banner">
              <FiCheck /> Item Added to Bag! Check Pair Well With suggestions below <FiArrowDown />
            </div>
          )}

          {mainReqToast && (
            <div className="pdp-main-req-toast-banner">
              <FiAlertCircle /> {mainReqToast}
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              MAIN PRODUCT SECTION — Clean 40% / 60% Layout
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <section className="pdp-main-section">
            {/* ── LEFT COLUMN: 40% Product Gallery ───────────────── */}
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

                {/* Main Hero Image Container */}
                <div className="pdp-main-image-box">
                  {/* Offer / Discount Badge */}
                  {discountPercent > 0 && (
                    <span className="pdp-discount-badge-overlay">-{discountPercent}% OFF</span>
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

                  {/* Fullscreen Trigger */}
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

            {/* ── RIGHT COLUMN: 60% Product Details & Actions ─────── */}
            <div className="pdp-info-col">
              <div className="pdp-info-inner">
                {/* 1. Breadcrumb */}
                <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
                  <Link to="/">Home</Link>
                  <FiChevronRight />
                  <Link to="/shop">Shop</Link>
                  <FiChevronRight />
                  <Link to={`/shop?category=${encodeURIComponent(activeProduct.category || 'All')}`}>
                    {activeProduct.category || 'Menswear'}
                  </Link>
                  <FiChevronRight />
                  <span className="pdp-crumb-current">{activeProduct.name}</span>
                </nav>

                {/* 2. Product Title */}
                <h1 className="pdp-product-name">{activeProduct.name}</h1>

                

                {/* 4. MRP & Current Selling Price */}
                <div className="pdp-price-row">
                  <span className="pdp-price-main">{formatPrice(currentPrice)}</span>
                  {Number(currentOriginalPrice || 0) > Number(currentPrice || 0) && (
                    <del className="pdp-price-original">{formatPrice(currentOriginalPrice)}</del>
                  )}
                  {discountPercent > 0 && (
                    <span className="pdp-off-tag">{discountPercent}% OFF</span>
                  )}
                </div>
                <p className="pdp-tax-note">Inclusive of all taxes. Free shipping on qualifying orders.</p>

                {/* 5. Existing Offer Information / Coupon Box */}
                {pdpCoupons.length > 0 && (
                  <div className="pdp-offers-card">
                    <div className="pdp-offers-heading">
                      <FiTag /> AVAILABLE OFFERS
                    </div>
                    {pdpCoupons.map((off, idx) => (
                      <div key={off.id || idx} className="pdp-offer-row">
                        <span className="pdp-offer-text">{off.description || `${off.discount_type === 'percentage' ? off.discount_value + '% off' : '₹' + off.discount_value + ' off'} on orders above ₹${Number(off.min_order || 0).toLocaleString('en-IN')}`}</span>
                        <div className="pdp-offer-code-row">
                          <span className="pdp-offer-code-label">Use Code:</span>
                          <span className="pdp-coupon-badge">{off.code}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. Color Options */}
                {activeProduct.colors && activeProduct.colors.length > 0 && (
                  <div className="pdp-option-group">
                    <label className="pdp-option-label">
                      Color: <strong>{selectedColor || 'Standard'}</strong>
                    </label>
                    <div className="pdp-color-swatches">
                      {activeProduct.colors.map((colorObj, idx) => {
                        const cName = typeof colorObj === 'object' ? colorObj.name : colorObj;
                        const cCode = typeof colorObj === 'object' ? (colorObj.code || colorObj.hex || '#333') : '#333';
                        const isSelected = selectedColor === cName;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`pdp-swatch ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedColor(cName);
                              setSelectedImgIndex(0);
                            }}
                            aria-label={`Select color ${cName}`}
                            title={cName}
                          >
                            <span
                              className="pdp-swatch-inner"
                              style={{ backgroundColor: cCode }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. Size Options */}
                {activeProduct.sizes && activeProduct.sizes.length > 0 && (
                  <div className="pdp-option-group">
                    <div className="pdp-size-header">
                      <label className="pdp-option-label">
                        Size: <strong>{selectedSize || 'Select Size'}</strong>
                      </label>
                      <button
                        type="button"
                        className="pdp-size-guide-link"
                        onClick={() => setShowSizeGuide(true)}
                      >
                        <FiEdit3 /> Size Guide
                      </button>
                    </div>
                    <div className="pdp-size-options">
                      {activeProduct.sizes.map((s, idx) => {
                        const isSelected = selectedSize === s;
                        const sStock = getVariantStock(activeProduct, selectedColor, s);
                        const isOutOfStock = sStock <= 0;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`pdp-size-option ${isSelected ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                            disabled={isOutOfStock}
                            onClick={() => setSelectedSize(s)}
                            aria-label={`Select size ${s}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 8. Stock Status Indicator */}
                <div className="pdp-stock-row">
                  {stockCount > 10 ? (
                    <span className="pdp-in-stock text-success">
                      <FiCheck /> In Stock — Ready for Express Dispatch
                    </span>
                  ) : stockCount > 0 ? (
                    <span className="pdp-low-stock text-warning">
                      <FiAlertCircle /> Only {stockCount} items left in stock — order soon!
                    </span>
                  ) : (
                    <span className="pdp-out-of-stock text-danger">
                      <FiAlertCircle /> Currently Sold Out in this variant
                    </span>
                  )}
                </div>

                {/* 9. Quantity Stepper + Prominent ADD TO CART Button + Wishlist */}
                <div className="pdp-actions-row">
                  <div className="pdp-qty-picker">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <FiMinus />
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= Math.min(10, stockCount || 10)}
                      aria-label="Increase quantity"
                    >
                      <FiPlus />
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`pdp-add-bag-btn ${isMainProductInCart ? 'in-cart-btn' : ''}`}
                    onClick={handleAddToCart}
                    disabled={stockCount <= 0 || isAddingToCart}
                  >
                    <FiShoppingBag />
                    {stockCount <= 0 
                      ? 'SOLD OUT' 
                      : isAddingToCart 
                        ? 'ADDING TO BAG...' 
                        : isMainProductInCart 
                          ? '✓ ADDED TO BAG' 
                          : 'ADD TO CART'}
                  </button>

                  <button
                    type="button"
                    className={`pdp-action-icon-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={() => toggleWishlist(activeProduct)}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    title={isWishlisted ? 'Wishlisted' : 'Save to Wishlist'}
                  >
                    <FiHeart />
                  </button>
                </div>

                {/* Added to Cart Popover */}
                {showAddedPopover && (
                  <div 
                    className="pdp-added-popover"
                    style={{ 
                      left: popoverPosition.x, 
                      top: popoverPosition.y - 60 
                    }}
                  >
                    <div className="pdp-popover-arrow" />
                    <div className="pdp-popover-content">
                      <FiCheckCircle className="text-success" size={20} />
                      <span className="fw-medium">{activeProduct?.name}</span>
                      <span className="text-muted extra-small">
                        {selectedSize && `Size: ${selectedSize}  •  `}
                        Qty: {quantity}  •  {formatPrice(currentPrice)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Main Product In Cart Feedback Pill */}
                {isMainProductInCart && (
                  <div className="pdp-main-in-cart-alert">
                    <FiCheckCircle className="text-success" />
                    <span><strong>{activeProduct.name}</strong> is in your bag. Pair Well With offers are now active below!</span>
                  </div>
                )}

                {/* 10. Trust & Service Guarantee Strip */}
                <div className="pdp-trust-strip">
                  <div className="pdp-trust-item">
                    <FiShield className="pdp-trust-icon" />
                    <div>
                      <strong>100% Original</strong>
                      <span>Guaranteed</span>
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
                    <FiLock className="pdp-trust-icon" />
                    <div>
                      <strong>Secure</strong>
                      <span>Checkout</span>
                    </div>
                  </div>
                </div>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    11. PAIR WELL WITH SECTION (Dynamic Visibility)
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {validSuggested.length > 0 && isMainProductInCart && (
                  <div className="pdp-pairs-section">
                    <div className="pdp-section-header d-flex align-items-center justify-content-between">
                      <div>
                        <h3 className="pdp-section-title">PAIR WELL WITH</h3>
                        <span className="pdp-section-subtitle">Complete your look with these styling pieces</span>
                      </div>
                      {/* Carousel Arrow Controls */}
                      {validSuggested.length > 2 && (
                        <div className="pdp-pairs-nav-controls">
                          <button
                            type="button"
                            className="pdp-pairs-nav-btn"
                            onClick={() => scrollPairsWell('left')}
                            aria-label="Scroll pairs left"
                          >
                            <FiChevronLeft />
                          </button>
                          <button
                            type="button"
                            className="pdp-pairs-nav-btn"
                            onClick={() => scrollPairsWell('right')}
                            aria-label="Scroll pairs right"
                          >
                            <FiChevronRight />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Offer Status Banner (Single Row Layout with Brand Theme Colors) */}
                    {pairCountInCart === 0 ? (
                      <div className="pdp-pair-offer-banner idle">
                        <div className="pdp-pair-banner-content pdp-pair-single-row">
                          <div className="pdp-pair-left-badges">
                            <span className="pdp-pair-badge-pill theme-active"><FiTag /> SPECIAL OFFER</span>
                            <span className="pdp-pair-offer-headline">Pair Well With Offer: Flat {multiPairOfferPercent}% OFF on ALL items</span>
                          </div>
                        </div>
                      </div>
                    ) : pairCountInCart === 1 ? (
                      <div className="pdp-pair-offer-banner progress-unlock">
                        <div className="pdp-pair-banner-content">
                          <div className="pdp-pair-single-row mb-1">
                            <div className="pdp-pair-left-badges">
                              <span className="pdp-pair-badge-pill warning"><FiGift /> UNLOCK OFFER</span>
                              <span className="pdp-pair-offer-headline">Add 1 more product for flat {multiPairOfferPercent}% OFF on ALL items!</span>
                            </div>
                            <div className="pdp-pair-right-badges">
                              <span className="badge bg-danger text-white fw-bold px-2 py-1 extra-small">1/2 Added</span>
                            </div>
                          </div>
                          <div className="pdp-pair-progress-bar-bg">
                            <div className="pdp-pair-progress-bar-fill" style={{ width: '50%' }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pdp-pair-offer-banner unlocked">
                        <div className="pdp-pair-banner-content pdp-pair-single-row">
                          <div className="pdp-pair-left-badges">
                            <span className="pdp-pair-badge-pill theme-active"><FiCheckCircle /> OFFER ACTIVE</span>
                            <span className="pdp-pair-offer-headline">🎉 {multiPairOfferPercent}% OFF UNLOCKED ON ALL ITEMS</span>
                          </div>
                          <div className="pdp-pair-right-badges">
                            {pricingBreakdown?.totalSavings > 0 && (
                              <span className="pdp-pair-savings-pill">YOU SAVE {formatPrice(pricingBreakdown.totalSavings)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Horizontal Product Carousel / Slider */}
                    <div className="pdp-pairs-carousel-wrap">
                      <div className="pdp-pairs-grid pdp-pairs-carousel" ref={pairsWellRef}>
                        {validSuggested.map((item, idx) => {
                          const isInCart = distinctPairIdsInCart.has(String(item.id));
                          const currentSelectedSize = selectedPairMap[String(item.id)]?.selectedSize || item.sizes?.[0] || 'M';
                          const mrp = Number(item.originalPrice ?? item.original_price ?? item.mrp ?? item.price ?? 0);
                          const singleDiscountPercent = Number(item.pairOffer?.discount_percent ?? 20);
                          
                          const cardDisplayPrice = isMultiOfferUnlocked || pairCountInCart >= 2
                            ? Math.max(0, Math.round(mrp * (1 - multiPairOfferPercent / 100)))
                            : Math.max(0, Math.round(mrp * (1 - singleDiscountPercent / 100)));

                          return (
                            <div 
                              key={item.id || idx} 
                              className={`pdp-pair-card ${isInCart ? 'selected in-cart' : ''}`}
                            >
                              <div className="pdp-pair-img-wrap" onClick={() => handleTogglePairInCart(item, currentSelectedSize)}>
                                {getSafeProductImage(item) ? (
                                  <img src={getSafeProductImage(item)} alt={item.name || 'Product'} />
                                ) : (
                                  <div className="pdp-pair-img-placeholder">
                                    <span>No Image</span>
                                  </div>
                                )}
                                <span className={`pdp-pair-badge ${(isMultiOfferUnlocked || pairCountInCart >= 2) ? 'highlight' : ''}`}>
                                  {(isMultiOfferUnlocked || pairCountInCart >= 2) ? `${multiPairOfferPercent}% OFF` : `${singleDiscountPercent}% OFF`}
                                </span>
                              </div>

                              <div className="pdp-pair-info">
                                <h5 className="pdp-pair-name" onClick={() => handleTogglePairInCart(item, currentSelectedSize)} title={item.name}>
                                  {item.name}
                                </h5>
                                
                                <div className="pdp-pair-price">
                                  <span className="pdp-pair-from">offer </span>
                                  <strong className="pdp-pair-selling-price">{formatPrice(cardDisplayPrice)}</strong>
                                  {mrp > cardDisplayPrice && (
                                    <del className="pdp-pair-old">{formatPrice(mrp)}</del>
                                  )}
                                </div>

                                {/* Size selector */}
                                {Array.isArray(item.sizes) && item.sizes.length > 0 && (
                                  <div className="pdp-pair-variant-picker mb-1">
                                    <span className="extra-small text-muted me-1">Size:</span>
                                    <select 
                                      className="pdp-pair-select-sm"
                                      value={currentSelectedSize}
                                      onChange={(e) => {
                                        const newSize = e.target.value;
                                        updatePairVariant(item.id, { selectedSize: newSize });
                                        if (isInCart) {
                                          handleTogglePairInCart(item, newSize);
                                        }
                                      }}
                                    >
                                      {item.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                )}

                                {item.rating && (
                                  <div className="pdp-pair-rating">
                                    <span className="pdp-pair-stars">{renderStars(item.rating)}</span>
                                    <span className="pdp-pair-count">({item.reviewsCount || 18})</span>
                                  </div>
                                )}

                                <div className="pdp-pair-actions">
                                  <button
                                    type="button"
                                    className="pdp-pair-quick-view"
                                    onClick={() => openQuickView(item)}
                                    title="Quick Preview"
                                  >
                                    <FiEye /> VIEW
                                  </button>
                                  
                                  <button
                                    type="button"
                                    className={`pdp-pair-select-toggle-btn ${isInCart ? 'active in-cart' : ''}`}
                                    onClick={() => handleTogglePairInCart(item, currentSelectedSize)}
                                  >
                                    {isInCart ? <><FiCheck /> In Bag</> : <><FiPlus /> Add to Bag</>}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                    <li>Free standard shipping on orders with multi-pair offers</li>
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
                      Based on {activeProduct.reviewsCount || 24} customer reviews
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
