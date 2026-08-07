import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiStar, FiHeart, FiShoppingBag, FiShield, 
  FiRefreshCw, FiChevronRight, FiCheck, FiArrowDown, FiAlertCircle, FiEye 
} from 'react-icons/fi';
import SEO from '../components/common/SEO';
import ProductCard from '../components/product/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useQuickView } from '../context/QuickViewContext';
import { getProductById, getProducts } from '../services/api';
import { formatPrice, calculateDiscount } from '../utils/formatters';
import './ProductDetail.css';

// Universal bulletproof stock resolution helper
export const getVariantStock = (productObj, colorVal, sizeVal) => {
  if (!productObj) return 0;
  if (productObj.status === 'Draft') return 0;

  // 1. If total inventory across all variants is 0, entire product is out of stock!
  if (productObj.inventory && Object.keys(productObj.inventory).length > 0) {
    const totalInventoryStock = Object.values(productObj.inventory).reduce((sum, val) => sum + Number(val || 0), 0);
    if (totalInventoryStock <= 0) {
      return 0;
    }
  }

  // 2. Check if product.stock is explicitly 0 (when no inventory matrix dictionary is defined)
  if (productObj.stock !== undefined && Number(productObj.stock) <= 0 && (!productObj.inventory || Object.keys(productObj.inventory).length === 0)) {
    return 0;
  }

  const colorName = (typeof colorVal === 'object' ? colorVal?.name : colorVal) || productObj.colors?.[0]?.name || '';
  const sizeName = String(sizeVal || '').trim();

  if (productObj.inventory && Object.keys(productObj.inventory).length > 0) {
    // 3. Exact key match: "Pure White-XXL"
    const key1 = `${colorName}-${sizeName}`;
    if (productObj.inventory[key1] !== undefined) return Number(productObj.inventory[key1]);

    // 4. Spaced key match: "Pure White - XXL"
    const key2 = `${colorName} - ${sizeName}`;
    if (productObj.inventory[key2] !== undefined) return Number(productObj.inventory[key2]);

    // 5. Case-insensitive & partial color key match
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

    // 6. Size-only fallback match: "XXL"
    if (productObj.inventory[sizeName] !== undefined) return Number(productObj.inventory[sizeName]);
  }

  // 7. Total product stock fallback
  if (productObj.stock !== undefined) return Number(productObj.stock);

  // Default to 0 if inventory exists but variant is unlisted
  return 0;
};

