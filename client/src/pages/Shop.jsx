import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { FiX, FiSliders, FiChevronRight, FiChevronLeft, FiHeart, FiShoppingBag } from 'react-icons/fi';
import SEOHead from '../components/common/SEOHead';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { getProducts, matchesCategoryAlias, getCategories, getBrands } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, calculateDiscount } from '../utils/formatters';
import MobileShop from './MobileShop';
import useIsMobile from '../utils/useIsMobile';
import './Shop.css';

const DEFAULT_BRANDS = ['Orderly', 'U.S. Polo', 'Nike', 'Adidas', 'Jack & Jones'];

const Shop = () => {
  const isMobile = useIsMobile(768);
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

  // Helper to parse categories array from URL or params
  const parseCategories = useCallback((param, allCats = categoriesList) => {
    if (!param || param === 'All') return [];
    return param
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => resolveCategoryName(p, allCats))
      .filter(p => p && p !== 'All');
  }, [resolveCategoryName, categoriesList]);

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
  const [gridCols, setGridCols] = useState(4); // 1 (single), 3, 4, or 5
  const [currentPage, setCurrentPage] = useState(1);

  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Desktop show 5 rows and then pagination (1 col = 5 rows, 3 cols = 15, 4 cols = 20, 5 cols = 25)
  const itemsPerPage = useMemo(() => {
    if (gridCols === 1) return 5;
    return gridCols * 5;
  }, [gridCols]);

  // Load category options from API
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

  // Sync category state when URL changes
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

  // Fetch complete product dataset from API & listen for Admin live updates
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

    window.addEventListener('orderly_products_updated', loadProducts);
    window.addEventListener('storage', loadProducts);

    return () => {
      window.removeEventListener('storage', loadProducts);
      window.removeEventListener('orderly_products_updated', loadProducts);
    };
  }, []);

  // Dynamically compute catalog price bounds from actual active products
  const priceBounds = useMemo(() => {
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo && typeof p.price === 'number');
    if (singles.length === 0) return { min: 0, max: 10000 };
    const prices = singles.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices) / 100) * 100 || 0,
      max: Math.ceil(Math.max(...prices) / 500) * 500 || 10000
    };
  }, [productsList]);

  // Initialize minPrice and maxPrice when catalog price bounds resolve
  useEffect(() => {
    if (priceBounds.min !== undefined && priceBounds.max !== undefined) {
      setMinPrice(priceBounds.min);
      setMaxPrice(priceBounds.max);
    }
  }, [priceBounds]);

  // Dynamically extract all available categories from categories API + product catalog
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
    return list.length > 0 ? list : (categoryOptions.length > 0 ? categoryOptions : ['Shirts', 'T-Shirts', 'Pants', 'Jackets', 'Accessories']);
  }, [categoriesList, productsList, categoryOptions]);

  // Calculate dynamic category counts (strictly real counts, no mock fallbacks)
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

  // Dynamically extract all available sizes from actual products (scanning sizes & inventory)
  const availableSizes = useMemo(() => {
    const sizeSet = new Set();
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    
    singles.forEach(p => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach(s => {
          if (s && typeof s === 'string' && s.trim()) {
            sizeSet.add(s.trim().toUpperCase());
          }
        });
      } else if (typeof p.sizes === 'string') {
        p.sizes.split(',').forEach(s => {
          if (s && s.trim()) sizeSet.add(s.trim().toUpperCase());
        });
      }
      if (p.inventory && typeof p.inventory === 'object') {
        Object.keys(p.inventory).forEach(k => {
          if (k && k !== 'total' && typeof k === 'string' && k.trim() && Number(p.inventory[k]) > 0) {
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

  // Product counts per size
  const sizeCounts = useMemo(() => {
    const counts = {};
    const singles = productsList.filter(p => !p.type?.includes('combo') && !p.is_combo);
    singles.forEach(p => {
      const pSizes = new Set();
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach(s => s && pSizes.add(s.trim().toUpperCase()));
      } else if (typeof p.sizes === 'string') {
        p.sizes.split(',').forEach(s => s && pSizes.add(s.trim().toUpperCase()));
      }
      if (p.inventory && typeof p.inventory === 'object') {
        Object.keys(p.inventory).forEach(k => {
          if (k && k !== 'total' && Number(p.inventory[k]) > 0) {
            pSizes.add(k.trim().toUpperCase());
          }
        });
      }
      pSizes.forEach(sz => {
        counts[sz] = (counts[sz] || 0) + 1;
      });
    });
    return counts;
  }, [productsList]);

  // Category Toggle Handler (Multi-Choice)
  const handleCategoryToggle = (cat) => {
    setCurrentPage(1);
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

  // Size Toggle Handler (Multi-Choice)
  const handleSizeToggle = (sz) => {
    setCurrentPage(1);
    setSelectedSizes(prev => 
      prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
    );
  };

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
      // In Stock Check
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
        const discPctA = origA > priceA ? ((origA - priceA) / origA) * 100 : 0;
        const discPctB = origB > priceB ? ((origB - priceB) / origB) * 100 : 0;
        return discPctB - discPctA;
      }
      return (Number(b.popularity || b.sales_count) || 0) - (Number(a.popularity || a.sales_count) || 0);
    });
  }, [productsList, selectedCategories, selectedSizes, appliedMinPrice, appliedMaxPrice, sortBy, inStockOnly, searchParam]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const startItem = filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  const handleApplyPriceFilter = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setCurrentPage(1);
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
    setCurrentPage(1);
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
      <SEOHead 
        title={`${pageTitle} | ORDERLY Mens Wear`}
        description="Shop luxury men's apparel including shirts, t-shirts, selvedge denim, trousers and blazers at ORDERLY."
        canonicalPath={`/shop${selectedCategories.length > 0 ? `?category=${encodeURIComponent(selectedCategories.join(','))}` : ''}`}
        itemList={{
          name: `${pageTitle} Collection`,
          description: `Explore premium menswear at ORDERLY.`,
          items: filteredProducts
        }}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          ...(selectedCategories.length > 0 ? [{ name: selectedCategories.join(', '), url: `/shop?category=${encodeURIComponent(selectedCategories.join(','))}` }] : [])
        ]}
      />

      {isMobile ? (
        <MobileShop />
      ) : (
        <main className="orderly-shop-page desktop-only">
        {/* 1. SHOP HERO BANNER MATCHING REFERENCE SCREENSHOT */}
        <div className="shop-hero-banner">
          <div className="shop-hero-overlay" />
          <div className="shop-hero-bg-graphic" />

          <div className="container-fluid px-lg-5 shop-hero-content-wrap">
            <span className="shop-hero-eyebrow">SHOP &rarr;</span>
            <h1 className="shop-hero-title">
              {selectedCategories.length === 0 
                ? 'ALL PRODUCTS' 
                : selectedCategories.length === 1 
                  ? selectedCategories[0].toUpperCase() 
                  : `${selectedCategories.length} CATEGORIES`}
            </h1>

            {/* Breadcrumb Navigation */}
            <div className="shop-breadcrumb">
              <Link to="/" className="breadcrumb-link">Home</Link>
              <span className="breadcrumb-sep">&gt;</span>
              <Link to="/shop" className="breadcrumb-link" onClick={clearAllFilters}>Shop</Link>
              {selectedCategories.length > 0 && (
                <>
                  <span className="breadcrumb-sep">&gt;</span>
                  <span className="breadcrumb-current">
                    {selectedCategories.join(', ')}
                  </span>
                </>
              )}
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

                {/* Categories Group (Multi-Choice) */}
                <div className="filter-group-block">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h4 className="filter-group-heading mb-0">CATEGORIES</h4>
                    {selectedCategories.length > 0 && (
                      <button 
                        type="button" 
                        className="clear-all-link"
                        onClick={() => {
                          setSelectedCategories([]);
                          searchParams.delete('category');
                          setSearchParams(searchParams);
                          setCurrentPage(1);
                        }}
                      >
                        Reset ({selectedCategories.length})
                      </button>
                    )}
                  </div>
                  <div className="filter-checkbox-list">
                    {dynamicCategories.map((cat, idx) => {
                      const count = categoryCounts[cat] || 0;
                      const isChecked = selectedCategories.includes(cat);
                      return (
                        <label key={idx} className="filter-check-item">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCategoryToggle(cat)}
                          />
                          <span className="check-label-text">{cat}</span>
                          <span className="count-muted">({count})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Price Filter Slider & Inputs */}
                <div className="filter-group-block">
                  <h4 className="filter-group-heading">PRICE</h4>
                  
                  <div className="price-slider-wrap mb-3">
                    <input 
                      type="range"
                      min={priceBounds.min || 0}
                      max={priceBounds.max || 10000}
                      step="100"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="price-slider-red w-100"
                    />
                    <div className="d-flex justify-content-between price-slider-labels">
                      <span>₹{minPrice.toLocaleString()}</span>
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

                {/* Size Chips Group (Dynamic from Catalog, Multi-Choice) */}
                <div className="filter-group-block">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h4 className="filter-group-heading mb-0">SIZE</h4>
                    {selectedSizes.length > 0 && (
                      <button 
                        type="button" 
                        className="clear-all-link"
                        onClick={() => { setSelectedSizes([]); setCurrentPage(1); }}
                      >
                        Reset ({selectedSizes.length})
                      </button>
                    )}
                  </div>
                  <div className="sizes-chips-row flex-wrap">
                    {availableSizes.length > 0 ? (
                      availableSizes.map((sz, idx) => {
                        const isChecked = selectedSizes.includes(sz);
                        const count = sizeCounts[sz] || 0;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`size-chip-box ${isChecked ? 'active' : ''}`}
                            onClick={() => handleSizeToggle(sz)}
                            title={`${count} items available in ${sz}`}
                          >
                            {sz}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-muted small">Standard Sizes</span>
                    )}
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
                    Showing {startItem}–{endItem} of {filteredProducts.length} Products
                  </span>
                </div>

                <div className="toolbar-right d-flex align-items-center gap-2">
                  <span className="sort-by-label">Sort By:</span>
                  <select 
                    className="orderly-custom-select"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest Arrivals</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="discount">Biggest Savings</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {hasActiveFilters && (
                <div className="shop-active-chips-bar">
                  <span className="chips-title">Active Filters:</span>
                  {searchParam && (
                    <span className="active-chip">
                      Search: "{searchParam}" <FiX onClick={() => setSearchParams({})} />
                    </span>
                  )}
                  {selectedCategories.map(cat => (
                    <span key={cat} className="active-chip">
                      {cat} <FiX onClick={() => handleCategoryToggle(cat)} />
                    </span>
                  ))}
                  {selectedSizes.map(sz => (
                    <span key={sz} className="active-chip">
                      Size: {sz} <FiX onClick={() => handleSizeToggle(sz)} />
                    </span>
                  ))}
                  {(appliedMaxPrice < (priceBounds.max || 10000) || appliedMinPrice > (priceBounds.min || 0)) && (
                    <span className="active-chip">
                      ₹{appliedMinPrice} – ₹{appliedMaxPrice} <FiX onClick={() => { setAppliedMinPrice(0); setAppliedMaxPrice(100000); }} />
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="active-chip">
                      In Stock Only <FiX onClick={() => setInStockOnly(false)} />
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
                  {Array.from({ length: itemsPerPage }, (_, i) => (
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
      )}
    </>
  );
};

export default Shop;
