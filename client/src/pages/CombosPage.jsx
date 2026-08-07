import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiLayers, FiCheck, FiArrowRight, FiSliders, FiX } from 'react-icons/fi';
import SEO from '../components/common/SEO';
import { getCombos, getProducts } from '../services/api';
import './CombosPage.css';

const CombosPage = () => {
  const [combos, setCombos] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Combos Relevant Sidebar Filter States
  const [selectedPieces, setSelectedPieces] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minSavings, setMinSavings] = useState(0);
  const [priceRange, setPriceRange] = useState(50000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    const fetchCombosAndProducts = async () => {
      setLoading(true);
      try {
        const [combosRes, productsRes] = await Promise.all([getCombos(), getProducts()]);
        if (combosRes && combosRes.success && Array.isArray(combosRes.data)) {
          setCombos(combosRes.data.filter(c => c.status !== 'Inactive'));
        }
        if (productsRes && productsRes.success && Array.isArray(productsRes.data)) {
          setProductsCatalog(productsRes.data);
        }
      } catch (err) {
        console.warn('Failed to fetch combos/products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCombosAndProducts();
  }, []);

  const getComboStock = (combo) => {
    if (!combo.items || combo.items.length === 0) return -1; // unknown → treat as in stock
    let matched = false;
    let minStock = Infinity;
    for (const item of combo.items) {
      const prod = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
      if (prod) {
        matched = true;
        let prodTotal = 0;
        if (prod.inventory && Object.keys(prod.inventory).length > 0) {
          prodTotal = Object.values(prod.inventory).reduce((sum, v) => sum + Number(v || 0), 0);
        } else if (prod.stock !== undefined) {
          prodTotal = Number(prod.stock || 0);
        }
        if (prodTotal < minStock) minStock = prodTotal;
      }
    }
    return matched ? minStock : -1;
  };

  const piecesOptions = ['All', '2', '3', '4'];
  const categoryOptions = useMemo(() => {
    const fromCatalog = Array.from(new Set(
      productsCatalog.map(p => p.category).filter(Boolean)
    ));
    const fromCombos = Array.from(new Set(
      combos.flatMap(cb => (cb.items || []).map(it => it.category).filter(Boolean))
    ));
    return ['All', ...new Set([...fromCatalog, ...fromCombos])];
  }, [productsCatalog, combos]);

  const filteredCombos = useMemo(() => {
    let result = combos.filter(combo => {
      if (!combo) return false;
      
      // Filter by Pieces Count
      if (selectedPieces !== 'All' && String(combo.pieces_count || 2) !== String(selectedPieces)) {
        return false;
      }

      // Filter by Included Item Type / Category
      if (selectedCategory !== 'All') {
        const catQuery = selectedCategory.toLowerCase();
        const hasItemCategory = combo.items?.some(item => {
          const name = (item.name || item.pieceLabel || '').toLowerCase();
          return name.includes(catQuery) || (item.category && item.category.toLowerCase().includes(catQuery));
        });
        if (!hasItemCategory) return false;
      }

      // Filter by Price Range
      if (combo.offer_price > priceRange) return false;

      // Filter by Min Savings
      const savings = Math.max(0, (combo.original_price || 0) - (combo.offer_price || 0));
      if (minSavings > 0 && savings < minSavings) return false;

      // Filter by Stock
      if (inStockOnly) {
        const stockCount = getComboStock(combo);
        if (stockCount <= 0) return false;
      }

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      const savingsA = Math.max(0, (a.original_price || 0) - (a.offer_price || 0));
      const savingsB = Math.max(0, (b.original_price || 0) - (b.offer_price || 0));
      
      if (sortBy === 'price-low') return a.offer_price - b.offer_price;
      if (sortBy === 'price-high') return b.offer_price - a.offer_price;
      if (sortBy === 'savings') return savingsB - savingsA;
      return 0; // default featured
    });
  }, [combos, selectedPieces, selectedCategory, priceRange, minSavings, inStockOnly, sortBy, productsCatalog]);

  const clearAllFilters = () => {
    setSelectedPieces('All');
    setSelectedCategory('All');
    setMinSavings(0);
    setPriceRange(50000);
    setInStockOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters = selectedPieces !== 'All' || selectedCategory !== 'All' || minSavings > 0 || priceRange < 50000 || inStockOnly;

  return (
    <>
      <SEO 
        title="Curated Multi-Piece Combo Offers & Deals | ORDERLY Mens Wear"
        description="Discover luxury men's curated 2, 3, and 4-piece combo boxes. Save up to 35% on European Linen shirts, Japanese Selvedge denim, and Italian wool blazers."
      />

      <main className="shop-page container-fluid px-lg-5 py-4">
        {/* Breadcrumb Header Banner matching Shop Page */}
        <div className="shop-header-banner mb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <span className="shop-subtitle">MULTI-PIECE CAPSULES</span>
              <h1 className="shop-title">
                {selectedPieces !== 'All' ? `${selectedPieces}-PIECE BUNDLE DEALS` : 'CURATED COMBO OFFERS'}
              </h1>
              <p className="shop-count">{filteredCombos.length} Luxury Capsule Bundles Available</p>
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
                  <option value="featured">Featured & Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="savings">Biggest Savings</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="active-filters-bar mb-4">
            <span className="active-label">Active Filters:</span>
            {selectedPieces !== 'All' && (
              <span className="filter-chip">
                Pieces: {selectedPieces}-Piece <FiX onClick={() => setSelectedPieces('All')} />
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="filter-chip">
                Item: {selectedCategory} <FiX onClick={() => setSelectedCategory('All')} />
              </span>
            )}
            {minSavings > 0 && (
              <span className="filter-chip">
                Save ₹{minSavings}+ <FiX onClick={() => setMinSavings(0)} />
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
          {/* Desktop Filter Sidebar Relevant to Combos */}
          <aside className="col-lg-3 d-none d-lg-block">
            <div className="shop-filter-sidebar">
              <div className="filter-header d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-dark">
                <h3 className="filter-title mb-0">COMBO FILTERS</h3>
                {hasActiveFilters && (
                  <button className="clear-link-btn" onClick={clearAllFilters}>Reset All</button>
                )}
              </div>

              {/* Pieces Count Filter */}
              <div className="filter-group mb-4">
                <h4 className="filter-group-title">BUNDLE PIECES</h4>
                <div className="filter-options-list">
                  {piecesOptions.map((pc, idx) => (
                    <label key={idx} className="filter-checkbox-label">
                      <input 
                        type="radio" 
                        name="pieces"
                        checked={selectedPieces === pc}
                        onChange={() => setSelectedPieces(pc)}
                      />
                      <span>{pc === 'All' ? 'All Bundle Sizes' : `${pc}-Piece Deals`}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Included Item Category Filter */}
              <div className="filter-group mb-4">
                <h4 className="filter-group-title">INCLUDED APPAREL</h4>
                <div className="filter-options-list">
                  {categoryOptions.map((cat, idx) => (
                    <label key={idx} className="filter-checkbox-label">
                      <input 
                        type="radio" 
                        name="comboCategory"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                      />
                      <span>{cat === 'All' ? 'All Combos' : `Includes ${cat}`}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Minimum Savings Filter */}
              <div className="filter-group mb-4">
                <h4 className="filter-group-title">MIN SAVINGS</h4>
                <div className="filter-options-list">
                  {[
                    { label: 'All Savings', val: 0 },
                    { label: 'Save ₹1,000+', val: 1000 },
                    { label: 'Save ₹2,000+', val: 2000 },
                    { label: 'Save ₹3,000+', val: 3000 }
                  ].map((sav, idx) => (
                    <label key={idx} className="filter-checkbox-label">
                      <input 
                        type="radio" 
                        name="savings"
                        checked={minSavings === sav.val}
                        onChange={() => setMinSavings(sav.val)}
                      />
                      <span>{sav.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="filter-group mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h4 className="filter-group-title mb-0">MAX PRICE</h4>
                  <span className="price-val-badge">₹{priceRange}</span>
                </div>
                <input 
                  type="range" 
                  min="2000" 
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

          {/* Combos Grid Column */}
          <section className="col-lg-9">
            {loading ? (
              <div className="text-center py-5">
                <span className="spinner-border text-danger" role="status" />
                <p className="mt-2 text-muted">Loading curated combo offers...</p>
              </div>
            ) : filteredCombos.length > 0 ? (
              <div className="row g-3 g-md-4">
                {filteredCombos.map(combo => {
                  const stockCount = getComboStock(combo);
                  const isInStock = stockCount === -1 || stockCount > 0;

                  return (
                    <div key={combo.id} className="col-12 col-md-6 col-xl-4">
                      <div className="combo-card-client">
                        <div className="combo-card-img-wrapper">
                          {combo.images?.[0] ? (
                            <img 
                              src={combo.images[0]} 
                              alt={combo.name} 
                              className="combo-card-img"
                            />
                          ) : (
                            <div className="combo-card-img combo-card-img-placeholder d-flex align-items-center justify-content-center">
                              <span className="text-muted">No Image</span>
                            </div>
                          )}
                          {combo.badge && <span className="combo-card-badge">{combo.badge}</span>}
                          <span className="combo-card-pieces-count">
                            <FiLayers className="me-1" /> {combo.pieces_count || 2} PIECES
                          </span>
                        </div>

                        <div className="combo-card-body">
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className={`badge ${isInStock ? 'bg-success' : 'bg-danger'} text-white`}>
                                {isInStock ? (stockCount === -1 ? 'In Stock' : `In Stock (${stockCount} available)`) : 'Out of Stock'}
                              </span>
                            </div>

                            <h3 className="combo-card-title">{combo.name}</h3>
                            
                            {/* Included Items Summary */}
                            <ul className="combo-card-items-list">
                              {combo.items?.slice(0, 3).map((item, idx) => (
                                <li key={idx}>
                                  <FiCheck className="text-danger flex-shrink-0" />
                                  <span className="line-clamp-1">{item.name || item.pieceLabel}</span>
                                </li>
                              ))}
                              {combo.items?.length > 3 && (
                                <li className="text-muted extra-small">+ {combo.items.length - 3} more items</li>
                              )}
                            </ul>
                          </div>

                          <div>
                            <div className="combo-card-price-row">
                              <div>
                                <span className="combo-card-offer-price">₹{combo.offer_price}</span>
                                <span className="combo-card-msrp">₹{combo.original_price}</span>
                              </div>
                              <span className="badge bg-success text-white px-2 py-1 extra-small rounded">
                                Save ₹{Math.max(0, combo.original_price - combo.offer_price)}
                              </span>
                            </div>

                            <Link to={`/combo/${combo.id}`} className="btn-buy-bundle">
                              Customize & Buy Deal <FiArrowRight />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <h4 className="text-white">No combo deals found matching filters</h4>
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
                <h3 className="mb-0 text-white">Filter Combos</h3>
                <button className="close-drawer-btn" onClick={() => setIsMobileFilterOpen(false)}><FiX /></button>
              </div>
              <div className="drawer-body p-3">
                <div className="filter-group mb-4">
                  <h4 className="filter-group-title">BUNDLE PIECES</h4>
                  <select 
                    className="form-select bg-dark text-white border-secondary"
                    value={selectedPieces}
                    onChange={(e) => setSelectedPieces(e.target.value)}
                  >
                    {piecesOptions.map((p, i) => (
                      <option key={i} value={p}>{p === 'All' ? 'All Bundle Sizes' : `${p}-Piece Deals`}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group mb-4">
                  <h4 className="filter-group-title">INCLUDED APPAREL</h4>
                  <select 
                    className="form-select bg-dark text-white border-secondary"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categoryOptions.map((c, i) => (
                      <option key={i} value={c}>{c === 'All' ? 'All Combos' : `Includes ${c}`}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group mb-4">
                  <h4 className="filter-group-title">MAX PRICE: ₹{priceRange}</h4>
                  <input 
                    type="range" 
                    min="2000" 
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

export default CombosPage;
