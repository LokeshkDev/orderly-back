import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getSettings, matchesCategoryAlias } from '../../services/api';
import { MobileCategorySkeleton } from '../common/Skeleton';

const DEFAULT_MOBILE_CATS = [
  {
    name: 'SHIRTS',
    sub: 'Everyday Luxury Linen',
    categoryQuery: 'Shirts',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'DENIM',
    sub: 'Japanese Selvedge Fit',
    categoryQuery: 'Denim',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'TEES & POLOS',
    sub: 'Urban Streetwear',
    categoryQuery: 'Tops & T-Shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'BLAZERS & SUITS',
    sub: 'Italian Tailored',
    categoryQuery: 'Blazers',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'TROUSERS',
    sub: 'Pleated & Chinos',
    categoryQuery: 'Trousers',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop'
  }
];

const MobileCategories = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [cmsEyebrow, setCmsEyebrow] = useState('');
  const [cmsHeading, setCmsHeading] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [catRes, settingsRes] = await Promise.allSettled([
          getCategories(),
          getSettings()
        ]);

        let allCats = [];
        if (catRes.status === 'fulfilled' && catRes.value?.success && Array.isArray(catRes.value.data)) {
          allCats = catRes.value.data.filter(c => c.is_active !== false);
        }

        let collectionsConfig = null;
        if (settingsRes.status === 'fulfilled' && settingsRes.value?.success && settingsRes.value.data?.collections_config) {
          collectionsConfig = settingsRes.value.data.collections_config;
          if (collectionsConfig.eyebrow) setCmsEyebrow(collectionsConfig.eyebrow);
          if (collectionsConfig.heading) setCmsHeading(collectionsConfig.heading);
        }

        let orderedCats = [];
        const selectedCategoryIds = collectionsConfig?.selectedCategoryIds;
        const selectedCategories = collectionsConfig?.selectedCategories;

        if (Array.isArray(selectedCategoryIds) && selectedCategoryIds.length > 0) {
          selectedCategoryIds.forEach(id => {
            const found = allCats.find(c => String(c.id) === String(id) || String(c._id) === String(id));
            if (found && !orderedCats.some(item => (item.id || item._id) === (found.id || found._id))) {
              orderedCats.push(found);
            }
          });
        }

        if (orderedCats.length === 0 && Array.isArray(selectedCategories) && selectedCategories.length > 0) {
          selectedCategories.forEach(name => {
            const found = allCats.find(c => matchesCategoryAlias(c.name, name));
            if (found && !orderedCats.some(item => (item.id || item._id) === (found.id || found._id))) {
              orderedCats.push(found);
            }
          });
        }

        if (orderedCats.length === 0) {
          orderedCats = allCats;
        }

        if (orderedCats.length > 0) {
          const mapped = orderedCats.map((cat, idx) => ({
            id: cat.id || cat._id,
            name: (cat.name || '').toUpperCase(),
            sub: cat.description || cat.sub || DEFAULT_MOBILE_CATS[idx % DEFAULT_MOBILE_CATS.length]?.sub || 'Everyday Comfort',
            categoryQuery: cat.slug || cat.name,
            image: (cat.image && cat.image.length > 10) ? cat.image : ''
          }));
          setCategories(mapped);
        } else {
          setCategories(DEFAULT_MOBILE_CATS);
        }
      } catch {
        setCategories(DEFAULT_MOBILE_CATS);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();

    const handleUpdated = () => loadCategories();
    window.addEventListener('orderly_categories_updated', handleUpdated);
    window.addEventListener('orderly_site_settings_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('orderly_categories_updated', handleUpdated);
      window.removeEventListener('orderly_site_settings_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  return (
    <section className="mobile-only py-3">
      {/* Header */}
      <div className="mobile-section-header">
        <span className="mobile-section-eyebrow">{cmsEyebrow || 'EXPLORE COLLECTIONS'}</span>
        <h2 className="mobile-section-title">{cmsHeading || 'DISCOVER YOUR STYLE'}</h2>
      </div>

      {/* Horizontal Touch Scrollable Category Cards or Skeleton */}
      {loading ? (
        <MobileCategorySkeleton />
      ) : (
        <div className="mobile-categories-scroll">
          {categories.map((cat, idx) => {
            const isCombo = cat.categoryQuery && (cat.categoryQuery.toLowerCase() === 'combos' || cat.categoryQuery.toLowerCase() === 'combo');
            const targetUrl = isCombo ? '/combos' : `/shop?category=${encodeURIComponent(cat.categoryQuery || '')}`;
            return (
              <Link
                key={idx}
                to={targetUrl}
                className="mobile-category-card"
              >
                {cat.image && cat.image.length > 0 ? (
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="mobile-category-img"
                    width="140"
                    height="180"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="mobile-category-img orderly-img-fallback">ORDERLY</div>
                )}
                <div className="mobile-category-overlay" />
                <div className="mobile-category-info">
                  <div className="mobile-category-name">{cat.name}</div>
                  <span className="mobile-category-sub">{cat.sub}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MobileCategories;
