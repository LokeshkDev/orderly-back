import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiX, FiSliders, FiGrid, FiList, FiChevronRight, FiChevronLeft, FiHeart, FiShoppingBag } from 'react-icons/fi';
import SEO from '../components/common/SEO';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { getProducts, matchesCategoryAlias, getCategories, getBrands } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, calculateDiscount } from '../utils/formatters';
import MobileShop from './MobileShop';
import './Shop.css';

const DEFAULT_BRANDS = ['Orderly', 'U.S. Polo', 'Nike', 'Adidas', 'Jack & Jones'];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  
  const categoryParam = searchParams.get('category') || 'All';
  const brandParam = searchParams.get('brand') || 'All';
  const searchParam = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [minPrice, setMinPrice] = useState(499);
  const [maxPrice, setMaxPrice] = useState(4999);
  const [appliedMinPrice, setAppliedMinPrice] = useState(499);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(50000);
  const [sortBy, setSortBy] = useState('popularity');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [gridCols, setGridCols] = useState(4); // 1 (single), 3, 4, or 5
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState(DEFAULT_BRANDS);

  const itemsPerPage = 10;

  // Load category/brand filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([getCategories(), getBrands()]);
        if (catRes && catRes.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
          const activeCats = catRes.data.filter(c => c.is_active !== false).map(c => c.name);
          if (activeCats.length > 0) setCategoryOptions(activeCats);
        }

        if (brandRes && brandRes.success && Array.isArray(brandRes.data) && brandRes.data.length > 0) {
          const activeBrands = brandRes.data.filter(b => b.is_active !== false).map(b => b.name);
          if (activeBrands.length > 0) setBrandOptions(activeBrands);
        }
      } catch (err) {
        console.warn('Failed to load filter options:', err.message);
      }
    };
    loadFilters();
  }, []);

  // Sync state when URL params change
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSelectedBrand(brandParam);
  }, [categoryParam, brandParam]);

  // Fetch complete product dataset from API
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const res = await getProducts();
      if (res && res.success && Array.isArray(res.data)) {
        setProductsList(res.data);
      } else {
        setProductsList([]);
      }
      setLoading(false);
    };

    loadProducts();

    const handleStorageChange = () => {
      loadProducts();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    window.addEventListener('orderly_products_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
      window.removeEventListener('orderly_products_updated', handleStorageChange);
    };
  }, []);

  // Calculate dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    singles.forEach(p => {
      const cat = p.category || 'Shirts';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [productsList]);

  // Calculate dynamic brand counts
  const brandCounts = useMemo(() => {
    const counts = {};
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    singles.forEach(p => {
      const b = p.brand || 'Orderly';
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [productsList]);

  const sizesList = useMemo(() => {
    const all = Array.from(new Set(productsList.flatMap(p => p.sizes || []).filter(Boolean)));
    const priority = ['S', 'M', 'L', 'XL', 'XXL'];
    return priority.filter(sz => all.includes(sz) || true);
  }, [productsList]);

  // Filtered & Sorted products calculation
  const filteredProducts = useMemo(() => {
    let result = productsList.filter(product => {
      if (!product) return false;
      if (product.type === 'combo' || product.is_combo || product.pieces_count || String(product.id).startsWith('combo-')) {
        return false;
      }
      if (selectedCategory !== 'All' && !matchesCategoryAlias(product.category, selectedCategory)) {
        return false;
      }
      if (selectedBrand !== 'All' && product.brand?.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      if (selectedColor !== 'All' && !product.colors?.some(c => c.name === selectedColor)) {
        return false;
      }
      if (selectedSize !== 'All' && !product.sizes?.includes(selectedSize)) {
        return false;
      }
      if (product.price < appliedMinPrice || product.price > appliedMaxPrice) {
        return false;
      }
      if (inStockOnly) {
        const totalStock = Object.values(product.inventory || {}).reduce((a, b) => a + Number(b || 0), 0);
        if (totalStock <= 0) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'newest') return b.id - a.id;
      return 0; // popularity / featured
    });
  }, [productsList, selectedCategory, selectedBrand, selectedColor, selectedSize, appliedMinPrice, appliedMaxPrice, sortBy, inStockOnly]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleApplyPriceFilter = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedColor('All');
    setSelectedSize('All');
    setMinPrice(499);
    setMaxPrice(4999);
    setAppliedMinPrice(0);
    setAppliedMaxPrice(50000);
    setInStockOnly(false);
    setSortBy('popularity');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedBrand !== 'All' || selectedColor !== 'All' || selectedSize !== 'All' || appliedMaxPrice < 50000 || inStockOnly || searchParam !== '';

  const displayCategoryList = categoryOptions.length > 0 ? categoryOptions : ['Shirts', 'T-Shirts', 'Pants', 'Jackets', 'Hoodies & Sweatshirts', 'Accessories'];

  return (
    <>
      <SEO 
        title={`${selectedCategory !== 'All' ? selectedCategory : 'Shop All'} Products | ORDERLY Mens Wear`}
        description="Shop luxury men's apparel including shirts, t-shirts, selvedge denim, trousers and blazers at ORDERLY."
      />

      {/* MOBILE SHOP VIEW (< 768px): Dedicated Mobile App Shopping Experience */}
      <MobileShop />

      {/* DESKTOP SHOP VIEW (>= 768px): 100% Unchanged Desktop Shop Layout */}
      <main className="orderly-shop-page desktop-only">
        {/* 1. SHOP HERO BANNER MATCHING REFERENCE SCREENSHOT */}
        <div className="shop-hero-banner">
          <div className="shop-hero-overlay" />
          <div className="shop-hero-bg-graphic" />

          <div className="container-fluid px-lg-5 position-relative z-2">
            <span className="shop-hero-eyebrow">SHOP &rarr;</span>
            <h1 className="shop-hero-title">
              {selectedCategory !== 'All' ? selectedCategory.toUpperCase() : 'ALL PRODUCTS'}
            </h1>

            {/* Breadcrumb Navigation */}
            <div className="shop-breadcrumb">
              <Link to="/" className="breadcrumb-link">Home</Link>
              <span className="breadcrumb-sep">&gt;</span>
              <Link to="/shop" className="breadcrumb-link">Shop</Link>
              <span className="breadcrumb-sep">&gt;</span>
              <span className="breadcrumb-current">
                {selectedCategory !== 'All' ? selectedCategory : 'All Products'}
              </span>
            </div>
          </div>
        </div>

        <div className="container-fluid px-lg-5 py-4">
          <div className="shop-main-layout">
            
            {/* 2. DESKTOP FILTER SIDEBAR (~260px) */}
            <aside className="shop-sidebar-column d-none d-lg-block">
              <div className="desktop-filter-card">
                {/* Sidebar Header */}
                <div className="filter-card-header">
                  <div className="d-flex align-items-center gap-2">
                    <FiSliders className="text-danger" />
                    <h3 className="filter-card-title">FILTERS</h3>
                  </div>
                  <button type="button" className="clear-all-link" onClick={clearAllFilters}>
                    Clear All
                  </button>
                </div>

                {/* Categories Group */}
                <div className="filter-group-block">
                  <h4 className="filter-group-heading">CATEGORIES</h4>
                  <div className="filter-checkbox-list">
                    {displayCategoryList.map((cat, idx) => {
                      const count = categoryCounts[cat] || (120 - idx * 18);
                      const isChecked = selectedCategory === cat;
                      return (
                        <label key={idx} className="filter-check-item">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedCategory('All');
                                setSearchParams({});
                              } else {
                                setSelectedCategory(cat);
                                setSearchParams({ category: cat });
                              }
                              setCurrentPage(1);
                            }}
                          />
                          <span className="check-label-text">{cat}</span>
                          <span className="count-muted">({count})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Brand Group */}
                <div className="filter-group-block">
                  <h4 className="filter-group-heading">BRAND</h4>
                  <div className="filter-checkbox-list">
                    {brandOptions.map((brand, idx) => {
                      const count = brandCounts[brand] || (156 - idx * 30);
                      const isChecked = selectedBrand === brand;
                      return (
                        <label key={idx} className="filter-check-item">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedBrand(isChecked ? 'All' : brand);
                              setCurrentPage(1);
                            }}
                          />
                          <span className="check-label-text">{brand}</span>
                          <span className="count-muted">({count})</span>
                        </label>
                      );
                    })}
                    <span className="view-more-brands">+ View More</span>
                  </div>
                </div>

                {/* Price Filter Slider & Inputs */}
                <div className="filter-group-block">
                  <h4 className="filter-group-heading">PRICE</h4>
                  
                  <div className="price-slider-wrap mb-3">
                    <input 
                      type="range"
                      min="499"
                      max="10000"
                      step="500"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="price-slider-red w-100"
                    />
                    <div className="d-flex justify-content-between price-slider-labels">
                      <span>₹{minPrice}</span>
                      <span>₹{maxPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="price-inputs-row mb-3">
                    <div className="price-input-box">
                      <span className="rupee-symbol">₹</span>
                      <input 
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        className="price-num-field"
                      />
                    </div>
                    <span className="to-text">TO</span>
                    <div className="price-input-box">
                      <span className="rupee-symbol">₹</span>
                      <input 
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="price-num-field"
                      />
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="btn-apply-filter-red w-100"
                    onClick={handleApplyPriceFilter}
                  >
                    APPLY FILTER
                  </button>
                </div>

                {/* Size Chips Group */}
                <div className="filter-group-block">
                  <h4 className="filter-group-heading">SIZE</h4>
                  <div className="sizes-chips-row">
                    {['S', 'M', 'L', 'XL', 'XXL'].map((sz, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`size-chip-box ${selectedSize === sz ? 'active' : ''}`}
                        onClick={() => setSelectedSize(selectedSize === sz ? 'All' : sz)}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Availability */}
                <div className="filter-group-block">
                  <h4 className="filter-group-heading">AVAILABILITY</h4>
                  <label className="filter-check-item">
                    <input 
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    <span className="check-label-text">Exclude Out of Stock</span>
                  </label>
                </div>
              </div>
            </aside>

            {/* 3. RIGHT PRODUCT CONTENT COLUMN */}
            <main className="shop-content-column">
              {/* Product Toolbar */}
              <div className="shop-product-toolbar">
                <div className="toolbar-left d-flex align-items-center gap-2">
                  <div className="view-toggle-btns">
                    <button 
                      type="button" 
                      className={`view-btn ${gridCols === 1 ? 'active' : ''}`}
                      onClick={() => setGridCols(1)}
                      title="Table View (Single Column)"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                      </svg>
                    </button>
                    <button 
                      type="button" 
                      className={`view-btn ${gridCols === 3 ? 'active' : ''}`}
                      onClick={() => setGridCols(3)}
                      title="3 Columns Grid"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="3" width="5" height="18" rx="1" />
                        <rect x="9.5" y="3" width="5" height="18" rx="1" />
                        <rect x="17" y="3" width="5" height="18" rx="1" />
                      </svg>
                    </button>
                    <button 
                      type="button" 
                      className={`view-btn ${gridCols === 4 ? 'active' : ''}`}
                      onClick={() => setGridCols(4)}
                      title="4 Columns Grid"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="3" width="3.8" height="18" rx="0.8" />
                        <rect x="7.6" y="3" width="3.8" height="18" rx="0.8" />
                        <rect x="13.2" y="3" width="3.8" height="18" rx="0.8" />
                        <rect x="18.8" y="3" width="3.8" height="18" rx="0.8" />
                      </svg>
                    </button>
                    <button 
                      type="button" 
                      className={`view-btn ${gridCols === 5 ? 'active' : ''}`}
                      onClick={() => setGridCols(5)}
                      title="5 Columns Grid"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="1.5" y="3" width="3" height="18" rx="0.8" />
                        <rect x="6" y="3" width="3" height="18" rx="0.8" />
                        <rect x="10.5" y="3" width="3" height="18" rx="0.8" />
                        <rect x="15" y="3" width="3" height="18" rx="0.8" />
                        <rect x="19.5" y="3" width="3" height="18" rx="0.8" />
                      </svg>
                    </button>
                  </div>

                  <span className="showing-products-count">
                    Showing 1–{Math.min(itemsPerPage, filteredProducts.length)} of {filteredProducts.length} Products
                  </span>
                </div>

                <div className="toolbar-right d-flex align-items-center gap-2">
                  <span className="sort-by-label">Sort By:</span>
                  <select 
                    className="orderly-custom-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest Arrivals</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {hasActiveFilters && (
                <div className="shop-active-chips-bar">
                  <span className="chips-title">Active Filters:</span>
                  {selectedCategory !== 'All' && (
                    <span className="active-chip">
                      {selectedCategory} <FiX onClick={() => { setSelectedCategory('All'); setSearchParams({}); }} />
                    </span>
                  )}
                  {selectedBrand !== 'All' && (
                    <span className="active-chip">
                      Brand: {selectedBrand} <FiX onClick={() => setSelectedBrand('All')} />
                    </span>
                  )}
                  {selectedSize !== 'All' && (
                    <span className="active-chip">
                      Size: {selectedSize} <FiX onClick={() => setSelectedSize('All')} />
                    </span>
                  )}
                  {appliedMaxPrice < 50000 && (
                    <span className="active-chip">
                      Max ₹{appliedMaxPrice} <FiX onClick={() => setAppliedMaxPrice(50000)} />
                    </span>
                  )}
                  <button type="button" className="reset-chips-btn" onClick={clearAllFilters}>
                    Clear All
                  </button>
                </div>
              )}

              {/* Dynamic Column Grid or Table View */}
              {loading ? (
                <div className={`desktop-shop-products-grid cols-${gridCols}`}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : paginatedProducts.length > 0 ? (
                gridCols === 1 ? (
                  /* ── Single View Table Format ────────────────── */
                  <div className="shop-table-wrapper">
                    <table className="shop-products-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category & Brand</th>
                          <th>Price</th>
                          <th>Stock Status</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map(product => {
                          const discount = calculateDiscount(product.originalPrice || product.original_price, product.price);
                          const isWishlisted = wishlist && wishlist.some(item => item && String(item.id) === String(product.id));
                          const prodImg = product.images?.[0] || product.image || '';

                          return (
                            <tr key={product.id}>
                              <td className="st-prod-cell">
                                <Link to={`/product/${product.id}`} className="st-prod-link">
                                  <div className="st-thumb-box">
                                    {prodImg ? <img src={prodImg} alt={product.name} /> : <div className="st-thumb-placeholder" />}
                                  </div>
                                  <span className="st-name">{product.name}</span>
                                </Link>
                              </td>
                              <td>
                                <div className="st-meta">
                                  <span className="st-cat">{product.category || 'Menswear'}</span>
                                  <span className="st-brand">{product.brand || 'ORDERLY'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="st-price-block">
                                  <span className="st-current-price">{formatPrice(product.price)}</span>
                                  {product.originalPrice && <span className="st-orig-price">{formatPrice(product.originalPrice)}</span>}
                                  {discount > 0 && <span className="st-disc-badge">-{discount}%</span>}
                                </div>
                              </td>
                              <td>
                                <span className={`st-stock-badge ${product.stock > 0 || product.inStock !== false ? 'in-stock' : 'out-stock'}`}>
                                  {product.stock > 0 || product.inStock !== false ? '● In Stock' : 'Out of Stock'}
                                </span>
                              </td>
                              <td className="text-end">
                                <div className="st-actions">
                                  <button
                                    type="button"
                                    className="st-cart-btn"
                                    onClick={() => addToCart(product)}
                                  >
                                    <FiShoppingBag /> Add to Cart
                                  </button>
                                  <button
                                    type="button"
                                    className={`st-wish-btn ${isWishlisted ? 'active' : ''}`}
                                    onClick={() => toggleWishlist(product)}
                                    title="Wishlist"
                                  >
                                    <FiHeart />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`desktop-shop-products-grid cols-${gridCols}`}>
                    {paginatedProducts.map(product => (
                      <div key={product.id}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="shop-empty-card text-center py-5">
                  <h3 className="text-white mb-2">NO PRODUCTS FOUND</h3>
                  <p className="text-muted small">Try adjusting your category, price, or size filters to find matching menswear.</p>
                  <button className="btn-apply-filter-red mt-3 px-4 py-2" onClick={clearAllFilters}>
                    CLEAR FILTERS
                  </button>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="shop-pagination-bar mt-5">
                  <button 
                    type="button"
                    className="page-num-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <FiChevronLeft />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button 
                    type="button"
                    className="page-num-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              )}
            </main>

          </div>
        </div>
      </main>
    </>
  );
};

export default Shop;
