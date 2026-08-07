import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiX, FiSliders } from 'react-icons/fi';
import SEO from '../components/common/SEO';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { getProducts, matchesCategoryAlias, getCategories, getBrands } from '../services/api';
import './Shop.css';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const categoryParam = searchParams.get('category') || 'All';
  const brandParam = searchParams.get('brand') || 'All';
  const searchParam = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [priceRange, setPriceRange] = useState(50000);
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(['All']);
  const [brandOptions, setBrandOptions] = useState([]);

  // Load category/brand filter options from the Admin-managed DB & products
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([getCategories(), getBrands()]);
        let cats = ['All'];
        if (catRes && catRes.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
          const names = catRes.data.filter(c => c.is_active !== false).map(c => c.name).filter(Boolean);
          if (names.length > 0) cats = Array.from(new Set(['All', ...names]));
        }
        setCategoryOptions(cats);

        if (brandRes && brandRes.success && Array.isArray(brandRes.data) && brandRes.data.length > 0) {
          const names = brandRes.data.filter(b => b.is_active !== false).map(b => b.name).filter(Boolean);
          if (names.length > 0) setBrandOptions(names);
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

  // Fetch complete product dataset from DB service & sync with live edits
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

  const sizesList = useMemo(() => {
    const all = Array.from(new Set(productsList.flatMap(p => p.sizes || []).filter(Boolean)));
    const priority = ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38R', '40R', '42R', '44R'];
    return ['All', ...all.sort((a, b) => {
      const ia = priority.indexOf(a);
      const ib = priority.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })];
  }, [productsList]);

  const filteredProducts = useMemo(() => {
    let result = productsList.filter(product => {
      if (!product) return false;
      // Strictly show ONLY single products (exclude combo bundles)
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
      if (product.price > priceRange) return false;
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
      return 0; // default featured
    });
  }, [productsList, selectedCategory, selectedBrand, selectedColor, selectedSize, priceRange, sortBy, inStockOnly]);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedColor('All');
    setSelectedSize('All');
    setPriceRange(50000);
    setInStockOnly(false);
    setSortBy('featured');
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedBrand !== 'All' || selectedColor !== 'All' || selectedSize !== 'All' || priceRange < 50000 || inStockOnly || searchParam !== '';

  return (
    <>
      <SEO 
        title={`${selectedCategory !== 'All' ? selectedCategory : 'Shop'} Men's Apparel | ORDERLY Ajio Store`}
        description="Explore luxury shirts, oversized t-shirts, denim, trousers, blazers and winterwear at ORDERLY."
      />

      <main className="shop-page container-fluid px-lg-5 py-4">
        {/* Breadcrumb Header Banner */}
        <div className="shop-header-banner mb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <span className="shop-subtitle">MENSWEAR CATALOG</span>
              <h1 className="shop-title">
                {selectedCategory !== 'All' ? `${selectedCategory.toUpperCase()}` : 'SHOP ALL MENSWEAR'}
              </h1>
              <p className="shop-count">{filteredProducts.length} Premium Items Available</p>
            </div>
            
            {/* Top Toolbar Controls */}
            <div className="d-flex align-items-center gap-3">
              <button 
                className="btn-outline-sharp d-lg-none"
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <FiSliders /> Filters {hasActiveFilters && <span className="filter-active-dot" />}
              </button>

              <div className="sort-dropdown-wrapper">
                <span className="sort-label">SORT BY:</span>
                <select 
                  className="shop-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured & Trending</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="active-filters-bar mb-4">
            <span className="active-label">Active Filters:</span>
            {selectedCategory !== 'All' && (
              <span className="filter-chip">
                Cat: {selectedCategory} <FiX onClick={() => { setSelectedCategory('All'); setSearchParams({}); }} />
              </span>
            )}
            {selectedBrand !== 'All' && (
              <span className="filter-chip">
                Brand: {selectedBrand} <FiX onClick={() => setSelectedBrand('All')} />
              </span>
            )}
            {selectedColor !== 'All' && (
              <span className="filter-chip">
                Color: {selectedColor} <FiX onClick={() => setSelectedColor('All')} />
              </span>
            )}
            {selectedSize !== 'All' && (
              <span className="filter-chip">
                Size: {selectedSize} <FiX onClick={() => setSelectedSize('All')} />
              </span>
            )}
            {priceRange < 50000 && (
              <span className="filter-chip">
                Under ₹{priceRange} <FiX onClick={() => setPriceRange(50000)} />
              </span>
            )}
            {inStockOnly && (
              <span className="filter-chip">
                In-Stock Only <FiX onClick={() => setInStockOnly(false)} />
              </span>
            )}
            <button className="clear-all-btn" onClick={clearAllFilters}>Clear All</button>
          </div>
        )}

        <div className="row g-4">
          {/* Desktop Filter Sidebar */}
          <aside className="col-lg-3 d-none d-lg-block">
            <div className="shop-filter-sidebar">
              <div className="filter-header d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-dark">
                <h3 className="filter-title mb-0">FILTERS</h3>
                {hasActiveFilters && (
                  <button className="clear-link-btn" onClick={clearAllFilters}>Reset All</button>
                )}
              </div>

              {/* Category Filter */}
              <div className="filter-group mb-4">
                <h4 className="filter-group-title">CATEGORY</h4>
                <div className="filter-options-list">
                  {categoryOptions.map((cat, idx) => (
                    <label key={idx} className="filter-checkbox-label">
                      <input 
                        type="radio" 
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => {
                          setSelectedCategory(cat);
                          if (cat === 'All') setSearchParams({});
                          else setSearchParams({ category: cat });
                        }}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="filter-group mb-4">
                <h4 className="filter-group-title">BRAND</h4>
                <div className="filter-options-list">
                  <label className="filter-checkbox-label">
                    <input 
                      type="radio" 
                      name="brand"
                      checked={selectedBrand === 'All'}
                      onChange={() => setSelectedBrand('All')}
                    />
                    <span>All Brands</span>
                  </label>
                  {brandOptions.map((brand, idx) => (
                    <label key={idx} className="filter-checkbox-label">
                      <input 
                        type="radio" 
                        name="brand"
                        checked={selectedBrand === brand}
                        onChange={() => setSelectedBrand(brand)}
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div className="filter-group mb-4">
                <h4 className="filter-group-title">SIZE</h4>
                <div className="size-chips-grid">
                  {sizesList.map((sz, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`size-chip-btn ${selectedSize === sz ? 'active' : ''}`}
                      onClick={() => setSelectedSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="filter-group mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h4 className="filter-group-title mb-0">MAX PRICE</h4>
                  <span className="price-val-badge">₹{priceRange}</span>
                </div>
                <input 
                  type="range" 
                  min="1000" 
                  max="50000" 
                  step="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="price-range-slider w-100"
                />
              </div>

              {/* Stock Availability Filter */}
              <div className="filter-group mb-3">
                <label className="filter-checkbox-label">
                  <input 
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                  />
                  <span>Exclude Out of Stock</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Products Grid Column */}
          <section className="col-lg-9">
            {loading ? (
              <div className="row g-3 g-md-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="col-6 col-md-4 col-xl-4">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="row g-3 g-md-4">
                {filteredProducts.map(product => (
                  <div key={product.id} className="col-6 col-md-4 col-xl-4">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <h4 className="text-white">No products found matching filters</h4>
                <button className="btn-admin-red mt-3" onClick={clearAllFilters}>Reset Filters</button>
              </div>
            )}
          </section>
        </div>

        {/* Mobile Filter Drawer Overlay */}
        {isMobileFilterOpen && (
          <div className="mobile-filter-drawer-backdrop" onClick={() => setIsMobileFilterOpen(false)}>
            <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header d-flex align-items-center justify-content-between">
                <h3 className="mb-0">Filter Products</h3>
                <button className="close-drawer-btn" onClick={() => setIsMobileFilterOpen(false)}><FiX /></button>
              </div>
              <div className="drawer-body p-3">
                {/* Category Mobile */}
                <div className="filter-group mb-4">
                  <h4 className="filter-group-title">CATEGORY</h4>
                  <select 
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categoryOptions.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Size Mobile */}
                <div className="filter-group mb-4">
                  <h4 className="filter-group-title">SIZE</h4>
                  <div className="size-chips-grid">
                    {sizesList.map((sz, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`size-chip-btn ${selectedSize === sz ? 'active' : ''}`}
                        onClick={() => setSelectedSize(sz)}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group mb-4">
                  <h4 className="filter-group-title">MAX PRICE: ₹{priceRange}</h4>
                  <input 
                    type="range" 
                    min="1000" 
                    max="50000" 
                    step="1000"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="price-range-slider w-100"
                  />
                </div>
              </div>
              <div className="drawer-footer p-3 d-flex gap-2">
                <button className="btn-outline-orderly w-50" onClick={clearAllFilters}>Reset</button>
                <button className="btn-primary-orderly w-50" onClick={() => setIsMobileFilterOpen(false)}>Apply</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Shop;
