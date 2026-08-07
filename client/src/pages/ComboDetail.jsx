import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiShoppingBag, FiCheck, FiChevronRight, FiShield, FiRefreshCw, FiLayers, FiAlertCircle 
} from 'react-icons/fi';
import SEO from '../components/common/SEO';
import { useCart } from '../context/CartContext';
import { getComboById, getCombos, getProducts } from '../services/api';
import { getVariantStock } from './ProductDetail';
import { formatPrice, calculateDiscount } from '../utils/formatters';
import './ComboDetail.css';

const ComboDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [combo, setCombo] = useState(null);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [addedToast, setAddedToast] = useState(false);

  // Selections per piece: { 1: { color: 'Olive Tan', size: 'L' }, 2: { color: 'Indigo Raw', size: '32' } }
  const [pieceSelections, setPieceSelections] = useState({});
  const [validationError, setValidationError] = useState('');

  // Fetch product catalog to inspect single product stock per piece
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await getProducts();
        if (res && res.success && Array.isArray(res.data)) {
          setProductsCatalog(res.data);
        }
      } catch (err) {
        console.warn('Failed to load products catalog for stock sync:', err);
      }
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    const loadCombo = async () => {
      setLoading(true);
      setValidationError('');
      try {
        const res = await getComboById(id);
        if (res && res.success && res.data) {
          setCombo(res.data);
          const initial = {};
          res.data.items?.forEach(item => {
            initial[item.pieceIndex] = {
              color: item.colors?.[0]?.name || '',
              size: item.sizes?.[0] || ''
            };
          });
          setPieceSelections(initial);
        } else {
          // Fallback fetch all combos
          const listRes = await getCombos();
          if (listRes && listRes.success && Array.isArray(listRes.data)) {
            const found = listRes.data.find(c => c.id === id || c.slug === id);
            if (found) {
              setCombo(found);
              const initial = {};
              found.items?.forEach(item => {
                initial[item.pieceIndex] = {
                  color: item.colors?.[0]?.name || '',
                  size: item.sizes?.[0] || ''
                };
              });
              setPieceSelections(initial);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load combo:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCombo();
  }, [id]);

  const handleSelectColor = (pieceIndex, colorName) => {
    setPieceSelections(prev => ({
      ...prev,
      [pieceIndex]: {
        ...prev[pieceIndex],
        color: colorName
      }
    }));
    setValidationError('');
  };

  const handleSelectSize = (pieceIndex, sizeVal) => {
    setPieceSelections(prev => ({
      ...prev,
      [pieceIndex]: {
        ...prev[pieceIndex],
        size: sizeVal
      }
    }));
    setValidationError('');
  };

  const handleAddToCart = () => {
    if (!combo) return;

    // Validate that all pieces have color & size selected
    for (const item of combo.items || []) {
      const sel = pieceSelections[item.pieceIndex];
      if (!sel || !sel.color || !sel.size) {
        setValidationError(`Please select Color and Size for Piece ${item.pieceIndex} (${item.name})`);
        return;
      }

      // Live stock check against single product inventory
      const targetProd = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
      if (targetProd) {
        const stock = getVariantStock(targetProd, sel.color, sel.size);
        if (stock <= 0) {
          setValidationError(`Cannot add to bag: Piece ${item.pieceIndex} (${item.name}) in ${sel.color} / ${sel.size} is OUT OF STOCK. Please choose an available size/color.`);
          return;
        }
      }
    }

    // Build combo cart object
    const selectedPiecesSummary = combo.items.map(item => {
      const sel = pieceSelections[item.pieceIndex];
      return {
        pieceIndex: item.pieceIndex,
        pieceLabel: item.pieceLabel || `Piece ${item.pieceIndex}`,
        productId: item.productId,
        name: item.name,
        color: sel.color,
        size: sel.size
      };
    });

    const comboCartItem = {
      id: `${combo.id}-${Date.now()}`,
      comboId: combo.id,
      name: combo.name,
      price: combo.offer_price,
      originalPrice: combo.original_price,
      image: combo.images?.[0] || '',
      badge: combo.badge || '',
      isCombo: true,
      selectedPieces: selectedPiecesSummary
    };

    addToCart(comboCartItem, 1);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3500);
  };

  if (loading) {
    return (
      <div className="text-center py-5 my-5 text-white">
        <span className="spinner-border text-danger" role="status" />
        <p className="mt-2 text-muted">Loading luxury combo deal...</p>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="text-center py-5 my-5 text-white">
        <h2>Combo Offer Not Found</h2>
        <p className="text-muted">The combo deal you are looking for is no longer active.</p>
        <Link to="/combos" className="btn-primary-orderly mt-3">Back to Combo Offers</Link>
      </div>
    );
  }

  const comboImages = combo.images?.length > 0 ? combo.images : [];

  const savingsAmount = combo.original_price - combo.offer_price;
  const discountPercent = calculateDiscount(combo.original_price, combo.offer_price);

  return (
    <>
      <SEO 
        title={`${combo.name} | ORDERLY Multi-Piece Combo Deal`}
        description={combo.description}
      />

      {addedToast && (
        <div className="combo-added-toast">
          <FiCheck className="fs-5" /> Added Complete {combo.pieces_count}-Piece Combo to Your Bag!
        </div>
      )}

      <main className="combo-detail-page container-fluid px-lg-5 py-4">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb-nav mb-4">
          <Link to="/">Home</Link>
          <FiChevronRight />
          <Link to="/combos">Combos</Link>
          <FiChevronRight />
          <span className="current-crumb">{combo.name}</span>
        </nav>

        <div className="row g-4 g-xl-5">
          {/* Left Column: Image Showcase */}
          <div className="col-lg-6">
            <div className="d-flex gap-3 flex-column flex-md-row">
              {/* Thumbnail Selector */}
              <div className="thumbnail-list-wrapper">
                {comboImages.map((imgUrl, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    className={`thumb-btn ${activeImgIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveImgIndex(idx)}
                  >
                    <img src={imgUrl} alt={`Combo ${idx + 1}`} />
                  </button>
                ))}
              </div>

              {/* Main Image View */}
              <div className="main-image-wrapper flex-grow-1">
                <span className="combo-badge-banner">
                  <FiLayers /> {combo.pieces_count}-PIECE COMBO DEAL
                </span>
                {comboImages[activeImgIndex] || comboImages[0] ? (
                  <img
                    src={comboImages[activeImgIndex] || comboImages[0]}
                    alt={combo.name}
                    className="combo-main-img"
                  />
                ) : (
                  <div className="combo-main-img combo-img-placeholder d-flex align-items-center justify-content-center bg-light">
                    <span className="text-muted small">No Image</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Combo Customizer */}
          <div className="col-lg-6">
            <div className="combo-details-sticky">
              <span className="combo-brand-tag">ORDERLY CURATED BOX</span>
              <h1 className="combo-title">{combo.name}</h1>

              {/* Price Banner */}
              <div className="combo-price-card p-3 my-3 rounded">
                <div className="d-flex align-items-baseline gap-3">
                  <span className="combo-offer-price">{formatPrice(combo.offer_price)}</span>
                  <span className="combo-original-price">{formatPrice(combo.original_price)}</span>
                  <span className="combo-discount-badge">{discountPercent}% OFF</span>
                </div>
                <p className="combo-savings-text mb-0 mt-1">
                  🎉 Total Bundle Savings: <strong>Save {formatPrice(savingsAmount)}</strong>
                </p>
              </div>

              <p className="combo-desc-text text-secondary mb-4">{combo.description}</p>

              {/* Validation Alert */}
              {validationError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3">
                  <FiAlertCircle className="fs-5 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* PIECE SELECTION CARDS */}
              <div className="combo-pieces-selection-section mb-4">
                <h3 className="section-subtitle mb-3 d-flex align-items-center gap-2">
                  <FiCheck className="text-success" /> CUSTOMIZE YOUR {combo.pieces_count} PIECES:
                </h3>

                <div className="d-flex flex-column gap-3">
                  {combo.items?.map((item, idx) => {
                    const sel = pieceSelections[item.pieceIndex] || {};
                    const targetProd = productsCatalog.find(p => String(p.id) === String(item.productId) || p.name === item.name);
                    const selectedVariantStock = targetProd ? getVariantStock(targetProd, sel.color, sel.size) : 10;

                    return (
                      <div key={item.pieceIndex || idx} className="piece-selection-card p-3 rounded">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <strong className="piece-card-title">
                            {item.pieceLabel || `Piece ${idx + 1}: ${item.name}`}
                          </strong>
                          
                          {/* Live Inventory Status Pill */}
                          {selectedVariantStock > 0 ? (
                            <span className="stock-pill-badge in-stock">
                              ✓ In Stock ({selectedVariantStock} available)
                            </span>
                          ) : (
                            <span className="stock-pill-badge out-stock">
                              ❌ OUT OF STOCK (0 available)
                            </span>
                          )}
                        </div>

                        {/* Piece Product Name */}
                        <p className="piece-prod-name text-white font-weight-bold mb-3">{item.name}</p>

                        <div className="row g-3">
                          {/* Color Selector */}
                          {item.colors && item.colors.length > 0 && (
                            <div className="col-md-6">
                              <label className="piece-opt-label">COLOR: <strong className="text-white">{sel.color}</strong></label>
                              <div className="d-flex gap-2 flex-wrap mt-1">
                                {item.colors.map((c, cIdx) => (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    className={`piece-color-btn ${sel.color === c.name ? 'active' : ''}`}
                                    onClick={() => handleSelectColor(item.pieceIndex, c.name)}
                                    title={c.name}
                                  >
                                    <span className="swatch-inner" style={{ backgroundColor: c.hex || '#111111' }} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Size Selector with Single-Product Inventory Sync */}
                          {item.sizes && item.sizes.length > 0 && (
                            <div className="col-md-6">
                              <label className="piece-opt-label">SIZE: <strong className="text-white">{sel.size}</strong></label>
                              <div className="d-flex gap-2 flex-wrap mt-1">
                                {item.sizes.map((sz, sIdx) => {
                                  const szStock = targetProd ? getVariantStock(targetProd, sel.color, sz) : 10;
                                  const isOut = szStock <= 0;
                                  return (
                                    <button
                                      key={sIdx}
                                      type="button"
                                      className={`piece-size-btn ${sel.size === sz ? 'active' : ''} ${isOut ? 'out-of-stock' : ''}`}
                                      onClick={() => handleSelectSize(item.pieceIndex, sz)}
                                      title={isOut ? `Out of Stock (${sz})` : `${szStock} units in stock`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add to Cart CTA */}
              <div className="d-grid gap-2 mb-4">
                <button 
                  type="button" 
                  className="btn-primary-orderly btn-lg py-3 font-weight-bold d-flex align-items-center justify-content-center gap-2 fs-5"
                  onClick={handleAddToCart}
                >
                  <FiShoppingBag /> ADD COMPLETE {combo.pieces_count}-PIECE COMBO TO BAG ({formatPrice(combo.offer_price)})
                </button>
              </div>

              {/* Feature Highlights */}
              <div className="pdp-features-grid py-2 border-top border-secondary pt-3">
                <div className="feature-item">
                  <FiShield /> 100% Guaranteed Luxury Quality
                </div>
                <div className="feature-item">
                  <FiRefreshCw /> 15 Days Easy Returns & Exchanges
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ComboDetail;
