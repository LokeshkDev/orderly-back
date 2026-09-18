import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FiHeart, FiArrowRight, FiArrowLeft, FiLayers, FiShoppingBag, FiCheck, FiGrid
} from 'react-icons/fi';
import SEOHead from '../components/common/SEOHead';
import { getCombos, getComboCategories } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { ComboCategoryCardSkeleton, ComboCardSkeleton } from '../components/common/Skeleton';
import ComboCover from '../components/common/ComboCover';
import MobileCombos from './MobileCombos';
import useIsMobile from '../utils/useIsMobile';
import { formatPrice, getComboSlug, formatCamelCaseTitle } from '../utils/formatters';
import '../components/home/ShopByCategory.css';
import './CombosPage.css';

const DEFAULT_COMBO_CATEGORIES = [
  { id: 101, name: 'Executive & Formal Combos', slug: 'formal-combos', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop', description: 'Tailored 2-piece and 3-piece formal suiting & linen sets' },
  { id: 102, name: 'Casual Weekend Sets', slug: 'casual-combos', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop', description: 'Everyday relaxed tees, casual shirts, and comfort trousers' },
  { id: 103, name: 'Partywear & Evening Sets', slug: 'partywear-combos', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop', description: 'Bold jackets, satin sheen shirts, and slim chino styling' },
  { id: 104, name: 'Summer Vacation Outfits', slug: 'summer-combos', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop', description: 'Lightweight linens, breathable polo shirts, and stretch shorts' }
];

const CombosPage = () => {
  const isMobile = useIsMobile(768);
  const [searchParams, setSearchParams] = useSearchParams();
  const [combos, setCombos] = useState([]);
  const [comboCategories, setComboCategories] = useState(DEFAULT_COMBO_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [addingComboId, setAddingComboId] = useState(null);
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

  // Sync state when URL params change
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

  // Parent Combo Categories only (exclude subcategories from top-level)
  const parentComboCategories = useMemo(() => {
    return comboCategories.filter(c => !c.parent_id && c.is_active !== false);
  }, [comboCategories]);

  const getSubcategoriesForParent = (parentId) => {
    return comboCategories.filter(c => Number(c.parent_id) === Number(parentId) && c.is_active !== false);
  };

  // Find active category details
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'All') return null;
    if (selectedCategory === 'all-combos') {
      return { 
        name: 'All Curated Combos', 
        description: 'Explore our complete collection of luxury tailored menswear sets and outfit bundles' 
      };
    }
    return comboCategories.find(c => 
      c.slug === selectedCategory || 
      c.name?.toLowerCase() === selectedCategory.toLowerCase()
    ) || { name: selectedCategory, description: 'Exclusive curated combo collection' };
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

  // Filtered Combos List for active category
  const categoryCombos = useMemo(() => {
    if (selectedCategory === 'All') return [];

    const isAllCombos = selectedCategory === 'all-combos';

    let result = combos.filter(combo => {
      if (!combo) return false;
      
      if (!isAllCombos) {
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

      // Subcategory filter check
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

    // Dynamic non-mutating sort
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
      <SEOHead 
        title={activeCategoryObj ? `${activeCategoryObj.name} | ORDERLY Combos` : "Smart Combos & Categories | ORDERLY Mens Wear"}
        description="Discover luxury menswear combo categories and curated multi-piece bundles. Save up to 35% on complete styling sets."
        canonicalPath={`/combos${selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : ''}`}
        itemList={{
          name: activeCategoryObj?.name || 'Smart Combos Collection',
          description: 'Explore curated menswear multi-piece bundle sets at ORDERLY.',
          items: combos
        }}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Combos', url: '/combos' },
          ...(activeCategoryObj ? [{ name: activeCategoryObj.name, url: `/combos?category=${encodeURIComponent(selectedCategory)}` }] : [])
        ]}
      />

      {isMobile ? (
        <MobileCombos />
      ) : (
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
                  <div className="d-flex align-items-center gap-3">
                    <button 
                      type="button" 
                      className="btn-primary-orderly px-3 py-1.5 small fw-bold"
                      onClick={() => handleCategorySelect('all-combos')}
                    >
                      View All Combos ({combos.length}) &rarr;
                    </button>
                    <span className="combo-categories-total-count">
                      {parentComboCategories.length} Categories
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="combo-category-cards-grid">
                    {[1, 2, 3, 4].map((i) => (
                      <ComboCategoryCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="combo-category-cards-grid">
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
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'; }}
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
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span className="toolbar-label">FILTER BY:</span>

                  {/* Category Select Dropdown */}
                  <select 
                    className="orderly-custom-select"
                    value={selectedCategory}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                  >
                    <option value="all-combos">All Curated Combos ({combos.length})</option>
                    {parentComboCategories.map(cat => (
                      <option key={cat.id || cat.slug} value={cat.slug || cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

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
                    <option value="newest">Newest Arrivals</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="discount">Biggest Savings</option>
                  </select>
                </div>
              </div>

              {/* Subcategories Pills */}
              {activeSubcategories.length > 0 && (
                <div className="d-flex align-items-center gap-2 flex-wrap mb-4 pb-3 border-bottom">
                  <span className="small text-muted fw-bold me-1">SUB-CATEGORIES:</span>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedSubcategory === 'All' ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '4px 16px', fontWeight: '600' }}
                    onClick={() => {
                      setSelectedSubcategory('All');
                      const p = new URLSearchParams(searchParams);
                      p.delete('subcategory');
                      setSearchParams(p);
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
                        style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '4px 16px', fontWeight: '600' }}
                        onClick={() => {
                          setSelectedSubcategory(val);
                          const p = new URLSearchParams(searchParams);
                          p.set('subcategory', val);
                          setSearchParams(p);
                        }}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              )}

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
                    const savings = Math.max(0, (combo.original_price || 0) - (combo.offer_price || combo.price || 0));
                    const discountPct = combo.original_price > 0 ? Math.round((savings / combo.original_price) * 100) : 0;
                    const isWished = isInWishlist(combo.id);
                    const pcsCount = combo.pieces_count || combo.items?.length || 2;

                    return (
                      <div key={combo.id} className="product-card creative-combo-card">
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
                            {(combo.category || activeCategoryObj?.name || 'COLLEGE COMBO').toUpperCase()}
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
                            {combo.original_price && Number(combo.original_price) > Number(combo.offer_price || combo.price || 0) && (
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
      )}
    </>
  );
};

export default CombosPage;