// Safe image extractor to prevent Cannot read properties of null (reading '0')
const getSafeProductImage = (item) => {
  if (item && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0];
  }
  if (item && Array.isArray(item.colors) && item.colors[0] && Array.isArray(item.colors[0].images) && item.colors[0].images[0]) {
    return item.colors[0].images[0];
  }
  return '';
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { openQuickView } = useQuickView();

  const pairsWellRef = useRef(null);

  // All product data comes from the Admin-managed DB — no static fallbacks.
  const [product, setProduct] = useState(null);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('specs');
  const [addedToast, setAddedToast] = useState(false);

  // Load product from DB API — suggestions come from the admin-chosen
  // "Pairs Well With" products (product.suggested_products).
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setNotFound(false);
      const res = await getProductById(id);
      if (res && res.success && res.data) {
        const item = res.data;
        setProduct(item);
        setSelectedColor(item.colors?.[0]?.name || '');
        setSelectedSize(item.sizes?.[0] || '');
        setSelectedImgIndex(0);

        // Fetch catalog to resolve suggested product IDs selected by admin.
        const relRes = await getProducts();
        if (relRes && relRes.success && Array.isArray(relRes.data)) {
          const catalog = relRes.data.filter(p => p && String(p.id) !== String(item.id));
          const chosenIds = Array.isArray(item.suggested_products) ? item.suggested_products : [];
          const chosen = chosenIds
            .map(sid => catalog.find(p => String(p.id) === String(sid)))
            .filter(Boolean);
          setSuggestedProducts(chosen.length > 0 ? chosen.slice(0, 4) : []);
        }
      } else {
        setProduct(null);
        setSuggestedProducts([]);
        setNotFound(true);
      }
      setLoading(false);
    };

    fetchProductData();

    // Listen for storage updates when admin modifies stock in another tab or same window
    const handleStorageChange = () => {
      fetchProductData();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('orderly_products_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderly_products_updated', handleStorageChange);
    };
  }, [id]);

  const activeProduct = product;

  // Active color object & image gallery
  const activeColorObj = activeProduct?.colors?.find(c => c && c.name === selectedColor) || activeProduct?.colors?.[0];
  const galleryImages = (activeColorObj?.images && activeColorObj.images.length > 0)
    ? activeColorObj.images
    : (activeProduct?.images && activeProduct.images.length > 0 ? activeProduct.images : []);

  const currentMainImg = galleryImages[selectedImgIndex] || galleryImages[0] || '';

  const isWishlisted = wishlist.some(item => item && String(item.id) === String(activeProduct?.id));
  const discountPercent = calculateDiscount(activeProduct?.originalPrice, activeProduct?.price);

  // Strict bulletproof stock calculation logic
  const stockCount = activeProduct ? getVariantStock(activeProduct, selectedColor, selectedSize) : 0;

  // Add to Bag action
  const handleAddToCart = () => {
    if (!activeProduct || stockCount <= 0) return;
    addToCart(activeProduct, selectedSize, activeColorObj);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3500);

    // Smooth focus to "PAIRS WELL WITH / POPULAR PICKS"
    if (pairsWellRef.current) {
      pairsWellRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5 my-5 text-white">
        <span className="spinner-border text-danger" role="status" />
        <p className="mt-2 text-muted">Loading product details...</p>
      </div>
    );
  }

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

  return (
    <>
      <SEO 
        title={`${activeProduct.name} | ORDERLY Menswear`}
        description={activeProduct.description}
      />

      <main className="product-detail-page container-fluid px-lg-5 py-4">
        {/* Toast alert on add to bag */}
        {addedToast && (
          <div className="pdp-added-toast-banner">
            <FiCheck /> Item Added to Bag! Check popular picks below... <FiArrowDown />
          </div>
        )}

        {/* Ajio Breadcrumbs */}
        <nav className="breadcrumb-nav mb-4">
          <Link to="/">Home</Link> <FiChevronRight />
          <Link to="/shop">Shop</Link> <FiChevronRight />
          <Link to={`/shop?category=${encodeURIComponent(activeProduct.category || 'All')}`}>{activeProduct.category}</Link> <FiChevronRight />
          <span className="current-crumb">{activeProduct.name}</span>
        </nav>

        <div className="row g-4 lg-g-5 mb-5">
          {/* Left Column: Vertical Image Gallery + Main Image */}
          <div className="col-lg-7">
            <div className="d-flex flex-column flex-md-row gap-3">
              {/* Vertical Thumbnail List */}
              {galleryImages.length > 1 && (
                <div className="thumbnail-list-wrapper order-2 order-md-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImgIndex(idx)}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image Viewer */}
              <div className="main-image-wrapper order-1 order-md-2 flex-grow-1">
                {activeProduct.badge && (
                  <span className="pdp-badge">{activeProduct.badge}</span>
                )}
                {currentMainImg ? (
                  <img src={currentMainImg} alt={activeProduct.name} className="pdp-main-img" />
                ) : (
                  <div className="pdp-main-img pdp-img-placeholder d-flex align-items-center justify-content-center">
                    <span className="text-muted">No Image Available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sticky Column: Details, Purchase Actions & Popular Picks */}
          <div className="col-lg-5">
            <div className="pdp-details-sticky">
              {activeProduct.brand && <span className="pdp-brand-name">{activeProduct.brand}</span>}
              <h1 className="pdp-product-title">{activeProduct.name}</h1>

              {/* Rating & Reviews */}
              {(activeProduct.rating || activeProduct.reviewsCount) && (
                <div className="pdp-rating-row mb-3">
                  <div className="rating-pill">
                    <FiStar className="star-fill" />
                    <span>{activeProduct.rating || 4.8}</span>
                  </div>
                  {activeProduct.reviewsCount && (
                    <>
                      <span className="rating-divider">|</span>
                      <span className="reviews-text">{activeProduct.reviewsCount} Customer Reviews</span>
                    </>
                  )}
                </div>
              )}

              {/* Pricing Box in ₹ INR */}
              <div className="pdp-price-box mb-4">
                <div className="d-flex align-items-baseline gap-3">
                  <span className="pdp-price">{formatPrice(activeProduct.price)}</span>
                  {activeProduct.originalPrice && (
                    <span className="pdp-old-price">{formatPrice(activeProduct.originalPrice)}</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="pdp-discount-tag">{discountPercent}% OFF</span>
                  )}
                </div>
                <p className="taxes-inclusive-text">Inclusive of all taxes</p>
              </div>

              <hr className="divider-line mb-4" />

              {/* Color Swatch Selector */}
              {activeProduct.colors && activeProduct.colors.length > 0 && (
                <div className="pdp-option-group mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="option-label">COLOR: <strong>{selectedColor}</strong></span>
                  </div>
                  <div className="color-swatches-row">
                    {activeProduct.colors.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`pdp-color-swatch ${selectedColor === color.name ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedColor(color.name);
                          setSelectedImgIndex(0);
                        }}
                        title={color.name}
                      >
                        <span className="swatch-inner" style={{ backgroundColor: color.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {activeProduct.sizes && activeProduct.sizes.length > 0 && (
                <div className="pdp-option-group mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="option-label">SELECT SIZE: <strong>{selectedSize}</strong></span>
                    <button 
                      className="size-guide-btn" 
                      onClick={() => setShowSizeGuide(true)}
                    >
                      Size Chart
                    </button>
                  </div>
                  <div className="size-buttons-row">
                    {activeProduct.sizes.map((sz, idx) => {
                      const szStock = getVariantStock(activeProduct, selectedColor, sz);
                      const isOut = szStock <= 0;
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`pdp-size-btn ${selectedSize === sz ? 'active' : ''} ${isOut ? 'size-btn-out' : ''}`}
                          onClick={() => setSelectedSize(sz)}
                        >
                          {sz} {isOut && <span className="slash-cross">✕</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status Indicator - Hide number unless stock <= 3 */}
              <div className="pdp-stock-status mb-4">
                {stockCount > 3 ? (
                  <span className="stock-in"><FiCheck /> In Stock</span>
                ) : stockCount > 0 ? (
                  <span className="stock-limited-badge d-inline-flex align-items-center gap-2">
                    <FiAlertCircle /> Limited Stock - Only {stockCount} left!
                  </span>
                ) : (
                  <span className="stock-out-badge d-inline-flex align-items-center gap-2">
                    <FiAlertCircle /> OUT OF STOCK FOR {selectedColor?.toUpperCase()} ({selectedSize})
                  </span>
                )}
              </div>

              {/* Primary Actions: Add to Bag & Wishlist */}
              <div className="pdp-actions-row d-flex gap-3 mb-4">
                <button
                  className={`btn-primary-orderly pdp-cart-btn flex-grow-1 ${stockCount <= 0 ? 'btn-disabled-stock' : ''}`}
                  onClick={handleAddToCart}
                  disabled={stockCount <= 0}
                >
                  <FiShoppingBag /> {stockCount > 0 ? 'ADD TO BAG' : 'OUT OF STOCK'}
                </button>

                <button
                  className={`btn-outline-orderly pdp-wish-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={() => toggleWishlist(activeProduct)}
                >
                  <FiHeart /> {isWishlisted ? 'WISHLISTED' : 'SAVE'}
                </button>
              </div>

              {/* PAIRS WELL WITH / POPULAR PICKS — admin-selected suggestions */}
              {validSuggested.length > 0 && (
                <div ref={pairsWellRef} className="pairs-well-theme-card mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="pairs-well-theme-title mb-0">PAIRS WELL WITH</h4>
                  </div>

                  <div className="pairs-well-list">
                    {validSuggested.slice(0, 2).map((item, idx) => (
                      <div key={item.id || idx} className="pairs-well-item-row">
                        {/* Left Thumbnail Image with Badge */}
                        <div className="pairs-img-wrapper">
                          {getSafeProductImage(item) ? (
                            <img src={getSafeProductImage(item)} alt={item.name || 'Product'} className="pairs-img-thumb" />
                          ) : (
                            <div className="pairs-img-thumb pairs-img-placeholder d-flex align-items-center justify-content-center">
                              <span className="text-muted extra-small">No Image</span>
                            </div>
                          )}
                        </div>

                        {/* Right Details Column */}
                        <div className="pairs-info-col">
                          <div className="pairs-info-top">
                            <h5 className="pairs-item-name">{item.name}</h5>
                            <div className="pairs-item-price">
                              <span className="pairs-from-label">from </span>
                              <strong className="pairs-price-val">{formatPrice(item.price)}</strong>
                            </div>
                            {item.rating && (
                              <div className="pairs-item-stars">
                                <span className="star-fill">★★★★★</span>
                                <span className="reviews-count-text"> ({item.reviewsCount || 0})</span>
                              </div>
                            )}
                          </div>

                          <div className="d-flex gap-3 mt-2">
                            <button 
                              type="button"
                              className="btn-theme-view-options flex-grow-1"
                              onClick={() => openQuickView(item)}
                            >
                              <FiEye className="me-1" /> QUICK VIEW
                            </button>

                            <button 
                              type="button"
                              className={`btn-theme-add-bag flex-grow-1 ${!isMainProductInCart ? 'btn-disabled-pair' : ''}`}
                              disabled={!isMainProductInCart}
                              onClick={() => {
                                if (!isMainProductInCart) return;
                                if (item.colors?.length > 1 || item.sizes?.length > 1) {
                                  openQuickView(item);
                                } else {
                                  addToCart({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    originalPrice: item.originalPrice || item.original_price,
                                    image: getSafeProductImage(item),
                                    quantity: 1,
                                    selectedColor: item.colors?.[0]?.name || 'Standard',
                                    selectedSize: item.sizes?.[0] || 'M'
                                  });
                                }
                              }}
                              title={!isMainProductInCart ? "Add main item to bag first" : "Add to Bag"}
                            >
                              <FiShoppingBag className="me-1" /> {isMainProductInCart ? 'ADD TO BAG' : 'ADD MAIN ITEM FIRST'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="pdp-features-grid py-2">
                <div className="feature-item">
                  <FiShield /> 100% Genuine Handpicked Quality
                </div>
                <div className="feature-item">
                  <FiRefreshCw /> 15 Days Easy Returns & Exchanges
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Specifications */}
        <section className="pdp-tabs-section my-5">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              PRODUCT SPECIFICATIONS
            </button>
            <button 
              className={`tab-btn ${activeTab === 'desc' ? 'active' : ''}`}
              onClick={() => setActiveTab('desc')}
            >
              DESCRIPTION & CARE
            </button>
          </div>

          <div className="tab-content-container py-4">
            {activeTab === 'specs' && (
              <div className="row g-3">
                {activeProduct.specifications?.map((spec, i) => (
                  <div key={i} className="col-md-6 col-lg-4">
                    <div className="spec-card">
                      <span className="spec-label">{spec.label}</span>
                      <span className="spec-val">{spec.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'desc' && (
              <div className="desc-box">
                <p className="lead">{activeProduct.description}</p>
              </div>
            )}
          </div>
        </section>

        {/* Bottom Related Section — admin-selected suggestions */}
        {validSuggested.length > 0 && (
          <section className="related-products-section my-5">
            <h2 className="section-title mb-4">YOU MAY ALSO LIKE</h2>
            <div className="row g-3 g-md-4">
              {validSuggested.map(rel => (
                <div key={rel.id} className="col-6 col-md-3">
                  <ProductCard product={rel} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="size-modal-backdrop" onClick={() => setShowSizeGuide(false)}>
          <div className="size-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-dark">
              <h3 className="mb-0">Size Chart Guide</h3>
              <button className="btn-close-modal" onClick={() => setShowSizeGuide(false)}>✕</button>
            </div>
            <table className="table table-dark table-bordered text-center align-middle">
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
    </>
  );
};

export default ProductDetail;
