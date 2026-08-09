import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiSearch, FiEdit, FiTrash2, FiX, FiCheck, 
  FiLayers, FiPackage, FiGrid, FiTag, FiShoppingBag, FiDollarSign, FiPercent, FiBox
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import FileUploadInput from '../../components/common/FileUploadInput';
import './CombosList.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const CombosList = () => {
  const [combos, setCombos] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [pieceFilter, setPieceFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('existing'); // 'existing' or 'custom'
  const [editingCombo, setEditingCombo] = useState(null);

  // Form State
  const [piecesCount, setPiecesCount] = useState(2);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    offer_price: 0,
    original_price: 0,
    badge: '',
    status: 'Active',
    description: '',
    images: [],
    is_existing_products_combo: true,
    items: []
  });

  // Selected product IDs for Existing Products mode
  const [selectedProductIds, setSelectedProductIds] = useState(['', '', '', '']);

  // Fetch combos & existing products from DB — the DB is the single source of truth.
  const loadData = async () => {
    setLoading(true);
    try {
      const [combosRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/combos?includeDeleted=true`),
        axios.get(`${API_BASE_URL}/products`)
      ]);

      if (combosRes.data && combosRes.data.success && Array.isArray(combosRes.data.data)) {
        setCombos(combosRes.data.data);
      } else {
        setCombos([]);
      }

      if (productsRes.data && productsRes.data.success && Array.isArray(productsRes.data.data)) {
        setProductsCatalog(productsRes.data.data);
      } else {
        setProductsCatalog([]);
      }
    } catch (err) {
      console.warn('Failed to load combos/products from DB:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize Items array whenever piecesCount or mode changes
  const initItemsForPieces = (count, mode, currentSelectedIds = selectedProductIds) => {
    const itemsArr = [];
    let calcOriginalPrice = 0;

    for (let i = 0; i < count; i++) {
      if (mode === 'existing') {
        const prodId = currentSelectedIds[i] || '';
        const prod = productsCatalog.find(p => String(p.id) === String(prodId));
        if (prod) {
          calcOriginalPrice += Number(prod.price || 0);
          itemsArr.push({
            pieceIndex: i + 1,
            pieceLabel: `Piece ${i + 1}: ${prod.name}`,
            productId: prod.id,
            name: prod.name,
            colors: prod.colors || [{ name: 'Default', hex: '#111111', images: prod.images }],
            sizes: prod.sizes || ['S', 'M', 'L', 'XL']
          });
        } else {
          itemsArr.push({
            pieceIndex: i + 1,
            pieceLabel: `Piece ${i + 1}: (Select Product)`,
            productId: '',
            name: '',
            colors: [],
            sizes: []
          });
        }
      } else {
        // Custom Mode
        itemsArr.push({
          pieceIndex: i + 1,
          pieceLabel: `Piece ${i + 1}`,
          productId: `custom-p${i + 1}`,
          name: '',
          colors: [],
          sizes: []
        });
      }
    }

    return { itemsArr, calcOriginalPrice };
  };

  const openModal = (mode, comboToEdit = null) => {
    setModalMode(mode);
    setEditingCombo(comboToEdit);

    if (comboToEdit) {
      setPiecesCount(comboToEdit.pieces_count || 2);
      const prodIds = ['', '', '', ''];
      comboToEdit.items?.forEach((item, idx) => {
        if (idx < 4) prodIds[idx] = item.productId || '';
      });
      setSelectedProductIds(prodIds);

      setFormData({
        id: comboToEdit.id,
        name: comboToEdit.name,
        slug: comboToEdit.slug || comboToEdit.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        pieces_count: comboToEdit.pieces_count || 2,
        offer_price: comboToEdit.offer_price,
        original_price: comboToEdit.original_price,
        badge: comboToEdit.badge || '',
        status: comboToEdit.status || 'Active',
        description: comboToEdit.description || '',
        images: comboToEdit.images || [],
        is_existing_products_combo: comboToEdit.is_existing_products_combo ?? (mode === 'existing'),
        items: comboToEdit.items || []
      });
    } else {
      // New Combo
      const count = 2;
      setPiecesCount(count);
      const defaultIds = ['', '', '', ''];
      setSelectedProductIds(defaultIds);

      const { itemsArr, calcOriginalPrice } = initItemsForPieces(count, mode, defaultIds);

      setFormData({
        id: `combo-${Date.now()}`,
        name: '',
        slug: `combo-${Date.now()}`,
        pieces_count: count,
        offer_price: calcOriginalPrice > 0 ? Math.round(calcOriginalPrice * 0.7) : 0,
        original_price: calcOriginalPrice > 0 ? calcOriginalPrice : 0,
        badge: '',
        status: 'Active',
        description: '',
        images: itemsArr.flatMap(it => it.colors?.[0]?.images || []).filter(Boolean).slice(0, 3),
        is_existing_products_combo: (mode === 'existing'),
        items: itemsArr
      });
    }

    setIsModalOpen(true);
  };

  // Handle Changing Piece Count (2, 3, or 4)
  const handlePiecesCountChange = (newCount) => {
    setPiecesCount(newCount);
    const { itemsArr, calcOriginalPrice } = initItemsForPieces(newCount, modalMode, selectedProductIds);
    setFormData(prev => ({
      ...prev,
      pieces_count: newCount,
      original_price: calcOriginalPrice > 0 ? calcOriginalPrice : prev.original_price,
      offer_price: calcOriginalPrice > 0 ? Math.round(calcOriginalPrice * 0.7) : prev.offer_price,
      items: itemsArr
    }));
  };

  // Handle selecting an existing product for slot `slotIndex` (0, 1, 2, 3)
  const handleSelectProductForSlot = (slotIndex, prodId) => {
    const updatedIds = [...selectedProductIds];
    updatedIds[slotIndex] = prodId;
    setSelectedProductIds(updatedIds);

    const { itemsArr, calcOriginalPrice } = initItemsForPieces(piecesCount, 'existing', updatedIds);
    const imagesList = itemsArr.flatMap(it => it.colors?.[0]?.images || []).filter(Boolean);

    setFormData(prev => ({
      ...prev,
      original_price: calcOriginalPrice > 0 ? calcOriginalPrice : prev.original_price,
      offer_price: calcOriginalPrice > 0 ? Math.round(calcOriginalPrice * 0.75) : prev.offer_price,
      images: imagesList.length > 0 ? imagesList : prev.images,
      items: itemsArr
    }));
  };

  // Save Combo to DB
  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.offer_price) {
      toast.error('Combo Name and Offer Price are required');
      return;
    }

    const finalCombo = {
      ...formData,
      pieces_count: piecesCount,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    try {
      if (editingCombo) {
        const res = await axios.put(`${API_BASE_URL}/combos/${editingCombo.id}`, finalCombo);
        if (res.data && res.data.success) {
          toast.success(`Combo "${formData.name}" updated successfully!`);
        }
      } else {
        const res = await axios.post(`${API_BASE_URL}/combos`, finalCombo);
        if (res.data && res.data.success) {
          toast.success(`New ${piecesCount}-piece combo "${formData.name}" created successfully!`);
        }
      }
      loadData();
      window.dispatchEvent(new CustomEvent('orderly_combos_updated'));
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save combo');
    }
  };

  // Delete Combo
  const handleDeleteCombo = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete combo "${name}"?`)) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/combos/${id}`);
        if (res.data && res.data.success) {
          toast.success(`Combo "${name}" removed from catalog.`);
          loadData();
          window.dispatchEvent(new CustomEvent('orderly_combos_updated'));
        }
      } catch (err) {
        toast.error('Failed to delete combo.');
      }
    }
  };

  // Filter combos by search term & dropdown filters
  const filteredCombos = combos.filter(c => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.badge?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPiece = pieceFilter === 'All' || String(c.pieces_count || 2) === String(pieceFilter);
    const matchesMode = modeFilter === 'All' || 
      (modeFilter === 'existing' && c.is_existing_products_combo) ||
      (modeFilter === 'custom' && !c.is_existing_products_combo);

    return matchesSearch && matchesPiece && matchesMode;
  });

  // Calculate stats
  const activeCount = combos.filter(c => c.status === 'Active').length;
  const existingCount = combos.filter(c => c.is_existing_products_combo).length;
  const customCount = combos.filter(c => !c.is_existing_products_combo).length;

  return (
    <div className="combos-page p-4">
      {/* Top Title & Header Actions */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="combos-header-title">
            <FiLayers className="text-warning" /> Combos & Bundles Management
          </h1>
          <p className="combos-header-sub">Create 2, 3, or 4-piece curated combo offers from existing catalog products or custom deals.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn-combo-primary"
            onClick={() => openModal('existing')}
          >
            <FiPlus /> Add Combo from Existing Products
          </button>
          <button 
            type="button" 
            className="btn-combo-secondary"
            onClick={() => openModal('custom')}
          >
            <FiPackage /> Add Custom Combo
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="combo-stat-card">
            <div>
              <div className="combo-stat-label">ACTIVE COMBOS</div>
              <div className="combo-stat-val">{activeCount}</div>
            </div>
            <div className="combo-stat-icon emerald">
              <FiLayers />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="combo-stat-card">
            <div>
              <div className="combo-stat-label">CATALOG BUNDLES</div>
              <div className="combo-stat-val">{existingCount}</div>
            </div>
            <div className="combo-stat-icon indigo">
              <FiGrid />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="combo-stat-card">
            <div>
              <div className="combo-stat-label">CUSTOM DEALS</div>
              <div className="combo-stat-val">{customCount}</div>
            </div>
            <div className="combo-stat-icon gold">
              <FiBox />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="combo-stat-card">
            <div>
              <div className="combo-stat-label">MAX BUNDLE PIECES</div>
              <div className="combo-stat-val">4 Items</div>
            </div>
            <div className="combo-stat-icon emerald">
              <FiPercent />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Filters Bar */}
      <div className="combo-toolbar-card mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-6 col-lg-6">
            <div className="combo-search-wrapper">
              <FiSearch className="combo-search-icon" />
              <input 
                type="text" 
                className="combo-search-input"
                placeholder="Search combos by title, ID, badge, or tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3 col-lg-3">
            <select 
              className="combo-select-filter w-100"
              value={pieceFilter}
              onChange={(e) => setPieceFilter(e.target.value)}
            >
              <option value="All">All Piece Bundles</option>
              <option value="2">2-Piece Deals</option>
              <option value="3">3-Piece Deals</option>
              <option value="4">4-Piece Deals</option>
            </select>
          </div>

          <div className="col-md-3 col-lg-3">
            <select 
              className="combo-select-filter w-100"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="All">All Creation Modes</option>
              <option value="existing">Existing Products</option>
              <option value="custom">Custom Bundles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Combos Data Table */}
      <div className="combo-table-card">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle mb-0">
            <thead>
              <tr>
                <th className="ps-4" style={{ minWidth: '280px' }}>COMBO OFFER</th>
                <th>PIECES</th>
                <th>MODE</th>
                <th>ORIGINAL PRICE</th>
                <th>OFFER PRICE</th>
                <th>SAVINGS BADGE</th>
                <th>STATUS</th>
                <th className="text-end pe-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <span className="spinner-border spinner-border-sm text-danger me-2" role="status" /> Loading combos catalog...
                  </td>
                </tr>
              ) : filteredCombos.length > 0 ? (
                filteredCombos.map(combo => (
                  <tr key={combo.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={combo.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop'} 
                          alt={combo.name} 
                          className="combo-tbl-thumb"
                        />
                        <div>
                          <div className="combo-title-text">{combo.name}</div>
                          <span className="combo-code-badge">{combo.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-pieces">
                        {combo.pieces_count || 2} Pieces
                      </span>
                    </td>
                    <td>
                      {combo.is_existing_products_combo ? (
                        <span className="badge-mode-existing">
                          <FiGrid /> Existing Catalog
                        </span>
                      ) : (
                        <span className="badge-mode-custom">
                          <FiBox /> Custom Deal
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="combo-price-original">₹{combo.original_price}</span>
                    </td>
                    <td>
                      <span className="combo-price-offer">₹{combo.offer_price}</span>
                    </td>
                    <td>
                      <span className="badge-savings-tag">
                        {combo.badge || 'SPECIAL DEAL'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-pill ${combo.status === 'Active' ? 'active' : 'draft'}`}>
                        {combo.status || 'Active'}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => openModal(combo.is_existing_products_combo ? 'existing' : 'custom', combo)}
                          title="Edit Combo"
                        >
                          <FiEdit /> Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2 text-danger"
                          onClick={() => handleDeleteCombo(combo.id, combo.name)}
                          title="Delete Combo"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="py-4">
                      <FiLayers style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '12px' }} />
                      <p className="fw-bold text-dark mb-1">No combo deals found</p>
                      <p className="small text-muted mb-3">Try adjusting your search criteria or create a new bundle deal.</p>
                      <button 
                        className="btn-combo-primary" 
                        onClick={() => openModal('existing')}
                      >
                        <FiPlus /> Add Combo Deal
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Combo Builder Modal */}
      {isModalOpen && (
        <div className="combo-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="combo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="combo-modal-header">
              <div>
                <h3 className="combo-modal-title">
                  <FiLayers className="text-danger" /> 
                  {editingCombo ? 'Edit Combo Deal' : modalMode === 'existing' ? 'Create Combo from Catalog Products' : 'Create Custom Combo Deal'}
                </h3>
                <span className="text-muted small">Configure bundle items, offer pricing, and promotional badges.</span>
              </div>
              <button 
                type="button" 
                className="combo-modal-close"
                onClick={() => setIsModalOpen(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveCombo}>
              <div className="combo-modal-body">
                <div className="row g-3 mb-4">
                  {/* Pieces Count Selection (2, 3, or 4) */}
                  <div className="col-12">
                    <label className="admin-form-label">BUNDLE PIECES COUNT</label>
                    <div className="piece-count-selector">
                      {[2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          className={`piece-count-btn ${piecesCount === num ? 'active' : ''}`}
                          onClick={() => handlePiecesCountChange(num)}
                        >
                          <FiGrid /> {num} Pieces ({num} Items)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Combo Title */}
                  <div className="col-md-8">
                    <label className="admin-form-label">Combo Offer Title *</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Resort Linen & Selvedge Denim 2-Piece Deal"
                    />
                  </div>

                  {/* Badge Tag */}
                  <div className="col-md-4">
                    <label className="admin-form-label">Savings Badge Tag</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      value={formData.badge}
                      onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                      placeholder="e.g. SAVE 30% OFF"
                    />
                  </div>

                  {/* Pricing Row */}
                  <div className="col-md-5">
                    <label className="admin-form-label">Original Price Sum (₹)</label>
                    <input 
                      type="number" 
                      className="admin-input"
                      value={formData.original_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, original_price: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="admin-form-label text-success">Offer Price (₹) *</label>
                    <input 
                      type="number" 
                      className="admin-input fw-bold fs-5 text-success"
                      required
                      value={formData.offer_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, offer_price: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="admin-form-label">Status</label>
                    <select
                      className="admin-select"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Price Calculation Banner */}
                  {formData.original_price > 0 && formData.offer_price > 0 && (
                    <div className="col-12">
                      <div className="price-summary-banner">
                        <div className="d-flex align-items-center gap-2">
                          <FiPercent className="text-success fs-5" />
                          <span className="small text-dark fw-bold">
                            Combined MSRP: ₹{formData.original_price} &nbsp;➔&nbsp; Bundle Offer: ₹{formData.offer_price}
                          </span>
                        </div>
                        <span className="badge bg-success text-white px-3 py-1 fw-bold rounded-pill">
                          Customer Saves ₹{Math.max(0, formData.original_price - formData.offer_price)} ({Math.round(((formData.original_price - formData.offer_price) / formData.original_price) * 100)}% OFF)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="col-12">
                    <label className="admin-form-label">Combo Description</label>
                    <textarea 
                      rows="2"
                      className="admin-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of what is included in this bundle deal..."
                    />
                  </div>
                </div>

                {/* PIECE SELECTION SECTION */}
                <div className="piece-config-box">
                  <h6 className="admin-form-label text-primary mb-3">
                    CONFIGURE {piecesCount} BUNDLE PIECES
                  </h6>

                  {modalMode === 'existing' ? (
                    /* EXISTING PRODUCTS PICKER */
                    <div className="row g-3">
                      {Array.from({ length: piecesCount }).map((_, idx) => (
                        <div key={idx} className="col-md-6 col-lg-4">
                          <div className="piece-slot-card">
                            <div className="piece-slot-header">
                              PIECE {idx + 1} PRODUCT
                            </div>
                            <select 
                              className="admin-select mb-2"
                              value={selectedProductIds[idx] || ''}
                              onChange={(e) => handleSelectProductForSlot(idx, e.target.value)}
                            >
                              <option value="">-- Choose Catalog Product --</option>
                              {productsCatalog.map(prod => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} (₹{prod.price})
                                </option>
                              ))}
                            </select>

                            {/* Selected Item Preview */}
                            {formData.items?.[idx]?.name ? (
                              <div className="piece-slot-preview">
                                <img 
                                  src={formData.items[idx].colors?.[0]?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&auto=format&fit=crop'} 
                                  alt={formData.items[idx].name} 
                                  className="piece-preview-img"
                                />
                                <div>
                                  <div className="fw-bold text-dark small line-clamp-1">{formData.items[idx].name}</div>
                                  <div className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>
                                    Sizes: {formData.items[idx].sizes?.join(', ')}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted small italic mt-2" style={{ fontSize: '0.78rem' }}>
                                Choose a product above to import specs.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* CUSTOM PIECES BUILDER WITH EXISTING PRODUCTS DROPDOWN */
                    <div className="row g-3">
                      {formData.items?.slice(0, piecesCount).map((item, idx) => (
                        <div key={idx} className="col-md-6 col-lg-4">
                          <div className="piece-slot-card">
                            <div className="piece-slot-header">
                              PIECE {idx + 1} PRODUCT SELECT
                            </div>

                            <label className="admin-form-label mb-1">Select Catalog Product *</label>
                            <select 
                              className="admin-select mb-2"
                              value={item.productId || selectedProductIds[idx] || ''}
                              onChange={(e) => handleSelectProductForSlot(idx, e.target.value)}
                            >
                              <option value="">-- Choose Existing Product --</option>
                              {productsCatalog.map(prod => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} (₹{prod.price})
                                </option>
                              ))}
                            </select>

                            <label className="admin-form-label mb-1">Piece Title / Label</label>
                            <input 
                              type="text"
                              className="admin-input mb-2"
                              placeholder="Piece Name (e.g. Italian Linen Shirt)"
                              value={item.name || ''}
                              onChange={(e) => {
                                const updatedItems = [...formData.items];
                                updatedItems[idx].name = e.target.value;
                                setFormData(prev => ({ ...prev, items: updatedItems }));
                              }}
                            />
                            <div className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>
                              Sizes: {item.sizes?.join(', ') || 'S, M, L, XL'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Combo Cover Image Upload */}
                <div className="col-12 mt-3 px-1">
                  <FileUploadInput 
                    value={formData.images?.[0] || ''}
                    onChange={(url) => setFormData(prev => ({ 
                      ...prev, 
                      images: url ? [url, ...(prev.images?.slice(1) || [])] : prev.images 
                    }))}
                    type="image"
                    folder="combos"
                    label="COMBO BANNER / COVER IMAGE (Upload)"
                    recommendedSize="Recommended: 1200 x 800 px (3:2 Aspect Ratio)"
                  />
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="d-flex justify-content-end gap-2 border-top border-slate-200 p-3 bg-light" style={{ borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
                <button 
                  type="button" 
                  className="btn-admin-outline" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-combo-primary"
                >
                  <FiCheck /> {editingCombo ? 'Save Combo Changes' : 'Publish Combo Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombosList;
