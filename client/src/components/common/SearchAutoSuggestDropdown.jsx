import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiArrowRight, FiGrid, FiLayers } from 'react-icons/fi';
import { getProducts, getCombos } from '../../services/api';
import ComboCover from './ComboCover';
import { formatPrice, getComboSlug, getProductSlug } from '../../utils/formatters';
import './SearchAutoSuggestDropdown.css';

const getProductPrimaryImg = (prod) => {
  if (!prod) return '';
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    const img0 = prod.images[0];
    return typeof img0 === 'string' ? img0 : img0?.url || img0?.image_url || '';
  }
  if (Array.isArray(prod.colors) && prod.colors[0]?.images?.[0]) {
    const c0 = prod.colors[0].images[0];
    return typeof c0 === 'string' ? c0 : c0?.url || c0?.image_url || '';
  }
  return typeof prod.image === 'string' ? prod.image : '';
};

const SearchAutoSuggestDropdown = ({
  searchQuery = '',
  isOpen = false,
  onSelect = () => {},
  onClose = () => {}
}) => {
  const navigate = useNavigate();
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [combosCatalog, setCombosCatalog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const [prodRes, comboRes] = await Promise.all([
          getProducts(),
          getCombos()
        ]);
        if (isMounted) {
          if (prodRes?.data && Array.isArray(prodRes.data)) {
            setProductsCatalog(prodRes.data);
          }
          if (comboRes?.data && Array.isArray(comboRes.data)) {
            setCombosCatalog(comboRes.data);
          }
        }
      } catch (err) {
        console.warn('Auto-suggest catalog fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isOpen) {
      loadCatalog();
    }
    return () => { isMounted = false; };
  }, [isOpen]);

  const query = (searchQuery || '').trim().toLowerCase();

  const { matchedProducts, matchedCombos } = useMemo(() => {
    if (!query || query.length < 1) {
      return { matchedProducts: [], matchedCombos: [] };
    }

    const matchedProds = productsCatalog.filter(p => {
      if (!p) return false;
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return name.includes(query) || cat.includes(query) || desc.includes(query);
    }).slice(0, 4);

    const matchedCmbs = combosCatalog.filter(c => {
      if (!c) return false;
      const name = (c.name || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();
      const catSlug = (c.category_slug || '').toLowerCase();
      const itemsMatch = c.items?.some(it => (it.name || '').toLowerCase().includes(query));
      return name.includes(query) || cat.includes(query) || catSlug.includes(query) || itemsMatch;
    }).slice(0, 4);

    return { matchedProducts: matchedProds, matchedCombos: matchedCmbs };
  }, [query, productsCatalog, combosCatalog]);

  if (!isOpen || !query) return null;

  const totalResults = matchedProducts.length + matchedCombos.length;

  const handleProductClick = (product) => {
    onSelect();
    navigate(`/product/${getProductSlug(product)}`);
  };

  const handleComboClick = (combo) => {
    onSelect();
    navigate(`/combo/${getComboSlug(combo)}`);
  };

  const handleViewAllClick = () => {
    onSelect();
    navigate(`/shop?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="search-autosuggest-menu shadow-lg">
      {loading ? (
        <div className="autosuggest-loading p-3 text-center text-muted small">
          <span className="spinner-border spinner-border-sm me-2 text-danger" role="status" />
          Searching catalog...
        </div>
      ) : totalResults > 0 ? (
        <div className="autosuggest-content">
          {/* COMBOS SUGGESTIONS SECTION */}
          {matchedCombos.length > 0 && (
            <div className="autosuggest-group">
              <div className="autosuggest-group-header">
                <FiLayers className="text-danger me-1" />
                <span>COMBO BUNDLES ({matchedCombos.length})</span>
              </div>
              <div className="autosuggest-items-list">
                {matchedCombos.map(combo => {
                  const pcsCount = combo.pieces_count || combo.items?.length || 2;
                  return (
                    <div 
                      key={`combo-${combo.id}`}
                      className="autosuggest-item combo-item-row"
                      onClick={() => handleComboClick(combo)}
                    >
                      <div className="autosuggest-thumb combo-thumb">
                        <ComboCover 
                          items={combo.items} 
                          images={combo.images} 
                          coverImage={combo.cover_image}
                          comboName={combo.name}
                        />
                      </div>
                      <div className="autosuggest-info flex-grow-1 min-w-0">
                        <div className="autosuggest-eyebrow text-danger">
                          {(combo.category || 'COMBO BUNDLE').toUpperCase()}
                        </div>
                        <div className="autosuggest-title text-truncate">{combo.name}</div>
                        <div className="autosuggest-meta d-flex align-items-center gap-2">
                          <span className="text-muted small d-inline-flex align-items-center gap-1">
                            <FiGrid style={{ fontSize: '10px' }} /> {pcsCount} Items Set
                          </span>
                        </div>
                      </div>
                      <div className="autosuggest-price text-end ps-2">
                        <div className="text-danger fw-bold">{formatPrice(combo.offer_price || combo.price || 0)}</div>
                        {combo.original_price && Number(combo.original_price) > Number(combo.offer_price || combo.price || 0) && (
                          <div className="text-muted small text-decoration-line-through">
                            {formatPrice(combo.original_price)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PRODUCTS SUGGESTIONS SECTION */}
          {matchedProducts.length > 0 && (
            <div className="autosuggest-group">
              <div className="autosuggest-group-header">
                <FiShoppingBag className="text-danger me-1" />
                <span>PRODUCTS ({matchedProducts.length})</span>
              </div>
              <div className="autosuggest-items-list">
                {matchedProducts.map(prod => {
                  const pImg = getProductPrimaryImg(prod);
                  return (
                    <div 
                      key={`prod-${prod.id}`}
                      className="autosuggest-item product-item-row"
                      onClick={() => handleProductClick(prod)}
                    >
                      <div className="autosuggest-thumb prod-thumb">
                        {pImg ? (
                          <img src={pImg} alt={prod.name} className="autosuggest-img" />
                        ) : (
                          <div className="autosuggest-no-img">ORDERLY</div>
                        )}
                      </div>
                      <div className="autosuggest-info flex-grow-1 min-w-0">
                        <div className="autosuggest-eyebrow text-muted">
                          {(prod.category || 'MENSWEAR').toUpperCase()}
                        </div>
                        <div className="autosuggest-title text-truncate">{prod.name}</div>
                      </div>
                      <div className="autosuggest-price text-end ps-2">
                        <div className="text-white fw-bold">{formatPrice(prod.price || 0)}</div>
                        {prod.originalPrice && Number(prod.originalPrice) > Number(prod.price) && (
                          <div className="text-muted small text-decoration-line-through">
                            {formatPrice(prod.originalPrice)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW ALL RESULTS LINK */}
          <div className="autosuggest-footer" onClick={handleViewAllClick}>
            <span>View all search results for "<strong>{searchQuery}</strong>"</span>
            <FiArrowRight />
          </div>
        </div>
      ) : (
        <div className="autosuggest-empty p-3 text-center">
          <div className="text-muted small mb-1">No products or combo deals found for "{searchQuery}"</div>
          <div className="text-danger extra-small fw-bold cursor-pointer" onClick={handleViewAllClick}>
            Search catalog in Shop page <FiArrowRight />
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutoSuggestDropdown;

