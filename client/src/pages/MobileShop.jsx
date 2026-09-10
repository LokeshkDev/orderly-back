import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { 
  FiX, 
  FiSliders, 
  FiGrid, 
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
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || 'All';
  const searchParam = searchParams.get('search') || '';

  const [categoriesList, setCategoriesList] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState(DEFAULT_BRANDS);

  const resolveCategoryName = useCallback((rawSlugOrName, allCats = categoriesList) => {
    if (!rawSlugOrName || rawSlugOrName === 'All') return 'All';
    const found = allCats.find(c =>
      (c.slug && c.slug.toLowerCase() === rawSlugOrName.toLowerCase()) ||
      String(c.id) === String(rawSlugOrName) ||
      String(c._id) === String(rawSlugOrName) ||
      (c.name && c.name.toLowerCase() === rawSlugOrName.toLowerCase()) ||
      (c.name && c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === rawSlugOrName.toLowerCase()) ||
      matchesCategoryAlias(c.name, rawSlugOrName)
    );
    if (found) return found.name;
    if (rawSlugOrName.includes('-')) {
      return rawSlugOrName.replace(/-/g, ' ');
    }
    return rawSlugOrName;
  }, [categoriesList]);

  // Parse categories from URL
  const parseCategories = useCallback((param, allCats = categoriesList) => {
    if (!param || param === 'All') return [];
    return param
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => resolveCategoryName(p, allCats))
      .filter(p => p && p !== 'All');
  }, [resolveCategoryName, categoriesList]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(() => {
    if (slug) {
      const resolved = resolveCategoryName(slug);
      return resolved && resolved !== 'All' ? [resolved] : [];
    }
    return parseCategories(categoryParam);
  });
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState('popularity');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [displayCount, setDisplayCount] = useState(10);

  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Accordion state inside mobile filter drawer
  const [accordionOpen, setAccordionOpen] = useState({
    categories: true,
    price: true,
    size: false,
    availability: false
  });

  const toggleAccordion = (key) => {
    setAccordionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const catRes = await getCategories();
        if (catRes && catRes.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
          setCategoriesList(catRes.data);
          const activeCats = catRes.data.filter(c => c.is_active !== false).map(c => c.name);
          if (activeCats.length > 0) setCategoryOptions(activeCats);

          if (slug) {
            const resolved = resolveCategoryName(slug, catRes.data);
            if (resolved && resolved !== 'All') setSelectedCategories([resolved]);
          } else if (categoryParam) {
            setSelectedCategories(parseCategories(categoryParam, catRes.data));
          }
        }
      } catch (err) {
        console.warn('Failed to load filter options:', err.message);
      }
    };
    loadFilters();
  }, [slug, categoryParam, resolveCategoryName, parseCategories]);

  // Sync state when URL params change
  useEffect(() => {
    if (slug) {
      const resolved = resolveCategoryName(slug);
      setSelectedCategories(resolved && resolved !== 'All' ? [resolved] : []);
    } else if (categoryParam) {
      setSelectedCategories(parseCategories(categoryParam));
    } else {
      setSelectedCategories([]);
    }
  }, [categoryParam, slug, resolveCategoryName, parseCategories]);

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
    window.addEventListener('orderly_products_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderly_products_updated', handleStorageChange);
    };
  }, []);

  // Dynamic price bounds
  const priceBounds = useMemo(() => {
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo && typeof p.price === 'number');
    if (singles.length === 0) return { min: 0, max: 10000 };
    const prices = singles.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices) / 100) * 100 || 0,
      max: Math.ceil(Math.max(...prices) / 500) * 500 || 10000
    };
  }, [productsList]);

  useEffect(() => {
    if (priceBounds.min !== undefined && priceBounds.max !== undefined) {
      setMinPrice(priceBounds.min);
      setMaxPrice(priceBounds.max);
    }
  }, [priceBounds]);

  // Dynamically extract categories
  const dynamicCategories = useMemo(() => {
    const catMap = new Map();
    categoriesList.filter(c => c.is_active !== false).forEach(c => {
      if (c.name) catMap.set(c.name.toLowerCase().trim(), c.name.trim());
    });
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    singles.forEach(p => {
      if (p.category && typeof p.category === 'string') {
        const key = p.category.toLowerCase().trim();
        if (!catMap.has(key)) {
          catMap.set(key, p.category.trim());
        }
      }
    });
    const list = Array.from(catMap.values());
    return list.length > 0 ? list : ['Shirts', 'T-Shirts', 'Pants', 'Jackets', 'Accessories'];
  }, [categoriesList, productsList]);

  // Dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    singles.forEach(p => {
      dynamicCategories.forEach(cat => {
        if (matchesCategoryAlias(p.category, cat)) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      });
    });
    return counts;
  }, [productsList, dynamicCategories]);

  // Dynamically extract sizes
  const availableSizes = useMemo(() => {
    const sizeSet = new Set();
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    singles.forEach(p => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach(s => s && typeof s === 'string' && sizeSet.add(s.trim().toUpperCase()));
      } else if (typeof p.sizes === 'string') {
        p.sizes.split(',').forEach(s => s && sizeSet.add(s.trim().toUpperCase()));
      }
      if (p.inventory && typeof p.inventory === 'object') {
        Object.keys(p.inventory).forEach(k => {
          if (k && k !== 'total' && Number(p.inventory[k]) > 0) {
            sizeSet.add(k.trim().toUpperCase());
          }
        });
      }
    });
    const standardOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL', '4XL', 'FREE SIZE'];
    return Array.from(sizeSet).sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [productsList]);

  const handleCategoryToggle = (cat) => {
    setSelectedCategories(prev => {
      const exists = prev.includes(cat);
      const next = exists ? prev.filter(c => c !== cat) : [...prev, cat];
      if (next.length === 0) {
        searchParams.delete('category');
        setSearchParams(searchParams);
      } else {
        setSearchParams({ category: next.join(',') });
      }
      return next;
    });
  };

  const handleSizeToggle = (sz) => {
    setSelectedSizes(prev => 
      prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
    );
  };

  // Filtered & Sorted products calculation
  const filteredProducts = useMemo(() => {
    let result = productsList.filter(product => {
      if (!product) return false;
      // Strict Single Product Check
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
        const descMatch = product.description?.toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !descMatch) {
          return false;
        }
      }
      // Multi-Category Check
      if (selectedCategories.length > 0) {
        const matchedCat = selectedCategories.some(cat => matchesCategoryAlias(product.category, cat));
        if (!matchedCat) return false;
      }
      // Multi-Size Check
      if (selectedSizes.length > 0) {
        const pSizes = new Set();
        if (Array.isArray(product.sizes)) {
          product.sizes.forEach(s => s && pSizes.add(s.trim().toUpperCase()));
        } else if (typeof product.sizes === 'string') {
          product.sizes.split(',').forEach(s => s && pSizes.add(s.trim().toUpperCase()));
        }
        if (product.inventory && typeof product.inventory === 'object') {
          Object.keys(product.inventory).forEach(k => {
            if (k && k !== 'total' && Number(product.inventory[k]) > 0) {
              pSizes.add(k.trim().toUpperCase());
            }
          });
        }
        const hasAnySize = selectedSizes.some(sz => pSizes.has(sz.toUpperCase()));
        if (!hasAnySize) return false;
      }
      // Price Filter
      const prodPrice = Number(product.price || 0);
      if (prodPrice < appliedMinPrice || prodPrice > appliedMaxPrice) {
        return false;
      }
      if (inStockOnly) {
        const totalStock = Object.values(product.inventory || {}).reduce((a, b) => a + Number(b || 0), 0);
        if (totalStock <= 0 && product.inStock === false) return false;
      }
      return true;
    });

    // Dynamic non-mutating sort
    return [...result].sort((a, b) => {
      const priceA = Number(a.price || 0);
      const priceB = Number(b.price || 0);
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === 'newest') {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        if (dateA && dateB && dateA !== dateB) return dateB - dateA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      if (sortBy === 'discount') {
        const origA = Number(a.originalPrice || a.original_price || priceA);
        const origB = Number(b.originalPrice || b.original_price || priceB);
        const discA = origA > priceA ? ((origA - priceA) / origA) * 100 : 0;
        const discB = origB > priceB ? ((origB - priceB) / origB) * 100 : 0;
        return discB - discA;
      }
      return (Number(b.popularity || b.sales_count) || 0) - (Number(a.popularity || a.sales_count) || 0);
    });
  }, [productsList, selectedCategories, selectedSizes, appliedMinPrice, appliedMaxPrice, sortBy, inStockOnly, searchParam]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  const handleApplyPriceFilter = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setIsFilterDrawerOpen(false);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setMinPrice(priceBounds.min || 0);
    setMaxPrice(priceBounds.max || 10000);
    setAppliedMinPrice(0);
    setAppliedMaxPrice(100000);
    setInStockOnly(false);
    setSortBy('popularity');
    setDisplayCount(10);
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedSizes.length > 0 || appliedMaxPrice < 100000 || appliedMinPrice > 0 || inStockOnly || (searchParam && searchParam.trim() !== '');

  const pageTitle = useMemo(() => {
    if (selectedCategories.length === 0) return 'Shop All Menswear';
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} Categories`;
  }, [selectedCategories]);

  return (
    <>
      <SEO 
        title={`${pageTitle} | ORDERLY Mobile Shopping App`}
        description="Shop luxury men's shirts, oversized tees, selvedge denim, trousers and blazers at ORDERLY."
      />

      <div className="mobile-app-wrapper mobile-only">
        {/* 1. Mobile App Header */}
        <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />

        {/* 3. Mobile Slide-Out Drawer */}
        <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        {/* 4. COMPACT MOBILE SHOP HERO MATCHING REFERENCE SCREENSHOT */}
        <div className="mobile-shop-hero">
          <div className="mobile-shop-hero-overlay" />
          <div className="mobile-shop-hero-content">
            <span className="mobile-hero-eyebrow">SHOP &rarr;</span>
            <h1 className="mobile-hero-title">
              {selectedCategories.length === 0 
                ? 'ALL PRODUCTS' 
                : selectedCategories.length === 1 
                  ? selectedCategories[0].toUpperCase() 
                  : `${selectedCategories.length} CATEGORIES`}
            </h1>
            <div className="mobile-breadcrumb">
              <Link to="/" className="mobile-breadcrumb-link">Home</Link>
              <span className="mobile-breadcrumb-sep">&gt;</span>
              <Link to="/shop" className="mobile-breadcrumb-link" onClick={clearAllFilters}>Shop</Link>
              {selectedCategories.length > 0 && (
                <>
                  <span className="mobile-breadcrumb-sep">&gt;</span>
                  <span className="mobile-breadcrumb-current">
                    {selectedCategories.join(', ')}
                  </span>
                </>
              )}
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
                <option value="discount">Biggest Savings</option>
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
              {selectedCategories.map(cat => (
                <span key={cat} className="mobile-chip-tag">
                  {cat} <FiX onClick={() => handleCategoryToggle(cat)} />
                </span>
              ))}
              {selectedSizes.map(sz => (
                <span key={sz} className="mobile-chip-tag">
                  Size: {sz} <FiX onClick={() => handleSizeToggle(sz)} />
                </span>
              ))}
              {(appliedMaxPrice < (priceBounds.max || 10000) || appliedMinPrice > (priceBounds.min || 0)) && (
                <span className="mobile-chip-tag">
                  ₹{appliedMinPrice} – ₹{appliedMaxPrice} <FiX onClick={() => { setAppliedMinPrice(0); setAppliedMaxPrice(100000); }} />
                </span>
              )}
              {inStockOnly && (
                <span className="mobile-chip-tag">
                  In Stock Only <FiX onClick={() => setInStockOnly(false)} />
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
                      {dynamicCategories.map((cat, idx) => {
                        const count = categoryCounts[cat] || 0;
                        const isChecked = selectedCategories.includes(cat);
                        return (
                          <label key={idx} className="mobile-filter-check-row">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCategoryToggle(cat)}
                            />
                            <span className="cat-name">{cat}</span>
                            <span className="cat-count">({count})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. PRICE ACCORDION */}
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
                          min={priceBounds.min || 0}
                          max={priceBounds.max || 10000}
                          step="100"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="mobile-price-slider w-100"
                        />
                        <div className="d-flex justify-content-between text-white-50 extra-small mt-1">
                          <span>₹{minPrice.toLocaleString()}</span>
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

                {/* 3. SIZE ACCORDION */}
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
                        {availableSizes.length > 0 ? (
                          availableSizes.map((sz, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`mobile-size-btn ${selectedSizes.includes(sz) ? 'active' : ''}`}
                              onClick={() => handleSizeToggle(sz)}
                            >
                              {sz}
                            </button>
                          ))
                        ) : (
                          <span className="text-muted small">Standard Sizes</span>
                        )}
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
