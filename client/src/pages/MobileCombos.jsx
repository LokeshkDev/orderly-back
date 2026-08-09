import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiX, 
  FiSliders, 
  FiHeart, 
  FiChevronDown, 
  FiChevronUp, 
  FiRotateCcw, 
  FiShield, 
  FiTruck, 
  FiGift 
} from 'react-icons/fi';
import SEO from '../components/common/SEO';
import MobileHeader from '../components/common/MobileHeader';
import MobileMenu from '../components/common/MobileMenu';
import MobileFooterAccordion from '../components/common/MobileFooterAccordion';
import BottomNavbar from '../components/common/BottomNavbar';
import { getCombos, getProducts } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import '../styles/MobileHomepage.css';
import './MobileCombos.css';

const FALLBACK_COMBO_PHOTOS = [
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop'
];

const MobileCombos = () => {
  const [combos, setCombos] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false);
  const { wishlist, toggleWishlist } = useWishlist();

  // Mobile Filter & Sort States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceLimit, setPriceLimit] = useState(50000);
  const [sortBy, setSortBy] = useState('popularity');
  const [displayCount, setDisplayCount] = useState(6);

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

    window.addEventListener('orderly_products_updated', fetchCombosAndProducts);
    window.addEventListener('storage', fetchCombosAndProducts);
    window.addEventListener('focus', fetchCombosAndProducts);

    return () => {
      window.removeEventListener('orderly_products_updated', fetchCombosAndProducts);
      window.removeEventListener('storage', fetchCombosAndProducts);
      window.removeEventListener('focus', fetchCombosAndProducts);
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const fromCombos = Array.from(new Set(
      combos.flatMap(cb => (cb.items || []).map(it => it.category).filter(Boolean))
    ));
    return ['All', 'Shirts', 'T-Shirts', 'Pants', 'Hoodies', 'Jeans', ...fromCombos];
  }, [combos]);

  const filteredCombos = useMemo(() => {
    let result = combos.filter(combo => {
      if (!combo) return false;
      
      // Category filter
      if (selectedCategory !== 'All') {
        const catQuery = selectedCategory.toLowerCase();
        const hasCat = combo.name?.toLowerCase().includes(catQuery) || combo.items?.some(item => {
          const name = (item.name || item.pieceLabel || '').toLowerCase();
          return name.includes(catQuery) || (item.category && item.category.toLowerCase().includes(catQuery));
        });
        if (!hasCat) return false;
      }

      // Price filter
      if (combo.offer_price > priceLimit) return false;

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      const discA = Math.max(0, (a.original_price || 0) - (a.offer_price || 0));
      const discB = Math.max(0, (b.original_price || 0) - (b.offer_price || 0));

      if (sortBy === 'price-low') return a.offer_price - b.offer_price;
      if (sortBy === 'price-high') return b.offer_price - a.offer_price;
      if (sortBy === 'discount') return discB - discA;
      return 0; // popularity / featured
    });
  }, [combos, selectedCategory, priceLimit, sortBy]);

  const displayedCombos = useMemo(() => {
    return filteredCombos.slice(0, displayCount);
  }, [filteredCombos, displayCount]);

  const isInWishlist = (id) => {
    return wishlist ? wishlist.some(item => String(item.id) === String(id)) : false;
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setPriceLimit(50000);
    setSortBy('popularity');
    setDisplayCount(6);
    setIsFilterDrawerOpen(false);
  };

  const hasActiveFilters = selectedCategory !== 'All' || priceLimit < 50000;

  return (
    <>
      <SEO 
        title="Smart Combos & Bigger Savings | ORDERLY Mobile Shopping App"
        description="Shop luxury men's combo bundles. Save up to 35% on curated 2-piece shirts, polo t-shirts, cargo pants and denim sets."
      />

      <div className="mobile-app-wrapper mobile-only">
        {/* 1. Mobile App Header */}
        <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />

        {/* 3. Mobile Slide-Out Drawer */}
        <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        {/* 4. COMPACT MOBILE COMBO HERO BANNER MATCHING REFERENCE SCREENSHOT */}
        <div className="mobile-combo-hero">
          <div className="mobile-combo-hero-overlay" />
          <div className="mobile-combo-hero-content">
            <span className="mobile-hero-eyebrow">COMBOS &mdash;</span>
            <h1 className="mobile-hero-title">
              SMART COMBOS<br />
              <span className="text-red-accent">BIGGER SAVINGS</span>
            </h1>
            <p className="mobile-hero-sub">
              Handpicked combos for your style and comfort
            </p>
          </div>
        </div>

        {/* 5. MOBILE FILTER & SORT BUTTONS ROW MATCHING REFERENCE SCREENSHOT */}
        <div className="mobile-combo-controls-container">
          <div className="mobile-combo-buttons-row">
            <button 
              type="button" 
              className="mobile-combo-ctrl-btn"
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <FiSliders className="text-danger" />
              <span>FILTER</span>
              <FiChevronDown className="ms-1" />
              {hasActiveFilters && <span className="mobile-active-dot" />}
            </button>

            <button 
              type="button" 
              className="mobile-combo-ctrl-btn"
              onClick={() => setIsSortDrawerOpen(true)}
            >
              <span>SORT</span>
              <FiChevronDown className="ms-1" />
            </button>
          </div>

          {/* Active Chips Row */}
          {hasActiveFilters && (
            <div className="mobile-active-chips-scroll mt-2">
              {selectedCategory !== 'All' && (
                <span className="mobile-chip-tag">
                  {selectedCategory} <FiX onClick={() => setSelectedCategory('All')} />
                </span>
              )}
              {priceLimit < 50000 && (
                <span className="mobile-chip-tag">
                  Under ₹{priceLimit} <FiX onClick={() => setPriceLimit(50000)} />
                </span>
              )}
              <button type="button" className="mobile-reset-link" onClick={clearAllFilters}>Reset</button>
            </div>
          )}
        </div>

        {/* 6. SINGLE-COLUMN MOBILE COMBO CARDS GRID MATCHING REFERENCE SCREENSHOT */}
        <section className="px-3 py-2">
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-danger" role="status" />
              <p className="text-white-50 small mt-2">Loading smart combos...</p>
            </div>
          ) : displayedCombos.length > 0 ? (
            <div className="mobile-combos-single-col-grid">
              {displayedCombos.map((combo, idx) => {
                const discountPct = (combo.original_price && combo.offer_price) 
                  ? Math.round(((combo.original_price - combo.offer_price) / combo.original_price) * 100)
                  : 30;

                const img1 = combo.items?.[0]?.image || combo.images?.[0] || FALLBACK_COMBO_PHOTOS[idx % 4];
                const img2 = combo.items?.[1]?.image || combo.images?.[1] || combo.images?.[0] || FALLBACK_COMBO_PHOTOS[(idx + 1) % 4];
                
                const itemSummary = combo.items_summary || (
                  combo.items && combo.items.length > 0
                    ? `▣ ${combo.items.length} Items`
                    : '▣ 2 Items'
                );

                const isWished = isInWishlist(combo.id);

                return (
                  <div key={combo.id} className="mobile-creative-combo-card">
                    {/* Top Discount Badge & Wishlist Button */}
                    <div className="mobile-combo-card-top">
                      <span className="mobile-discount-badge">-{discountPct}%</span>
                      <button 
                        type="button"
                        className={`mobile-wishlist-circle-btn ${isWished ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(combo);
                        }}
                        aria-label="Add to Wishlist"
                      >
                        <FiHeart />
                      </button>
                    </div>

                    {/* Multi-Product Split Image Box with Central Plus Circle */}
                    <Link to={`/combo/${combo.id}`} className="mobile-split-photo-box">
                      <div className="mobile-photo-col">
                        <img src={img1} alt={combo.name} className="mobile-item-photo" />
                      </div>
                      
                      {/* Plus Circle Indicator */}
                      <div className="mobile-plus-circle-badge">+</div>

                      <div className="mobile-photo-col">
                        <img src={img2} alt={combo.name} className="mobile-item-photo" />
                      </div>
                    </Link>

                    {/* Combo Info Body */}
                    <div className="mobile-combo-info-body">
                      <Link to={`/combo/${combo.id}`} className="mobile-combo-title-link">
                        <h3 className="mobile-combo-title">{combo.name}</h3>
                      </Link>

                      <div className="mobile-combo-items-summary">
                        {itemSummary}
                      </div>

                      <div className="mobile-combo-price-row">
                        <span className="mobile-offer-price">₹{combo.offer_price?.toLocaleString()}</span>
                        {combo.original_price && (
                          <span className="mobile-original-price">₹{combo.original_price?.toLocaleString()}</span>
                        )}
                      </div>

                      <Link to={`/combo/${combo.id}`} className="btn-mobile-view-combo-cta">
                        VIEW COMBO &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mobile-empty-state text-center py-5">
              <h4 className="text-white mb-2">NO COMBOS FOUND</h4>
              <p className="text-white-50 extra-small">Try clearing filters to explore all smart combo deals.</p>
              <button type="button" className="btn-mobile-red-solid py-2 px-4 mt-2" onClick={clearAllFilters}>
                CLEAR FILTERS
              </button>
            </div>
          )}

          {/* Load More Button */}
          {displayedCombos.length < filteredCombos.length && (
            <div className="text-center my-4">
              <button 
                type="button" 
                className="btn-mobile-load-more w-100"
                onClick={() => setDisplayCount(prev => prev + 6)}
              >
                LOAD MORE COMBOS ↻
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

        {/* 10. MOBILE FILTER DRAWER */}
        {isFilterDrawerOpen && (
          <div className="mobile-app-filter-backdrop" onClick={() => setIsFilterDrawerOpen(false)}>
            <div className="mobile-app-filter-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-top-bar">
                <div className="d-flex align-items-center gap-2">
                  <FiSliders className="text-danger" />
                  <h3 className="mobile-drawer-title">FILTERS</h3>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <button type="button" className="mobile-clear-red" onClick={clearAllFilters}>
                    Clear All
                  </button>
                  <button type="button" className="mobile-close-x" onClick={() => setIsFilterDrawerOpen(false)}>
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="mobile-drawer-scroll-body">
                {/* Categories */}
                <div className="mobile-accordion-group">
                  <h4 className="mobile-accordion-header text-danger mb-2">CATEGORIES</h4>
                  <div className="d-flex flex-column gap-2">
                    {categoryOptions.map((cat, idx) => (
                      <label key={idx} className="mobile-filter-check-row">
                        <input 
                          type="checkbox"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                        />
                        <span className="cat-name">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Limit */}
                <div className="mobile-accordion-group mt-3">
                  <h4 className="mobile-accordion-header text-danger mb-2">MAX PRICE</h4>
                  <input 
                    type="range"
                    min="1500"
                    max="50000"
                    step="1000"
                    value={priceLimit}
                    onChange={(e) => setPriceLimit(Number(e.target.value))}
                    className="mobile-price-slider w-100 mb-2"
                  />
                  <div className="d-flex justify-content-between text-white-50 extra-small">
                    <span>₹1,500</span>
                    <span>₹{priceLimit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mobile-drawer-bottom-bar">
                <button 
                  type="button" 
                  className="mobile-view-products-btn"
                  onClick={() => setIsFilterDrawerOpen(false)}
                >
                  VIEW {filteredCombos.length} COMBOS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 11. MOBILE SORT BOTTOM SHEET */}
        {isSortDrawerOpen && (
          <div className="mobile-app-filter-backdrop" onClick={() => setIsSortDrawerOpen(false)}>
            <div className="mobile-sort-bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary mb-3">
                <h4 className="mobile-drawer-title mb-0">SORT BY</h4>
                <button type="button" className="mobile-close-x" onClick={() => setIsSortDrawerOpen(false)}>
                  <FiX />
                </button>
              </div>

              <div className="d-flex flex-column gap-2">
                {[
                  { label: 'Popularity', val: 'popularity' },
                  { label: 'Price: Low to High', val: 'price-low' },
                  { label: 'Price: High to Low', val: 'price-high' },
                  { label: 'Biggest Savings', val: 'discount' }
                ].map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`mobile-sort-option-btn ${sortBy === opt.val ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy(opt.val);
                      setIsSortDrawerOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.val && <span className="text-danger fw-bold">&bull;</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileCombos;
