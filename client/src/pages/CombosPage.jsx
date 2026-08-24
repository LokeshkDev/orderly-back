import SEOHead from '../components/common/SEOHead';
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FiHeart, FiArrowRight, FiArrowLeft, FiLayers 
} from 'react-icons/fi';
import SEO from '../components/common/SEO';
import { getCombos, getComboCategories } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { ComboCategoryCardSkeleton, ComboCardSkeleton } from '../components/common/Skeleton';
import MobileCombos from './MobileCombos';
import './CombosPage.css';

const DEFAULT_COMBO_CATEGORIES = [
  { id: 101, name: 'Executive & Formal Combos', slug: 'formal-combos', image: '', description: 'Tailored 2-piece and 3-piece formal suiting & linen sets' },
  { id: 102, name: 'Casual Weekend Sets', slug: 'casual-combos', image: '', description: 'Everyday relaxed tees, casual shirts, and comfort trousers' },
  { id: 103, name: 'Partywear & Evening Sets', slug: 'partywear-combos', image: '', description: 'Bold jackets, satin sheen shirts, and slim chino styling' },
  { id: 104, name: 'Summer Vacation Outfits', slug: 'summer-combos', image: '', description: 'Lightweight linens, breathable polo shirts, and stretch shorts' }
];

const CombosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [combos, setCombos] = useState([]);
  const [comboCategories, setComboCategories] = useState(DEFAULT_COMBO_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const { wishlist, toggleWishlist } = useWishlist();

  // Category filter from URL or state
  const categoryParam = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [priceLimit, setPriceLimit] = useState(50000);
  const [sortBy, setSortBy] = useState('popularity');

  // Sync state when URL params change
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const handleCategorySelect = (slugOrName) => {
    setSelectedCategory(slugOrName);
    if (slugOrName === 'All') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: slugOrName });
    }
  };

  useEffect(() => {
    const fetchCombosAndCategories = async () => {
      setLoading(true);
      try {
        const [combosRes, catsRes] = await Promise.all([
          getCombos(),
          getComboCategories()
        ]);

        if (combosRes && combosRes.success && Array.isArray(combosRes.data)) {
          setCombos(combosRes.data.filter(c => c.status !== 'Inactive'));
        }
        if (catsRes && catsRes.success && Array.isArray(catsRes.data) && catsRes.data.length > 0) {
          setComboCategories(catsRes.data.filter(c => c.is_active !== false));
        }
      } catch (err) {
        console.warn('Failed to fetch combos/categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCombosAndCategories();

    window.addEventListener('orderly_combos_updated', fetchCombosAndCategories);
    window.addEventListener('orderly_categories_updated', fetchCombosAndCategories);
    window.addEventListener('storage', fetchCombosAndCategories);

    return () => {
      window.removeEventListener('orderly_combos_updated', fetchCombosAndCategories);
      window.removeEventListener('orderly_categories_updated', fetchCombosAndCategories);
      window.removeEventListener('storage', fetchCombosAndCategories);
    };
  }, []);

  // Find active category details
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'All') return null;
    return comboCategories.find(c => 
      c.slug === selectedCategory || 
      c.name?.toLowerCase() === selectedCategory.toLowerCase()
    ) || { name: selectedCategory, description: 'Exclusive curated combo collection' };
  }, [comboCategories, selectedCategory]);

  // Filtered Combos List for active category
  const categoryCombos = useMemo(() => {
    if (selectedCategory === 'All') return [];

    let result = combos.filter(combo => {
      if (!combo) return false;
      
      const catQuery = selectedCategory.toLowerCase().trim();
      const comboCat = (combo.category || '').toLowerCase().trim();
      const comboSlug = (combo.category_slug || '').toLowerCase().trim();
      
      const matched = comboCat === catQuery || 
                      comboSlug === catQuery ||
                      comboCat.includes(catQuery) ||
                      combo.name?.toLowerCase().includes(catQuery) ||
                      combo.items?.some(item => {
                        const name = (item.name || item.pieceLabel || '').toLowerCase();
                        return name.includes(catQuery) || (item.category && item.category.toLowerCase().includes(catQuery));
                      });

      if (!matched) return false;

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

  // Compute count of combos per category
  const getCategoryComboCount = (cat) => {
    const qName = (cat.name || '').toLowerCase();
    const qSlug = (cat.slug || '').toLowerCase();
    return combos.filter(c => {
      const cName = (c.category || '').toLowerCase();
      const cSlug = (c.category_slug || '').toLowerCase();
      return cName === qName || cSlug === qSlug || cName.includes(qSlug) || c.name?.toLowerCase().includes(qSlug);
    }).length;
  };

  return (
    <>
      <SEO 
        title={activeCategoryObj ? `${activeCategoryObj.name} | ORDERLY Combos` : "Smart Combos & Categories | ORDERLY Mens Wear"}
        description="Discover luxury menswear combo categories and curated multi-piece bundles. Save up to 35% on complete styling sets."
      />

      {/* Render Mobile App Combos Page on mobile viewports */}
      <MobileCombos />

      {/* Render Desktop Combos Page on desktop viewports */}
      <main className="orderly-combos-page desktop-only">
        {selectedCategory === 'All' ? (
          /* ========================================================= */
          /* 1. MAIN COMBOS LANDING PAGE — SHOW ONLY COMBO CATEGORIES  */
          /* ========================================================= */
          <>
            {/* HERO BANNER */}
            <div className="combos-hero-banner">
              <div className="combos-hero-overlay" />
              <div className="combos-hero-bg-graphic" />

              <div className="container-fluid px-lg-5 combos-hero-content-wrap">
                <span className="combos-hero-eyebrow">CURATED COMBOS &mdash;</span>
                <h1 className="combos-hero-title">
                  SMART COMBOS<br />
                  <span className="text-red-accent">BIGGER SAVINGS</span>
                </h1>
                <p className="combos-hero-sub">
                  Explore curated menswear combo categories designed for your lifestyle, work, and occasions.
                </p>
              </div>
            </div>

            <div className="container-fluid px-lg-5 py-5">
              {/* COMBO CATEGORIES SECTION */}
              <div className="combo-categories-section">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h2 className="combo-sec-title">
                      <FiLayers className="text-danger me-2" />
                      EXPLORE BY COMBO CATEGORY
                    </h2>
                    <p className="combo-sec-sub">Select a combo category below to view tailored multi-piece ensembles</p>
                  </div>
                  <span className="combo-categories-total-count">
                    {comboCategories.length} Categories
                  </span>
                </div>

                {loading ? (
                  <div className="combo-category-cards-grid">
                    {[1, 2, 3, 4].map((i) => (
                      <ComboCategoryCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="combo-category-cards-grid">
                    {comboCategories.map((cat, idx) => {
                      const count = getCategoryComboCount(cat);

                      return (
                        <div
                          key={cat.id || idx}
                          className="combo-category-card"
                          onClick={() => handleCategorySelect(cat.slug || cat.name)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="combo-cat-img-wrapper">
                            <img 
                              src={cat.image || '/logo.png'} 
                              alt={cat.name} 
                              className="combo-cat-img" 
                              onError={(e) => { e.target.src = '/logo.png'; }}
                            />
                            <div className="combo-cat-overlay" />
                            <span className="combo-cat-count-badge">
                              {count > 0 ? `${count} Combos` : 'Curated Set'}
                            </span>
                          </div>

                          <div className="combo-cat-content">
                            <h3 className="combo-cat-name">{cat.name}</h3>
                            {cat.description && (
                              <p className="combo-cat-desc">{cat.description}</p>
                            )}
                            <div className="combo-cat-cta">
                              <span>Explore Combos</span>
                              <FiArrowRight />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* 2. DEDICATED CATEGORY PAGE — RESPECTIVE COMBO PRODUCTS    */
          /* ========================================================= */
          <>
            {/* DEDICATED CATEGORY HEADER BANNER */}
            <div className="combo-category-page-header">
              <div className="container-fluid px-lg-5">
                {/* Breadcrumbs & Back Button */}
                <div className="combo-cat-breadcrumbs mb-3">
                  <button 
                    type="button"
                    className="btn-back-to-categories"
                    onClick={() => handleCategorySelect('All')}
                  >
                    <FiArrowLeft /> All Combo Categories
                  </button>
                  <span className="breadcrumb-sep">/</span>
                  <span className="breadcrumb-current">{activeCategoryObj?.name}</span>
                </div>

                <div className="row align-items-center justify-content-between">
                  <div className="col-lg-8">
                    <span className="combo-hero-eyebrow">COMBO CATEGORY &mdash;</span>
                    <h1 className="combo-cat-page-title">{activeCategoryObj?.name}</h1>
                    {activeCategoryObj?.description && (
                      <p className="combo-cat-page-desc">{activeCategoryObj.description}</p>
                    )}
                  </div>
                  <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                    <span className="combo-cat-items-badge">
                      {categoryCombos.length} Curated Ensembles Available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="container-fluid px-lg-5 py-4">
              {/* FILTER + SORT TOOLBAR */}
              <div className="combos-toolbar-bar mb-4">
                <div className="d-flex align-items-center gap-3">
                  <span className="toolbar-label">FILTER BY:</span>

                  {/* Price Select Dropdown */}
                  <select 
                    className="orderly-custom-select"
                    value={priceLimit}
                    onChange={(e) => setPriceLimit(Number(e.target.value))}
                  >
                    <option value="50000">All Prices</option>
                    <option value="3000">Under ₹3,000</option>
                    <option value="6000">Under ₹6,000</option>
                    <option value="10000">Under ₹10,000</option>
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

              {/* RESPECTIVE COMBO PRODUCTS GRID */}
              {loading ? (
                <div className="desktop-combos-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ComboCardSkeleton key={i} />
                  ))}
                </div>
              ) : categoryCombos.length > 0 ? (
                <div className="desktop-combos-grid">
                  {categoryCombos.map((combo) => {
                    const discountPct = (combo.original_price && combo.offer_price) 
                      ? Math.round(((combo.original_price - combo.offer_price) / combo.original_price) * 100)
                      : 30;

                    const img1 = combo.items?.[0]?.image || combo.images?.[0] || '/logo.png';
                    const img2 = combo.items?.[1]?.image || combo.images?.[1] || combo.images?.[0] || '/logo.png';
                    
                    const itemSummary = combo.items_summary || (
                      combo.items && combo.items.length > 0
                        ? `▣ ${combo.items.length} Items Set`
                        : `▣ ${combo.pieces_count || 2} Pieces Set`
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
                            <img 
                              src={img1} 
                              alt={combo.name} 
                              className="combo-item-photo" 
                              onError={(e) => { e.target.src = '/logo.png'; }}
                            />
                          </div>
                          
                          {/* Plus Circle Indicator */}
                          <div className="combo-plus-circle-badge">+</div>

                          <div className="combo-photo-col">
                            <img 
                              src={img2} 
                              alt={combo.name} 
                              className="combo-item-photo" 
                              onError={(e) => { e.target.src = '/logo.png'; }}
                            />
                          </div>
                        </Link>

                        {/* Combo Info Body */}
                        <div className="combo-card-info-body">
                          {combo.category && (
                            <span className="combo-card-category-tag">{combo.category}</span>
                          )}

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
                  <h3 className="text-white mb-2">NO COMBOS FOUND IN THIS CATEGORY</h3>
                  <p className="text-muted small">No combo sets are currently added under "{activeCategoryObj?.name}".</p>
                  <button 
                    type="button" 
                    className="btn-admin-red mt-3 px-4 py-2"
                    onClick={() => handleCategorySelect('All')}
                  >
                    BACK TO COMBO CATEGORIES
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default CombosPage;
