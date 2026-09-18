import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FiX, 
  FiSliders, 
  FiHeart, 
  FiChevronDown, 
  FiChevronUp,
  FiChevronRight,
  FiArrowLeft,
  FiArrowRight,
  FiLayers,
  FiShoppingBag,
  FiCheck,
  FiGrid
} from 'react-icons/fi';
import SEO from '../components/common/SEO';
import MobileHeader from '../components/common/MobileHeader';
import MobileMenu from '../components/common/MobileMenu';
import MobileFooterAccordion from '../components/common/MobileFooterAccordion';
import BottomNavbar from '../components/common/BottomNavbar';
import { getCombos, getComboCategories } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { MobileComboCategorySkeleton, MobileComboCardSkeleton } from '../components/common/Skeleton';
import ComboCover from '../components/common/ComboCover';
import { formatPrice, getComboSlug, formatCamelCaseTitle } from '../utils/formatters';
import '../styles/MobileHomepage.css';
import '../components/home/ShopByCategory.css';
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
  const [addingComboId, setAddingComboId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false);
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleClaimCombo = (combo, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAddingComboId(combo.id);
    addToCart({
      id: combo.id,
      name: combo.name,
      price: combo.offer_price || combo.price,
      originalPrice: combo.original_price,
      image: combo.cover_image || combo.image || combo.images?.[0],
      quantity: 1,
      selectedColor: 'Standard Bundle',
      selectedSize: 'L',
      isCombo: true
    });
    setTimeout(() => {
      setAddingComboId(null);
    }, 1500);
  };

  // Category filter from URL or state
  const categoryParam = searchParams.get('category') || 'All';
  const subcategoryParam = searchParams.get('subcategory') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryParam);
  const [priceLimit, setPriceLimit] = useState(50000);
  const [sortBy, setSortBy] = useState('popularity');
  const [displayCount, setDisplayCount] = useState(12);

  // Sync with URL params
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setSelectedSubcategory(subcategoryParam);
  }, [subcategoryParam]);

  const handleCategorySelect = (slugOrName) => {
    setSelectedCategory(slugOrName);
    setSelectedSubcategory('All');
    if (slugOrName === 'All') {
      searchParams.delete('category');
      searchParams.delete('subcategory');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: slugOrName });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [expandedComboCategoryAccordions, setExpandedComboCategoryAccordions] = useState([]);
  const toggleComboCategoryAccordion = (catId, e) => {
    if (e) e.stopPropagation();
    setExpandedComboCategoryAccordions(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // Only top-level parent combo categories
  const parentComboCategories = useMemo(() => {
    return comboCategories.filter(c => !c.parent_id && c.is_active !== false);
  }, [comboCategories]);

  const getSubcategoriesForParent = (parentId) => {
    return comboCategories.filter(c => Number(c.parent_id) === Number(parentId) && c.is_active !== false);
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

  // Active Category details for header
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'All') return null;
    if (selectedCategory === 'all-combos') {
      return { 
        name: 'All Curated Combos', 
        description: 'Curated luxury combo sets and multi-piece bundles collection' 
      };
    }
    return comboCategories.find(c => 
      c.slug === selectedCategory || 
      c.name?.toLowerCase() === selectedCategory.toLowerCase()
    ) || { name: selectedCategory, description: 'Curated combo sets collection' };
  }, [comboCategories, selectedCategory]);

  // Active subcategories under the selected combo category
  const activeSubcategories = useMemo(() => {
    if (selectedCategory === 'All' || selectedCategory === 'all-combos') return [];
    const parent = comboCategories.find(c => 
      c.slug === selectedCategory || 
      c.name?.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (!parent) return [];
    const subs = comboCategories.filter(c => Number(c.parent_id) === Number(parent.id) && c.is_active !== false);
    const seen = new Set(subs.map(s => (s.name || '').toLowerCase()));

    combos.forEach(c => {
      const matchCat = (c.category?.toLowerCase() === parent.name?.toLowerCase()) || (c.category_slug === parent.slug);
      if (matchCat && c.subcategory && typeof c.subcategory === 'string' && c.subcategory.trim()) {
        const subName = c.subcategory.trim();
        if (!seen.has(subName.toLowerCase())) {
          seen.add(subName.toLowerCase());
          subs.push({ id: `sub-${subName}`, name: subName, slug: c.subcategory_slug || subName.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
        }
      }
    });
    return subs;
  }, [selectedCategory, comboCategories, combos]);

  const filteredCombos = useMemo(() => {
    if (selectedCategory === 'All') return [];

    const isAllCombos = selectedCategory === 'all-combos';

    let result = combos.filter(combo => {
      if (!combo) return false;
      
      if (!isAllCombos) {
        // Category filter
        const catQuery = selectedCategory.toLowerCase().trim();
        const activeCatObj = comboCategories.find(cat => 
          (cat.name && cat.name.toLowerCase().trim() === catQuery) ||
          (cat.slug && cat.slug.toLowerCase().trim() === catQuery)
        );

        const qSlug = (activeCatObj?.slug || catQuery).toLowerCase().trim();
        const qName = (activeCatObj?.name || catQuery).toLowerCase().trim();
        const baseSlug = qSlug.replace(/-combos?$/g, '').replace(/combos?$/g, '').trim();

        const comboCats = Array.isArray(combo.categories) && combo.categories.length > 0
          ? combo.categories.map(x => (x || '').toLowerCase().trim())
          : [(combo.category || '').toLowerCase().trim()];
        const comboSlugs = Array.isArray(combo.category_slugs) && combo.category_slugs.length > 0
          ? combo.category_slugs.map(x => (x || '').toLowerCase().trim())
          : [(combo.category_slug || '').toLowerCase().trim()];

        const matched = comboCats.some(c => c === qName || c === qSlug || c.includes(catQuery) || (baseSlug && baseSlug.length > 2 && c.includes(baseSlug))) ||
                        comboSlugs.some(s => s === qSlug || s === qName || s.includes(catQuery) || (baseSlug && baseSlug.length > 2 && s.includes(baseSlug))) ||
                        (baseSlug && baseSlug.length > 2 && (combo.name || '').toLowerCase().includes(baseSlug)) ||
                        combo.items?.some(item => {
                          const name = (item.name || item.pieceLabel || '').toLowerCase();
                          return name.includes(catQuery) || (item.category && item.category.toLowerCase().includes(catQuery));
                        });
        if (!matched) return false;
      }

      // Subcategory filter
      if (selectedSubcategory && selectedSubcategory !== 'All') {
        const subQuery = selectedSubcategory.toLowerCase().trim();
        const comboSub = (combo.subcategory || '').toLowerCase().trim();
        const comboSubSlug = (combo.subcategory_slug || '').toLowerCase().trim();
        const matchesSub = comboSub === subQuery || comboSubSlug === subQuery;
        if (!matchesSub) return false;
      }

      // Price filter
      const price = Number(combo.offer_price || combo.price || 0);
      if (price > priceLimit) return false;

      return true;
    });

    // Dynamic non-mutating sorting
    return [...result].sort((a, b) => {
      const priceA = Number(a.offer_price || a.price || 0);
      const priceB = Number(b.offer_price || b.price || 0);
      const origA = Number(a.original_price || a.originalPrice || priceA);
      const origB = Number(b.original_price || b.originalPrice || priceB);
      const discA = Math.max(0, origA - priceA);
      const discB = Math.max(0, origB - priceB);
      const discPctA = origA > 0 ? (discA / origA) * 100 : 0;
      const discPctB = origB > 0 ? (discB / origB) * 100 : 0;

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'discount') return discPctB - discPctA || discB - discA;
      if (sortBy === 'newest') {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        if (dateA && dateB && dateA !== dateB) return dateB - dateA;
        return String(b.id || '').localeCompare(String(a.id || ''));
      }
      return (Number(b.popularity || b.pieces_count) || 0) - (Number(a.popularity || a.pieces_count) || 0);
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
              <div className="m-combo-sec-header mb-3">
                <h3 className="m-combo-sec-title">
                  <FiLayers className="text-danger me-1.5" />
                  EXPLORE BY CATEGORY
                </h3>
                <div className="m-combo-header-actions">
                  <button 
                    type="button" 
                    className="m-combo-view-all-btn"
                    onClick={() => handleCategorySelect('all-combos')}
                  >
                    View All ({combos.length})
                  </button>
                  <span className="m-combo-cat-count-pill">{parentComboCategories.length} Categories</span>
                </div>
              </div>

              {loading ? (
                <div className="mobile-combo-categories-single-cards-list">
                  {[1, 2, 3, 4].map((i) => (
                    <MobileComboCategorySkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="mobile-combo-categories-single-cards-list">
                  {parentComboCategories.map((cat, idx) => {
                    const count = getCategoryComboCount(cat);
                    const subCats = getSubcategoriesForParent(cat.id);

                    return (
                      <div
                        key={cat.id || idx}
                        className="fashion-category-card"
                        onClick={() => handleCategorySelect(cat.slug || cat.name)}
                        role="button"
                        tabIndex={0}
                      >
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="fashion-cat-img"
                          />
                        ) : (
                          <div className="fashion-cat-img orderly-img-fallback">ORDERLY</div>
                        )}
                        <div className="fashion-cat-overlay" />
                        <div className="fashion-cat-red-accent" />
                        <span className="m-combo-cat-count-tag">
                          {count > 0 ? `${count} Combos` : 'Curated Set'}
                        </span>

                        <div className="fashion-cat-content">
                          <h3 className="fashion-cat-title">{cat.name}</h3>
                          {(cat.description || cat.sub) && (
                            <p className="fashion-cat-sub">{cat.description || cat.sub}</p>
                          )}
                          {subCats.length > 0 && (
                            <p className="extra-small text-white-50 mt-1 mb-2">
                              ↳ {subCats.length} sub-categor{subCats.length > 1 ? 'ies' : 'y'}: {subCats.slice(0, 3).map(s => s.name).join(', ')}{subCats.length > 3 ? '...' : ''}
                            </p>
                          )}
                          <span className="fashion-cat-link">
                            VIEW SETS <span className="cat-arrow">&rarr;</span>
                          </span>
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

              {/* Subcategories Horizontal Scroll */}
              {activeSubcategories.length > 0 && (
                <div className="d-flex align-items-center gap-1.5 overflow-auto pt-2 pb-1" style={{ whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedSubcategory === 'All' ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: '20px', fontSize: '0.75rem', padding: '3px 12px', fontWeight: '600' }}
                    onClick={() => {
                      setSelectedSubcategory('All');
                      searchParams.delete('subcategory');
                      setSearchParams(searchParams);
                    }}
                  >
                    All
                  </button>
                  {activeSubcategories.map(sub => {
                    const val = sub.slug || sub.name;
                    const isActive = selectedSubcategory.toLowerCase() === val.toLowerCase() || selectedSubcategory.toLowerCase() === (sub.name || '').toLowerCase();
                    return (
                      <button
                        key={sub.id || sub.slug}
                        type="button"
                        className={`btn btn-sm ${isActive ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                        style={{ borderRadius: '20px', fontSize: '0.75rem', padding: '3px 12px', fontWeight: '600' }}
                        onClick={() => {
                          setSelectedSubcategory(val);
                          searchParams.set('subcategory', val);
                          setSearchParams(searchParams);
                        }}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
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
                    const savings = Math.max(0, (combo.original_price || 0) - (combo.offer_price || combo.price || 0));
                    const discountPct = combo.original_price > 0 ? Math.round((savings / combo.original_price) * 100) : 0;
                    const isWished = isInWishlist(combo.id);
                    const pcsCount = combo.pieces_count || combo.items?.length || 2;

                    return (
                      <div key={combo.id} className="product-card mobile-creative-combo-card">
                        {/* Media Container with 3:4 Aspect Ratio */}
                        <div className="product-card-media">
                          <Link to={`/combo/${getComboSlug(combo)}`} className="product-image-link">
                            <ComboCover
                              items={combo.items}
                              images={combo.images}
                              coverImage={combo.cover_image}
                              comboName={combo.name}
                            />
                          </Link>

                          {/* Top-Left Red Badge on Image */}
                          <div className="card-badges-stack">
                            <span className="card-top-badge badge-red-tag">
                              {combo.badge ? combo.badge : discountPct > 0 ? `SAVE ${discountPct}%` : 'COMBO'}
                            </span>
                          </div>

                          {/* Wishlist Button Top Right */}
                          <button 
                            type="button"
                            className={`card-wishlist-top-btn ${isWished ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(combo);
                            }}
                            aria-label="Add to Wishlist"
                          >
                            <FiHeart fill={isWished ? "#E50914" : "none"} color={isWished ? "#E50914" : "#FFF"} />
                          </button>
                        </div>

                        {/* Combo Info Body matching reference screenshot */}
                        <div className="combo-card-info-body">
                          {/* 1. Category Eyebrow Tag in RED */}
                          <div className="combo-card-category-eyebrow">
                            {(combo.category || selectedCategory || 'COLLEGE COMBO').toUpperCase()}
                          </div>

                          {/* 2. Combo Title */}
                          <h5 className="combo-card-title-wrap">
                            <Link to={`/combo/${getComboSlug(combo)}`} className="combo-card-title-link">
                              <span className="combo-card-title-text">{formatCamelCaseTitle(combo.name)}</span>
                            </Link>
                          </h5>

                          {/* 3. Items Set Tag */}
                          <div className="combo-card-items-tag">
                            <FiGrid className="combo-card-items-icon" />
                            <span>{pcsCount} Items Set</span>
                          </div>

                          {/* 4. Price Row with Red Offer Price & Grey Old Price */}
                          <div className="combo-card-price-row">
                            <span className="combo-offer-price-red">{formatPrice(combo.offer_price || combo.price || 0)}</span>
                            {combo.original_price && combo.original_price > (combo.offer_price || combo.price) && (
                              <span className="combo-original-price-grey">{formatPrice(combo.original_price)}</span>
                            )}
                          </div>

                          {/* 5. Action Row - VIEW COMBO CTA Button */}
                          <div className="combo-card-action-row mt-auto" onClick={(e) => e.stopPropagation()}>
                            <Link 
                              to={`/combo/${getComboSlug(combo)}`} 
                              className="btn-view-combo-cta"
                            >
                              VIEW COMBO
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <p className="mb-2">No combos found matching your filters.</p>
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={clearAllFilters}
                  >
                    Reset Filters
                  </button>
                </div>
              )}

              {/* Load More Button */}
              {displayedCombos.length < filteredCombos.length && (
                <div className="text-center pt-3 pb-2">
                  <button
                    type="button"
                    className="btn-mobile-load-more w-100"
                    onClick={() => setDisplayCount((prev) => prev + 12)}
                  >
                    Load More Sets ({filteredCombos.length - displayedCombos.length} Remaining)
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Filter Drawer Popup (Price Limit) */}
        {isFilterDrawerOpen && (
          <div className="mobile-combos-sheet-backdrop" onClick={() => setIsFilterDrawerOpen(false)}>
            <div className="mobile-bottom-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <h4 className="mb-0 font-weight-bold">Filter Combos</h4>
                <button type="button" className="mobile-drawer-close" onClick={() => setIsFilterDrawerOpen(false)}>
                  <FiX />
                </button>
              </div>

              <div className="mobile-drawer-body py-3">
                {/* 1. COMBO CATEGORIES & SUBCATEGORIES ACCORDION */}
                <div className="mb-4 pb-3 border-bottom">
                  <label className="text-muted small fw-bold mb-2 text-uppercase letter-spacing-1 d-block">
                    COMBO CATEGORIES
                  </label>

                  <div className="d-flex flex-column gap-2">
                    {/* All Combos option */}
                    <label className="mobile-filter-radio-row cursor-pointer">
                      <input
                        type="radio"
                        name="combo_category_filter"
                        checked={selectedCategory === 'all-combos' || selectedCategory === 'All'}
                        onChange={() => handleCategorySelect('all-combos')}
                      />
                      <span className="fw-medium">All Combos ({combos.length})</span>
                    </label>

                    {/* Parent Categories with nested Subcategories in Accordion */}
                    {parentComboCategories.map(cat => {
                      const count = getCategoryComboCount(cat);
                      const subCats = getSubcategoriesForParent(cat.id);
                      const isCatSelected = (selectedCategory || '').toLowerCase() === (cat.slug || cat.name).toLowerCase() || (selectedCategory || '').toLowerCase() === (cat.name || '').toLowerCase();
                      const isExpanded = expandedComboCategoryAccordions.includes(cat.id) || isCatSelected || subCats.some(sub => (selectedSubcategory || '').toLowerCase() === (sub.slug || sub.name).toLowerCase());

                      return (
                        <div key={cat.id || cat.slug} className="mobile-cat-tree-node">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="mobile-filter-radio-row flex-grow-1 mb-0 cursor-pointer">
                              <input
                                type="radio"
                                name="combo_category_filter"
                                checked={isCatSelected && selectedSubcategory === 'All'}
                                onChange={() => {
                                  handleCategorySelect(cat.slug || cat.name);
                                  if (!expandedComboCategoryAccordions.includes(cat.id)) {
                                    setExpandedComboCategoryAccordions(prev => [...prev, cat.id]);
                                  }
                                }}
                              />
                              <span className="fw-medium">{cat.name}</span>
                              <span className="text-muted extra-small ms-1">({count})</span>
                            </label>
                            {subCats.length > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-muted p-1 text-decoration-none d-flex align-items-center"
                                style={{ fontSize: '13px', lineHeight: 1 }}
                                onClick={(e) => toggleComboCategoryAccordion(cat.id, e)}
                                title={isExpanded ? 'Collapse sub-categories' : 'Expand sub-categories'}
                              >
                                {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                              </button>
                            )}
                          </div>

                          {/* Nested Subcategories */}
                          {subCats.length > 0 && isExpanded && (
                            <div className="mobile-subcat-tree ms-3 ps-2 border-start my-1 d-flex flex-column gap-1">
                              {subCats.map(sub => {
                                const val = sub.slug || sub.name;
                                const isSubActive = isCatSelected && (selectedSubcategory.toLowerCase() === val.toLowerCase() || selectedSubcategory.toLowerCase() === (sub.name || '').toLowerCase());

                                return (
                                  <label key={sub.id || sub.slug} className="mobile-filter-radio-row py-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="combo_category_filter"
                                      checked={isSubActive}
                                      onChange={() => {
                                        if (!isCatSelected) {
                                          setSelectedCategory(cat.slug || cat.name);
                                        }
                                        setSelectedSubcategory(val);
                                        const p = new URLSearchParams(searchParams);
                                        p.set('category', cat.slug || cat.name);
                                        p.set('subcategory', val);
                                        setSearchParams(p);
                                      }}
                                    />
                                    <span 
                                      style={{
                                        fontSize: '0.82rem',
                                        color: isSubActive ? '#e50914' : '#94a3b8',
                                        fontWeight: isSubActive ? '600' : 'normal'
                                      }}
                                    >
                                      {sub.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. MAX PRICE LIMIT */}
                <label className="text-muted small fw-bold mb-2 text-uppercase letter-spacing-1">MAX PRICE LIMIT</label>
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
          <div className="mobile-combos-sheet-backdrop" onClick={() => setIsSortDrawerOpen(false)}>
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
                    { id: 'newest', label: 'Newest Arrivals' },
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
