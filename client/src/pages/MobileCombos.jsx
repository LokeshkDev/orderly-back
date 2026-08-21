import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FiX, 
  FiSliders, 
  FiHeart, 
  FiChevronDown, 
  FiArrowLeft,
  FiArrowRight,
  FiLayers
} from 'react-icons/fi';
import SEO from '../components/common/SEO';
import MobileHeader from '../components/common/MobileHeader';
import MobileMenu from '../components/common/MobileMenu';
import MobileFooterAccordion from '../components/common/MobileFooterAccordion';
import BottomNavbar from '../components/common/BottomNavbar';
import { getCombos, getComboCategories } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { MobileComboCategorySkeleton, MobileComboCardSkeleton } from '../components/common/Skeleton';
import '../styles/MobileHomepage.css';
import './MobileCombos.css';

const DEFAULT_COMBO_CATEGORIES = [
  { id: 101, name: 'Executive & Formal Combos', slug: 'formal-combos', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop', description: 'Tailored 2-piece and 3-piece formal suiting & linen sets' },
  { id: 102, name: 'Casual Weekend Sets', slug: 'casual-combos', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop', description: 'Everyday relaxed tees, casual shirts, and comfort trousers' },
  { id: 103, name: 'Partywear & Evening Sets', slug: 'partywear-combos', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop', description: 'Bold jackets, satin sheen shirts, and slim chino styling' },
  { id: 104, name: 'Summer Vacation Outfits', slug: 'summer-combos', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop', description: 'Lightweight linens, breathable polo shirts, and stretch shorts' }
];

const MobileCombos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [combos, setCombos] = useState([]);
  const [comboCategories, setComboCategories] = useState(DEFAULT_COMBO_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false);
  const { wishlist, toggleWishlist } = useWishlist();

  // Category filter from URL or state
  const categoryParam = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [priceLimit, setPriceLimit] = useState(50000);
  const [sortBy, setSortBy] = useState('popularity');
  const [displayCount, setDisplayCount] = useState(12);

  // Sync with URL params
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        console.warn('Failed to fetch combos/products/categories:', err);
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

  // Active Category details
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'All') return null;
    return comboCategories.find(c => 
      c.slug === selectedCategory || 
      c.name?.toLowerCase() === selectedCategory.toLowerCase()
    ) || { name: selectedCategory, description: 'Curated combo sets collection' };
  }, [comboCategories, selectedCategory]);

  const filteredCombos = useMemo(() => {
    if (selectedCategory === 'All') return [];

    let result = combos.filter(combo => {
      if (!combo) return false;
      
      // Category filter
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

  const displayedCombos = useMemo(() => {
    return filteredCombos.slice(0, displayCount);
  }, [filteredCombos, displayCount]);

  const isInWishlist = (id) => {
    return wishlist ? wishlist.some(item => String(item.id) === String(id)) : false;
  };

  const clearAllFilters = () => {
    setPriceLimit(50000);
    setSortBy('popularity');
    setDisplayCount(12);
    setIsFilterDrawerOpen(false);
  };

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
        title={activeCategoryObj ? `${activeCategoryObj.name} | ORDERLY Combos` : "Smart Combos & Categories | ORDERLY Mobile Shopping App"}
        description="Shop luxury men's combo categories and curated multi-piece bundles on mobile. Save up to 35% on complete styling sets."
      />

      <div className="mobile-app-wrapper mobile-only">
        {/* 1. Mobile App Header */}
        <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />

        {/* 3. Mobile Slide-Out Drawer */}
        <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        {selectedCategory === 'All' ? (
          /* ========================================================= */
          /* 1. MAIN MOBILE COMBOS PAGE — ONLY COMBO CATEGORIES (1 CARD/ROW) */
          /* ========================================================= */
          <div className="mobile-combos-landing">
            {/* HERO BANNER */}
            <div className="mobile-combo-hero">
              <div className="mobile-combo-hero-overlay" />
              <div className="mobile-combo-hero-content">
                <span className="mobile-hero-eyebrow">CURATED COMBOS &mdash;</span>
                <h1 className="mobile-hero-title">
                  SMART COMBOS<br />
                  <span className="text-red-accent">BIGGER SAVINGS</span>
                </h1>
                <p className="mobile-hero-sub">
                  Select a combo category below to explore curated multi-piece menswear ensembles
                </p>
              </div>
            </div>

            {/* SINGLE CARD COMBO CATEGORIES LIST (1 CARD PER ROW) */}
            <div className="mobile-combo-categories-container px-3 py-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="m-combo-sec-title">
                  <FiLayers className="text-danger me-2" />
                  EXPLORE BY CATEGORY
                </h3>
                <span className="m-combo-cat-count-pill">{comboCategories.length} Categories</span>
              </div>

              {loading ? (
                <div className="mobile-combo-categories-single-cards-list">
                  {[1, 2, 3, 4].map((i) => (
                    <MobileComboCategorySkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="mobile-combo-categories-single-cards-list">
                  {comboCategories.map((cat, idx) => {
                    const count = getCategoryComboCount(cat);

                    return (
                      <div
                        key={cat.id || idx}
                        className="m-combo-single-cat-card"
                        onClick={() => handleCategorySelect(cat.slug || cat.name)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="m-combo-cat-card-img-wrap">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="m-combo-cat-card-img"
                            />
                          ) : (
                            <div className="m-combo-cat-card-img orderly-img-fallback">ORDERLY</div>
                          )}
                          <div className="m-combo-cat-card-gradient" />
                          <span className="m-combo-cat-count-tag">
                            {count > 0 ? `${count} Combos` : 'Curated Set'}
                          </span>
                        </div>

                        <div className="m-combo-cat-card-body">
                          <h4 className="m-combo-cat-card-title">{cat.name}</h4>
                          {cat.description && (
                            <p className="m-combo-cat-card-desc">{cat.description}</p>
                          )}
                          <div className="m-combo-cat-card-cta">
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
        ) : (
          /* ========================================================= */
          /* 2. DEDICATED MOBILE CATEGORY PAGE — RESPECTIVE COMBOS     */
          /* ========================================================= */
          <div className="mobile-combo-category-view">
            {/* DEDICATED MOBILE CATEGORY HEADER */}
            <div className="mobile-combo-category-header px-3 py-3">
              <button
                type="button"
                className="m-back-to-all-cats-btn mb-2"
                onClick={() => handleCategorySelect('All')}
              >
                <FiArrowLeft /> All Combo Categories
              </button>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="m-category-page-title mb-1">{activeCategoryObj?.name}</h2>
                  {activeCategoryObj?.description && (
                    <p className="m-category-page-desc mb-0">{activeCategoryObj.description}</p>
                  )}
                </div>
                <span className="m-cat-page-count-badge flex-shrink-0">
                  {filteredCombos.length} Sets
                </span>
              </div>
            </div>

            {/* FILTER & SORT BUTTONS ROW */}
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
                  {priceLimit < 50000 && <span className="mobile-active-dot" />}
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

              {/* Active Filter Chips Row */}
              {priceLimit < 50000 && (
                <div className="mobile-active-chips-scroll mt-2">
                  <span className="mobile-chip-tag">
                    Under ₹{priceLimit} <FiX onClick={() => setPriceLimit(50000)} />
                  </span>
                  <button type="button" className="mobile-reset-link" onClick={clearAllFilters}>Reset</button>
                </div>
              )}
            </div>

            {/* SINGLE-COLUMN RESPECTIVE COMBOS GRID */}
            <section className="px-3 py-3">
              {loading ? (
                <div className="mobile-combos-single-col-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <MobileComboCardSkeleton key={i} />
                  ))}
                </div>
              ) : displayedCombos.length > 0 ? (
                <div className="mobile-combos-single-col-grid">
                  {displayedCombos.map((combo) => {
                    const discountPct = (combo.original_price && combo.offer_price) 
                      ? Math.round(((combo.original_price - combo.offer_price) / combo.original_price) * 100)
                      : 30;

                    const img1 = combo.items?.[0]?.image || combo.images?.[0] || '';
                    const img2 = combo.items?.[1]?.image || combo.images?.[1] || combo.images?.[0] || '';
                    
                    const itemSummary = combo.items_summary || (
                      combo.items && combo.items.length > 0
                        ? `▣ ${combo.items.length} Items Set`
                        : `▣ ${combo.pieces_count || 2} Pieces Set`
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

                        {/* Split Photo Box */}
                        <Link to={`/combo/${combo.id}`} className="mobile-split-photo-box">
                          <div className="mobile-photo-col">
                            {img1 ? (
                              <img src={img1} alt={combo.name} className="mobile-item-photo" loading="lazy" />
                            ) : (
                              <div className="orderly-img-fallback">ORDERLY</div>
                            )}
                          </div>
                          <div className="mobile-plus-circle-badge">+</div>
                          <div className="mobile-photo-col">
                            {img2 ? (
                              <img src={img2} alt={combo.name} className="mobile-item-photo" loading="lazy" />
                            ) : (
                              <div className="orderly-img-fallback">ORDERLY</div>
                            )}
                          </div>
                        </Link>

                        {/* Info Body */}
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
                            {combo.original_price && combo.offer_price && combo.original_price > combo.offer_price && (
                              <span className="mobile-save-tag">SAVE ₹{(combo.original_price - combo.offer_price).toLocaleString()}</span>
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
                <div className="mobile-combos-empty text-center py-5">
                  <FiLayers style={{ fontSize: '3rem', color: '#475569', marginBottom: '12px' }} />
                  <h4 className="text-white mb-1">No Combos in this Category</h4>
                  <p className="text-muted small mb-3">No combo sets are currently added under "{activeCategoryObj?.name}".</p>
                  <button 
                    type="button" 
                    className="btn-admin-red px-4 py-2"
                    onClick={() => handleCategorySelect('All')}
                  >
                    View All Categories
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Filter Drawer Popup (Price Limit) */}
        {isFilterDrawerOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setIsFilterDrawerOpen(false)}>
            <div className="mobile-bottom-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <h4 className="mb-0 font-weight-bold">Filter Combos</h4>
                <button type="button" className="mobile-drawer-close" onClick={() => setIsFilterDrawerOpen(false)}>
                  <FiX />
                </button>
              </div>

              <div className="mobile-drawer-body py-3">
                <label className="admin-form-label mb-2">MAX PRICE LIMIT</label>
                <div className="d-flex flex-column gap-2">
                  {[50000, 3000, 6000, 10000].map(price => (
                    <label key={price} className="mobile-filter-radio-row">
                      <input
                        type="radio"
                        name="price_filter"
                        checked={priceLimit === price}
                        onChange={() => setPriceLimit(price)}
                      />
                      <span>{price === 50000 ? 'All Prices' : `Under ₹${price.toLocaleString()}`}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mobile-drawer-footer">
                <button type="button" className="btn-admin-outline w-50" onClick={clearAllFilters}>Reset</button>
                <button type="button" className="btn-admin-red w-50" onClick={() => setIsFilterDrawerOpen(false)}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* Sort Drawer Popup */}
        {isSortDrawerOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setIsSortDrawerOpen(false)}>
            <div className="mobile-bottom-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <h4 className="mb-0 font-weight-bold">Sort Combos</h4>
                <button type="button" className="mobile-drawer-close" onClick={() => setIsSortDrawerOpen(false)}>
                  <FiX />
                </button>
              </div>

              <div className="mobile-drawer-body py-3">
                <div className="d-flex flex-column gap-2">
                  {[
                    { id: 'popularity', label: 'Popularity' },
                    { id: 'price-low', label: 'Price: Low to High' },
                    { id: 'price-high', label: 'Price: High to Low' },
                    { id: 'discount', label: 'Biggest Savings' }
                  ].map(opt => (
                    <label key={opt.id} className="mobile-filter-radio-row">
                      <input
                        type="radio"
                        name="sort_filter"
                        checked={sortBy === opt.id}
                        onChange={() => {
                          setSortBy(opt.id);
                          setIsSortDrawerOpen(false);
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <MobileFooterAccordion />
      </div>
    </>
  );
};

export default MobileCombos;
