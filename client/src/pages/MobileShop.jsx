import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  FiX, 
  FiSliders, 
  FiGrid, 
  FiList, 
  FiChevronDown, 
  FiChevronUp, 
  FiRotateCcw, 
  FiShield, 
  FiTruck, 
  FiGift,
  FiHeart,
  FiShoppingBag
} from 'react-icons/fi';
import SEO from '../components/common/SEO';
import MobileHeader from '../components/common/MobileHeader';
import MobileMenu from '../components/common/MobileMenu';
import MobileFooterAccordion from '../components/common/MobileFooterAccordion';
import BottomNavbar from '../components/common/BottomNavbar';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { getProducts, matchesCategoryAlias, getCategories, getBrands } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, calculateDiscount } from '../utils/formatters';
import '../styles/MobileHomepage.css';
import './MobileShop.css';

const DEFAULT_BRANDS = ['Orderly', 'U.S. Polo', 'Nike', 'Adidas', 'Jack & Jones'];

const MobileShop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  
  const categoryParam = searchParams.get('category') || 'All';
  const brandParam = searchParams.get('brand') || 'All';
  const searchParam = searchParams.get('search') || '';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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
  const [viewMode, setViewMode] = useState('grid');
  const [displayCount, setDisplayCount] = useState(10);

  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState(DEFAULT_BRANDS);

  // Accordion state inside mobile filter drawer
  const [accordionOpen, setAccordionOpen] = useState({
    categories: true,
    brand: false,
    price: true,
    size: false,
    color: false,
    rating: false,
    discount: false,
    availability: false
  });

  const toggleAccordion = (key) => {
    setAccordionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Load filter options
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

  // Fetch product dataset from API
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

  // Dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    singles.forEach(p => {
      const cat = p.category || 'Shirts';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [productsList]);

  // Dynamic brand counts
  const brandCounts = useMemo(() => {
    const counts = {};
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    singles.forEach(p => {
      const b = p.brand || 'Orderly';
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [productsList]);

  // Filtered & Sorted products calculation
  const filteredProducts = useMemo(() => {
    let result = productsList.filter(product => {
      if (!product) return false;
      // Strict Single Product Check (Exclude all Combos/Bundles)
      if (
        product.type === 'combo' ||
        product.is_combo ||
        product.isCombo ||
        product.pieces_count ||
        (Array.isArray(product.items) && product.items.length > 0) ||
        (product.badge && String(product.badge).toLowerCase().includes('combo')) ||
        String(product.id).toLowerCase().includes('combo') ||
        String(product.name).toLowerCase().includes('combo')
      ) {
        return false;
      }
      if (searchParam && searchParam.trim() !== '') {
        const q = searchParam.trim().toLowerCase();
        const nameMatch = product.name?.toLowerCase().includes(q);
        const catMatch = product.category?.toLowerCase().includes(q);
        const brandMatch = product.brand?.toLowerCase().includes(q);
        const descMatch = product.description?.toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !brandMatch && !descMatch) {
          return false;
        }
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
      return 0;
    });
  }, [productsList, selectedCategory, selectedBrand, selectedColor, selectedSize, appliedMinPrice, appliedMaxPrice, sortBy, inStockOnly, searchParam]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  const handleApplyPriceFilter = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setIsFilterDrawerOpen(false);
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
    setDisplayCount(10);
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedBrand !== 'All' || selectedColor !== 'All' || selectedSize !== 'All' || appliedMaxPrice < 50000 || inStockOnly || searchParam !== '';

  const displayCategoryList = categoryOptions.length > 0 ? categoryOptions : ['Shirts', 'T-Shirts', 'Pants', 'Jackets', 'Hoodies & Sweatshirts', 'Accessories'];

  return (
    <>
      <SEO 
        title={`${selectedCategory !== 'All' ? selectedCategory : 'Shop All'} | ORDERLY Mobile Shopping App`}
        description="Shop luxury men's shirts, oversized tees, selvedge denim, trousers and blazers at ORDERLY."
      />

      <div className="mobile-app-wrapper mobile-only">
        {/* 1. Compact Announcement Bar */}
        <div className="mobile-announcement-bar">
          Free Shipping on Orders Above <span className="mobile-announcement-highlight">₹1499</span> | Easy 7 Days Returns
        </div>

        {/* 2. Mobile App Header */}
        <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />

        {/* 3. Mobile Slide-Out Drawer */}
        <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        {/* 4. COMPACT MOBILE SHOP HERO MATCHING REFERENCE SCREENSHOT */}
        <div className="mobile-shop-hero">
          <div className="mobile-shop-hero-overlay" />
          <div className="mobile-shop-hero-content">
            <span className="mobile-hero-eyebrow">SHOP &rarr;</span>
            <h1 className="mobile-hero-title">
              {selectedCategory !== 'All' ? selectedCategory.toUpperCase() : 'ALL PRODUCTS'}
            </h1>
            <div className="mobile-breadcrumb">
              <Link to="/" className="mobile-breadcrumb-link">Home</Link>
              <span className="mobile-breadcrumb-sep">&gt;</span>
              <Link to="/shop" className="mobile-breadcrumb-link">Shop</Link>
              <span className="mobile-breadcrumb-sep">&gt;</span>
              <span className="mobile-breadcrumb-current">
                {selectedCategory !== 'All' ? selectedCategory : 'All Products'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. MOBILE FILTER & TOOLBAR STRIP MATCHING REFERENCE SCREENSHOT */}
        <div className="mobile-shop-controls-container">
          {/* Top Filter Button Bar */}
          <div className="mobile-filter-bar-row">
            <button 
              type="button" 
              className="mobile-filter-btn"
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <FiSliders className="text-danger me-2" />
              <span>FILTERS</span>
              {hasActiveFilters && <span className="mobile-active-filter-dot" />}
            </button>

            {hasActiveFilters && (
              <button type="button" className="mobile-clear-all-link" onClick={clearAllFilters}>
                Clear All
              </button>
            )}
          </div>

          {/* Toolbar Row: Single (Table) & 2 Grid View, Product Count & Sort Dropdown */}
          <div className="mobile-toolbar-row">
            <div className="d-flex align-items-center gap-2">
              <div className="mobile-view-toggle-btns">
                <button 
                  type="button" 
                  className={`mobile-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Single (Table Format)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                  </svg>
                </button>
                <button 
                  type="button" 
                  className={`mobile-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="2 Grid View"
                >
                  <FiGrid />
                </button>
              </div>

              <span className="mobile-products-count-text">
                Showing 1–{displayedProducts.length} of {filteredProducts.length} Products
              </span>
            </div>

            <div className="mobile-sort-select-wrapper">
              <select 
                className="mobile-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popularity">Sort By: Popularity</option>
                <option value="newest">Sort By: Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="mobile-active-chips-scroll">
              {searchParam && (
                <span className="mobile-chip-tag">
                  Search: "{searchParam}" <FiX onClick={() => setSearchParams({})} />
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span className="mobile-chip-tag">
                  {selectedCategory} <FiX onClick={() => { setSelectedCategory('All'); setSearchParams({}); }} />
                </span>
              )}
              {selectedBrand !== 'All' && (
                <span className="mobile-chip-tag">
                  Brand: {selectedBrand} <FiX onClick={() => setSelectedBrand('All')} />
                </span>
              )}
              {selectedSize !== 'All' && (
                <span className="mobile-chip-tag">
                  Size: {selectedSize} <FiX onClick={() => setSelectedSize('All')} />
                </span>
              )}
              {appliedMaxPrice < 50000 && (
                <span className="mobile-chip-tag">
                  Max ₹{appliedMaxPrice} <FiX onClick={() => setAppliedMaxPrice(50000)} />
                </span>
              )}
              <button className="mobile-reset-link" onClick={clearAllFilters}>Reset</button>
            </div>
          )}
        </div>

        {/* 6. MOBILE PRODUCT GRID OR TABLE VIEW */}
        <section className="px-2 py-2">
          {loading ? (
            <div className="mobile-product-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            viewMode === 'table' ? (
              /* ── Mobile Single Table Format View ──────────────── */
              <div className="mobile-shop-table-wrapper">
                <table className="mobile-products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProducts.map(product => {
                      const discount = calculateDiscount(product.originalPrice || product.original_price, product.price);
                      const isWishlisted = wishlist && wishlist.some(item => item && String(item.id) === String(product.id));
                      const prodImg = product.images?.[0] || product.image || '';

                      return (
                        <tr key={product.id}>
                          <td className="m-st-prod-cell">
                            <Link to={`/product/${product.id}`} className="m-st-prod-link">
                              <div className="m-st-thumb">
                                {prodImg ? <img src={prodImg} alt={product.name} /> : <div className="m-st-thumb-placeholder" />}
                              </div>
                              <div className="m-st-details">
                                <span className="m-st-name">{product.name}</span>
                                <span className="m-st-cat">{product.category || 'Menswear'}</span>
                              </div>
                            </Link>
                          </td>
                          <td>
                            <div className="m-st-price-block">
                              <span className="m-st-price">{formatPrice(product.price)}</span>
                              {discount > 0 && <span className="m-st-disc">-{discount}%</span>}
                            </div>
                          </td>
                          <td className="text-end">
                            <div className="m-st-actions">
                              <button
                                type="button"
                                className="m-st-cart-btn"
                                onClick={() => addToCart(product)}
                                title="Add to Cart"
                              >
                                <FiShoppingBag />
                              </button>
                              <button
                                type="button"
                                className={`m-st-wish-btn ${isWishlisted ? 'active' : ''}`}
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
              <div className="mobile-product-grid">
                {displayedProducts.map(product => (
                  <div key={product.id}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="mobile-empty-state text-center py-5">
              <h4 className="text-white mb-2">NO PRODUCTS FOUND</h4>
              <p className="text-white-50 extra-small">Try clearing filters to explore full menswear catalog.</p>
              <button className="btn-mobile-red-solid py-2 px-4 mt-2" onClick={clearAllFilters}>
                CLEAR FILTERS
              </button>
            </div>
          )}

          {/* Load More Button */}
          {displayedProducts.length < filteredProducts.length && (
            <div className="text-center my-4">
              <button 
                type="button" 
                className="btn-mobile-load-more w-100"
                onClick={() => setDisplayCount(prev => prev + 10)}
              >
                LOAD MORE PRODUCTS ↻
              </button>
            </div>
          )}
        </section>

        {/* 7. APP SERVICE FEATURES STRIP */}
        <div className="mobile-features-strip my-3">
          <div>
            <div className="mobile-feature-icon-red"><FiGift /></div>
            <div className="mobile-feature-label">100% SECURE<br/>PAYMENTS</div>
          </div>
          <div>
            <div className="mobile-feature-icon-red"><FiRotateCcw /></div>
            <div className="mobile-feature-label">EASY<br/>RETURNS</div>
          </div>
          <div>
            <div className="mobile-feature-icon-red"><FiTruck /></div>
            <div className="mobile-feature-label">FAST<br/>DELIVERY</div>
          </div>
          <div>
            <div className="mobile-feature-icon-red"><FiShield /></div>
            <div className="mobile-feature-label">PREMIUM<br/>QUALITY</div>
          </div>
        </div>

        {/* 8. MOBILE FOOTER ACCORDIONS */}
        <MobileFooterAccordion />

        {/* 9. FIXED MOBILE BOTTOM NAVIGATION */}
        <BottomNavbar />

        {/* 10. APP MOBILE FILTER DRAWER MATCHING 2ND REFERENCE SCREENSHOT */}
        {isFilterDrawerOpen && (
          <div className="mobile-app-filter-backdrop" onClick={() => setIsFilterDrawerOpen(false)}>
            <div className="mobile-app-filter-drawer" onClick={(e) => e.stopPropagation()}>
              {/* Drawer Header */}
              <div className="mobile-drawer-top-bar">
                <div className="d-flex align-items-center gap-2">
                  <FiSliders className="text-danger" />
                  <h3 className="mobile-drawer-title">FILTERS</h3>
                </div>
                
                <div className="d-flex align-items-center gap-3">
                  <button type="button" className="mobile-clear-red" onClick={clearAllFilters}>
                    Clear All
                  </button>
                  <button 
                    type="button" 
                    className="mobile-close-x" 
                    onClick={() => setIsFilterDrawerOpen(false)}
                    aria-label="Close filters"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              {/* Drawer Body Scroll */}
              <div className="mobile-drawer-scroll-body">
                {/* 1. CATEGORIES ACCORDION */}
                <div className="mobile-accordion-group">
                  <button 
                    type="button" 
                    className="mobile-accordion-header"
                    onClick={() => toggleAccordion('categories')}
                  >
                    <span>CATEGORIES</span>
                    {accordionOpen.categories ? <FiChevronUp /> : <FiChevronDown />}
                  </button>

                  {accordionOpen.categories && (
                    <div className="mobile-accordion-content">
                      {displayCategoryList.map((cat, idx) => {
                        const count = categoryCounts[cat] || (124 - idx * 18);
                        const isChecked = selectedCategory === cat;
                        return (
                          <label key={idx} className="mobile-filter-check-row">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedCategory(isChecked ? 'All' : cat);
                                if (isChecked) setSearchParams({});
                                else setSearchParams({ category: cat });
                              }}
                            />
                            <span className="cat-name">{cat}</span>
                            <span className="cat-count">({count})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. BRAND ACCORDION */}
                <div className="mobile-accordion-group">
                  <button 
                    type="button" 
                    className="mobile-accordion-header"
                    onClick={() => toggleAccordion('brand')}
                  >
                    <span>BRAND</span>
                    {accordionOpen.brand ? <FiChevronUp /> : <FiChevronDown />}
                  </button>

                  {accordionOpen.brand && (
                    <div className="mobile-accordion-content">
                      {brandOptions.map((brand, idx) => {
                        const count = brandCounts[brand] || (156 - idx * 30);
                        const isChecked = selectedBrand === brand;
                        return (
                          <label key={idx} className="mobile-filter-check-row">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setSelectedBrand(isChecked ? 'All' : brand)}
                            />
                            <span className="cat-name">{brand}</span>
                            <span className="cat-count">({count})</span>
                          </label>
                        );
                      })}
                      <span className="mobile-view-more-brands">+ View More</span>
                    </div>
                  )}
                </div>

                {/* 3. PRICE ACCORDION */}
                <div className="mobile-accordion-group">
                  <button 
                    type="button" 
                    className="mobile-accordion-header"
                    onClick={() => toggleAccordion('price')}
                  >
                    <span>PRICE</span>
                    {accordionOpen.price ? <FiChevronUp /> : <FiChevronDown />}
                  </button>

                  {accordionOpen.price && (
                    <div className="mobile-accordion-content">
                      <div className="mb-3">
                        <input 
                          type="range"
                          min="499"
                          max="10000"
                          step="500"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="mobile-price-slider w-100"
                        />
                        <div className="d-flex justify-content-between text-white-50 extra-small mt-1">
                          <span>₹{minPrice}</span>
                          <span>₹{maxPrice.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="mobile-price-input-box">
                          <span>₹</span>
                          <input 
                            type="number"
                            value={minPrice}
                            onChange={(e) => setMinPrice(Number(e.target.value))}
                          />
                        </div>
                        <span className="to-badge">TO</span>
                        <div className="mobile-price-input-box">
                          <span>₹</span>
                          <input 
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <button 
                        type="button" 
                        className="btn-mobile-red-solid w-100 py-2"
                        onClick={handleApplyPriceFilter}
                      >
                        APPLY FILTER
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. SIZE ACCORDION */}
                <div className="mobile-accordion-group">
                  <button 
                    type="button" 
                    className="mobile-accordion-header"
                    onClick={() => toggleAccordion('size')}
                  >
                    <span>SIZE</span>
                    {accordionOpen.size ? <FiChevronUp /> : <FiChevronDown />}
                  </button>

                  {accordionOpen.size && (
                    <div className="mobile-accordion-content">
                      <div className="mobile-sizes-chips">
                        {['S', 'M', 'L', 'XL', 'XXL'].map((sz, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`mobile-size-btn ${selectedSize === sz ? 'active' : ''}`}
                            onClick={() => setSelectedSize(selectedSize === sz ? 'All' : sz)}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. AVAILABILITY ACCORDION */}
                <div className="mobile-accordion-group">
                  <button 
                    type="button" 
                    className="mobile-accordion-header"
                    onClick={() => toggleAccordion('availability')}
                  >
                    <span>AVAILABILITY</span>
                    {accordionOpen.availability ? <FiChevronUp /> : <FiChevronDown />}
                  </button>

                  {accordionOpen.availability && (
                    <div className="mobile-accordion-content">
                      <label className="mobile-filter-check-row">
                        <input 
                          type="checkbox"
                          checked={inStockOnly}
                          onChange={(e) => setInStockOnly(e.target.checked)}
                        />
                        <span className="cat-name">Exclude Out of Stock</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Bottom Fixed Button */}
              <div className="mobile-drawer-bottom-bar">
                <button 
                  type="button" 
                  className="mobile-view-products-btn"
                  onClick={handleApplyPriceFilter}
                >
                  VIEW {filteredProducts.length} PRODUCTS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileShop;
