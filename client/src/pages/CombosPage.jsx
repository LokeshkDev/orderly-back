import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiArrowRight, FiSliders, FiX, FiCheck } from 'react-icons/fi';
import SEO from '../components/common/SEO';
import { getCombos, getProducts } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import MobileCombos from './MobileCombos';
import './CombosPage.css';

const FALLBACK_COMBO_PHOTOS = [
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop'
];

const CombosPage = () => {
  const [combos, setCombos] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, toggleWishlist } = useWishlist();

  // Desktop Filter Toolbar States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceLimit, setPriceLimit] = useState(50000);
  const [sortBy, setSortBy] = useState('popularity');

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

  const isInWishlist = (id) => {
    return wishlist ? wishlist.some(item => String(item.id) === String(id)) : false;
  };

  return (
    <>
      <SEO 
        title="Smart Combos & Bigger Savings | ORDERLY Mens Wear"
        description="Discover luxury menswear combo bundles. Save up to 35% on curated 2-piece shirts, polo t-shirts, cargo pants and denim sets."
      />

      {/* Render Mobile App Combos Page on mobile viewports */}
      <MobileCombos />

      {/* Render Desktop Combos Page on desktop viewports */}
      <main className="orderly-combos-page desktop-only">
        {/* 1. HERO BANNER MATCHING REFERENCE SCREENSHOT */}
        <div className="combos-hero-banner">
          <div className="combos-hero-overlay" />
          <div className="combos-hero-bg-graphic" />

          <div className="container-fluid px-lg-5 position-relative z-2">
            <span className="combos-hero-eyebrow">COMBOS &mdash;</span>
            <h1 className="combos-hero-title">
              SMART COMBOS<br />
              <span className="text-red-accent">BIGGER SAVINGS</span>
            </h1>
            <p className="combos-hero-sub">
              Handpicked combos for your style and comfort
            </p>
          </div>
        </div>

        {/* 2. FILTER + SORT TOOLBAR MATCHING REFERENCE SCREENSHOT */}
        <div className="container-fluid px-lg-5 py-3">
          <div className="combos-toolbar-bar">
            <div className="d-flex align-items-center gap-3">
              <span className="toolbar-label">FILTER BY:</span>

              {/* Categories Select Dropdown */}
              <select 
                className="orderly-custom-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Shirts">Shirts</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Pants">Pants</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Jeans">Jeans</option>
              </select>

              {/* Price Select Dropdown */}
              <select 
                className="orderly-custom-select"
                value={priceLimit}
                onChange={(e) => setPriceLimit(Number(e.target.value))}
              >
                <option value="50000">All Prices</option>
                <option value="1500">Under ₹1,500</option>
                <option value="2500">Under ₹2,500</option>
                <option value="5000">Under ₹5,000</option>
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="toolbar-label">SORT BY:</span>
              <select 
                className="orderly-custom-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount">Biggest Savings</option>
              </select>
            </div>
          </div>

          {/* Active Filters Bar */}
          {(selectedCategory !== 'All' || priceLimit < 50000) && (
            <div className="combos-active-chips-bar my-2">
              <span className="chips-title">Active Filters:</span>
              {selectedCategory !== 'All' && (
                <span className="active-chip">
                  Category: {selectedCategory} <FiX onClick={() => setSelectedCategory('All')} />
                </span>
              )}
              {priceLimit < 50000 && (
                <span className="active-chip">
                  Under ₹{priceLimit} <FiX onClick={() => setPriceLimit(50000)} />
                </span>
              )}
              <button 
                type="button" 
                className="reset-chips-btn"
                onClick={() => { setSelectedCategory('All'); setPriceLimit(50000); }}
              >
                Clear All
              </button>
            </div>
          )}

          {/* 3. 4-COLUMN CREATIVE DESKTOP COMBOS GRID MATCHING REFERENCE SCREENSHOT */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status" />
              <p className="text-muted small mt-2">Loading smart combos...</p>
            </div>
          ) : filteredCombos.length > 0 ? (
            <div className="desktop-combos-grid">
              {filteredCombos.map((combo, idx) => {
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
                  <div key={combo.id} className="creative-combo-card">
                    {/* Top Discount Badge & Wishlist Button */}
                    <div className="combo-card-top-bar">
                      <span className="combo-discount-badge">-{discountPct}%</span>
                      <button 
                        type="button"
                        className={`combo-wishlist-btn ${isWished ? 'active' : ''}`}
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
                    <Link to={`/combo/${combo.id}`} className="combo-split-photo-box">
                      <div className="combo-photo-col">
                        <img src={img1} alt={combo.name} className="combo-item-photo" />
                      </div>
                      
                      {/* Plus Circle Indicator */}
                      <div className="combo-plus-circle-badge">+</div>

                      <div className="combo-photo-col">
                        <img src={img2} alt={combo.name} className="combo-item-photo" />
                      </div>
                    </Link>

                    {/* Combo Info Body */}
                    <div className="combo-card-info-body">
                      <Link to={`/combo/${combo.id}`} className="combo-card-title-link">
                        <h3 className="combo-card-title">{combo.name}</h3>
                      </Link>

                      <div className="combo-card-items-summary">
                        {itemSummary}
                      </div>

                      <div className="combo-card-price-row">
                        <span className="combo-offer-price">₹{combo.offer_price?.toLocaleString()}</span>
                        {combo.original_price && (
                          <span className="combo-original-price">₹{combo.original_price?.toLocaleString()}</span>
                        )}
                      </div>

                      <Link to={`/combo/${combo.id}`} className="btn-view-combo-cta">
                        VIEW COMBO &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="combos-empty-card text-center py-5">
              <h3 className="text-white mb-2">NO COMBOS FOUND</h3>
              <p className="text-muted small">Try adjusting your category or price filters to explore smart combo deals.</p>
              <button 
                type="button" 
                className="btn-admin-red mt-3 px-4 py-2"
                onClick={() => { setSelectedCategory('All'); setPriceLimit(50000); }}
              >
                CLEAR FILTERS
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CombosPage;
