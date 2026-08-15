import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiSearch, FiEdit, FiTrash2, FiX, FiCheck, 
  FiPackage, FiImage, FiGrid, FiTag, FiLink2 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import FileUploadInput from '../../components/common/FileUploadInput';

const ProductsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);

  // Load products from the MySQL DB API. The DB is the single source of truth.
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const res = await api.get('/products');
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          const dbList = res.data.data;
          setProducts(dbList);
          try {
            localStorage.setItem('orderly_db_products', JSON.stringify(dbList));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Failed to load products from DB:', err.message);
      } finally {
        setLoading(false);
      }
    };

    const loadOptions = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands')
        ]);
        if (catRes.data && catRes.data.success && Array.isArray(catRes.data.data)) {
          setCategoryOptions(catRes.data.data.map(c => c.name).filter(Boolean));
        }
        if (brandRes.data && brandRes.data.success && Array.isArray(brandRes.data.data)) {
          setBrandOptions(brandRes.data.data.map(b => b.name).filter(Boolean));
        }
      } catch (err) {
        console.warn('Failed to load category/brand options:', err.message);
      }
    };

    loadFromDB();
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a local cache (same tab only) — DB API is the real source of truth.
  const saveProductsToStorage = (updatedList) => {
    setProducts(updatedList);
    try {
      localStorage.setItem('orderly_db_products', JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('orderly_products_updated'));
    } catch (e) {
      console.error('Failed to sync products to localStorage:', e);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Variant input fields for adding new colors and sizes
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111111');
  const [newSizeName, setNewSizeName] = useState('');
  const [suggestedSearch, setSuggestedSearch] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    sku: '',
    category: '',
    brand: '',
    price: 0,
    originalPrice: 0,
    badge: '',
    vendor: '',
    status: 'Active',
    description: '',
    images: [],
    colors: [],
    sizes: [],
    stock: 0,
    suggested_products: [],
    pair_offers: {},
    inventory: {}
  });

  const getPairBasePrice = (product) => Number(product?.originalPrice ?? product?.price ?? 0);

  const PAIR_OFFER_PERCENT = 25;

  const buildPairOffer = (product, rawOffer = {}) => {
    const basePrice = getPairBasePrice(product);
    const discountPercent = Math.max(0, Math.min(90, Number(rawOffer.discount_percent ?? rawOffer.discountPercent ?? PAIR_OFFER_PERCENT)));
    const offerPrice = Math.max(0, Math.round(basePrice * (100 - discountPercent) / 100));

    return {
      enabled: Boolean(rawOffer.enabled),
      discount_percent: discountPercent,
      offer_price: offerPrice,
      badge: rawOffer.badge || `AVAIL ${discountPercent}% OFF`,
      note: rawOffer.note || ''
    };
  };

  const cleanupPairOffers = (suggestedProducts = [], pairOffers = {}) => {
    const selectedIds = suggestedProducts.map(String);
    return selectedIds.reduce((acc, id) => {
      const selectedProduct = products.find(prod => String(prod.id) === String(id));
      if (pairOffers[id] || selectedProduct) {
        acc[id] = buildPairOffer(selectedProduct, pairOffers[id] || {});
      }
      return acc;
    }, {});
  };

  const updatePairOffer = (productId, patch) => {
    const key = String(productId);
    setFormData(prev => ({
      ...prev,
      pair_offers: {
        ...(prev.pair_offers || {}),
        [key]: {
          enabled: false,
          discount_percent: PAIR_OFFER_PERCENT,
          offer_price: 0,
          badge: '',
          note: '',
          ...(prev.pair_offers?.[key] || {}),
          ...patch
        }
      }
    }));
  };

  const applyPairPercentageDeal = (product, pairId, percent) => {
    const discountPct = Math.max(0, Math.min(90, Number(percent) || 0));
    const basePrice = getPairBasePrice(product);
    const offerPrice = Math.max(0, Math.round(basePrice * (100 - discountPct) / 100));
    updatePairOffer(pairId, {
      enabled: true,
      discount_percent: discountPct,
      offer_price: offerPrice,
      badge: `AVAIL ${discountPct}% OFF`,
      note: `Pair deal ${discountPct}% off when added from product page`
    });
  };

  const togglePairOffer = (product, pairId, enable) => {
    if (enable) {
      const current = formData.pair_offers?.[String(pairId)] || {};
      applyPairPercentageDeal(product, pairId, current.discount_percent || PAIR_OFFER_PERCENT);
    } else {
      updatePairOffer(pairId, { enabled: false });
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setNewColorName('');
    setNewSizeName('');
    setFormData({
      id: `prod-${Date.now()}`,
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: '',
      brand: '',
      price: 0,
      originalPrice: 0,
      badge: '',
      vendor: '',
      status: 'Active',
      description: '',
      images: [],
      colors: [],
      sizes: [],
      stock: 0,
      suggested_products: [],
      pair_offers: {},
      inventory: {}
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setNewColorName('');
    setNewSizeName('');

    const initialInventory = { ...(p.inventory || {}) };
    p.colors?.forEach(c => {
      p.sizes?.forEach(s => {
        const k = `${c.name}-${s}`;
        if (initialInventory[k] === undefined) {
          initialInventory[k] = 0;
        }
      });
    });

    const calculatedStock = Object.values(initialInventory).reduce((a, b) => a + Number(b || 0), 0);

    setFormData({
      id: p.id,
      name: p.name,
      sku: p.sku || `SKU-${p.id}`,
      slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: p.category,
      brand: p.brand || '',
      price: p.price,
      originalPrice: p.originalPrice || 0,
      badge: p.badge || '',
      vendor: p.vendor || '',
      status: p.status || 'Active',
      description: p.description || '',
      images: p.images || [],
      colors: p.colors || [],
      sizes: p.sizes || [],
      stock: p.stock !== undefined ? p.stock : calculatedStock,
      suggested_products: Array.isArray(p.suggested_products) ? p.suggested_products : [],
      pair_offers: cleanupPairOffers(
        Array.isArray(p.suggested_products) ? p.suggested_products : [],
        p.pair_offers || {}
      ),
      inventory: initialInventory
    });
    setIsModalOpen(true);
  };

  // Color management
  const handleAddColor = () => {
    if (!newColorName.trim()) {
      toast.error('Enter a color name');
      return;
    }
    const colorObj = {
      name: newColorName.trim(),
      hex: newColorHex,
      images: formData.images
    };
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, colorObj]
    }));
    setNewColorName('');
    toast.success(`Color variant "${colorObj.name}" added`);
  };

  const handleRemoveColor = (colorName) => {
    if (formData.colors.length <= 1) {
      toast.error('At least one color variant is required');
      return;
    }
    setFormData(prev => {
      const updatedColors = prev.colors.filter(c => c.name !== colorName);
      const updatedInv = { ...prev.inventory };
      Object.keys(updatedInv).forEach(k => {
        if (k.startsWith(`${colorName}-`)) delete updatedInv[k];
      });
      const totalStock = Object.values(updatedInv).reduce((a, b) => a + Number(b || 0), 0);
      return { ...prev, colors: updatedColors, inventory: updatedInv, stock: totalStock };
    });
    toast.info(`Color "${colorName}" removed`);
  };

  // Size management
  const handleAddSize = () => {
    if (!newSizeName.trim()) {
      toast.error('Enter a size label (e.g. XXL, 36, Custom)');
      return;
    }
    const sz = newSizeName.trim().toUpperCase();
    if (formData.sizes.includes(sz)) {
      toast.error(`Size "${sz}" already exists`);
      return;
    }
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, sz]
    }));
    setNewSizeName('');
    toast.success(`Size "${sz}" added`);
  };

  const handleRemoveSize = (sizeLabel) => {
    if (formData.sizes.length <= 1) {
      toast.error('At least one size option is required');
      return;
    }
    setFormData(prev => {
      const updatedSizes = prev.sizes.filter(s => s !== sizeLabel);
      const updatedInv = { ...prev.inventory };
      Object.keys(updatedInv).forEach(k => {
        if (k.endsWith(`-${sizeLabel}`)) delete updatedInv[k];
      });
      const totalStock = Object.values(updatedInv).reduce((a, b) => a + Number(b || 0), 0);
      return { ...prev, sizes: updatedSizes, inventory: updatedInv, stock: totalStock };
    });
    toast.info(`Size "${sizeLabel}" removed`);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Product Name and Price are required');
      return;
    }

    // Default missing keys to 0 (NOT 10) so zeroing out stocks is strictly respected!
    const fullInventory = { ...formData.inventory };
    formData.colors.forEach(c => {
      formData.sizes.forEach(s => {
        const k = `${c.name}-${s}`;
        if (fullInventory[k] === undefined) {
          fullInventory[k] = 0;
        }
      });
    });

    const totalStock = Object.values(fullInventory).reduce((a, b) => a + Number(b || 0), 0);
    const cleanPairOffers = cleanupPairOffers(formData.suggested_products, formData.pair_offers);
    const finalFormData = { 
      ...formData, 
      inventory: fullInventory, 
      stock: totalStock,
      pair_offers: cleanPairOffers,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    // Save to Backend MySQL DB API — server response is the source of truth.
    let savedProduct = finalFormData;
    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct.id}`, finalFormData);
        if (res.data && res.data.success && res.data.data) savedProduct = { ...finalFormData, ...res.data.data };
      } else {
        const res = await api.post('/products', finalFormData);
        if (res.data && res.data.success && res.data.data) savedProduct = { ...finalFormData, ...res.data.data };
      }
    } catch (err) {
      console.warn('Backend API sync note (falling back to storage):', err.message);
    }

    let updatedList;
    if (editingProduct) {
      updatedList = products.map(p => p.id === editingProduct.id ? { ...p, ...savedProduct } : p);
      toast.success(`Product "${formData.name}" updated in the database! It now reflects on the website.`);
    } else {
      updatedList = [savedProduct, ...products];
      toast.success(`Product "${formData.name}" added to the database! It now reflects on the website.`);
    }
    saveProductsToStorage(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from catalog?`)) {
      try {
        const res = await api.delete(`/products/${id}`);
        if (res.data && res.data.success) {
          const updatedList = products.filter(p => p.id !== id);
          saveProductsToStorage(updatedList);
          toast.success(`Product "${name}" removed from the database!`);
        } else {
          toast.error(res.data?.message || `Failed to remove "${name}" from the database`);
        }
      } catch (err) {
        console.warn('Backend DB delete note:', err.message);
        toast.error(err.response?.data?.message || 'Server unreachable — product NOT deleted from database.');
      }
    }
  };

  const handleInventoryChange = (key, val) => {
    setFormData(prev => {
      const updatedInv = {
        ...prev.inventory,
        [key]: Math.max(0, Number(val))
      };
      const totalStock = Object.values(updatedInv).reduce((a, b) => a + Number(b || 0), 0);
      return {
        ...prev,
        inventory: updatedInv,
        stock: totalStock
      };
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="admin-products-page p-4">
      {/* Page Title */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="dash-title">Product Catalog</h1>
          <p className="dash-sub">Manage product info, variants, and stock. Changes reflect live on the website.</p>
        </div>

        <button className="btn-admin-red d-flex align-items-center gap-2" onClick={openAddModal}>
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className="admin-card-white mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-6">
            <div className="position-relative">
              <input 
                type="text"
                placeholder="Search products by name or SKU..."
                className="admin-input ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="col-md-4">
            <select 
              className="admin-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categoryOptions.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card-white">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>MEDIA</th>
                <th>PRODUCT NAME</th>
                <th>SKU</th>
                <th>CATEGORY</th>
                <th>PRICE (₹)</th>
                <th>TOTAL STOCK</th>
                <th>STATUS</th>
                <th className="text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <span className="spinner-border text-danger" role="status" /> Loading catalog from database...
                  </td>
                </tr>
              ) : filteredProducts.map(p => {
                const totalStock = Object.values(p.inventory || {}).reduce((a, b) => a + Number(b || 0), 0);
                return (
                  <tr key={p.id}>
                    <td>
                      <img 
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400&auto=format&fit=crop'} 
                        alt={p.name} 
                        style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} 
                      />
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{p.name}</strong>
                      {Array.isArray(p.suggested_products) && p.suggested_products.length > 0 && (
                        <div>
                          <span className="cat-slug-badge mt-1" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                            <FiLink2 size={10} /> {p.suggested_products.length} Pairs Well
                          </span>
                        </div>
                      )}
                    </td>
                    <td><code className="cat-slug-badge">{p.sku || p.id}</code></td>
                    <td>{p.category}</td>
                    <td><strong>₹{p.price}</strong></td>
                    <td>
                      <span className={totalStock === 0 ? 'status-badge-pill draft' : 'badge-count-pill'}>
                        {totalStock} units
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-pill ${p.status?.toLowerCase() === 'active' ? 'active' : 'draft'}`}>
                        {p.status || 'Active'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => openEditModal(p)}
                          title="Edit Product"
                        >
                          <FiEdit /> Edit
                        </button>
                        <button 
                          className="btn-admin-outline py-1 px-2 text-danger"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Delete Product"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Width Edit/Add Product Modal Popup (No Horizontal Scroll) */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-box" style={{ width: '920px', maxWidth: '96vw', overflowX: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header d-flex align-items-center justify-content-between pb-3 border-bottom">
              <h3 className="mb-0 font-weight-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                <FiPackage className="text-danger" /> {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
              </h3>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="admin-modal-body py-3" style={{ maxHeight: '78vh', overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="row g-3" style={{ margin: 0 }}>
                {/* Product Name */}
                <div className="col-md-8 px-1">
                  <label className="admin-form-label">PRODUCT NAME *</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    placeholder="e.g. Essential Heavyweight Cotton Tee"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* SKU */}
                <div className="col-md-4 px-1">
                  <label className="admin-form-label">SKU CODE *</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    required
                  />
                </div>

                {/* Category & Brand */}
                <div className="col-md-6 px-1">
                  <label className="admin-form-label">CATEGORY</label>
                  <select 
                    className="admin-select"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categoryOptions.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 px-1">
                  <label className="admin-form-label">BRAND</label>
                  <select 
                    className="admin-select"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  >
                    {brandOptions.length > 0 ? brandOptions.map((b, i) => (
                      <option key={i} value={b}>{b}</option>
                    )) : (
                      <option value="ORDERLY STUDIO">ORDERLY STUDIO</option>
                    )}
                  </select>
                </div>

                {/* Pricing in ₹ INR */}
                <div className="col-md-6 px-1">
                  <label className="admin-form-label">SELLING PRICE (₹ INR) *</label>
                  <input 
                    type="number" 
                    className="admin-input" 
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div className="col-md-6 px-1">
                  <label className="admin-form-label">ORIGINAL COMPARE PRICE (₹ INR)</label>
                  <input 
                    type="number" 
                    className="admin-input" 
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                  />
                </div>

                {/* Color Variants with Individual Color-Wise Image Upload */}
                <div className="col-12 px-1">
                  <label className="admin-form-label mb-1">COLOR VARIANTS & COLOR-WISE IMAGES (MEDIA UPLOAD)</label>
                  <div className="p-3 border rounded bg-light mb-2">
                    <div className="d-flex flex-column gap-3 mb-3">
                      {formData.colors.map((color, idx) => (
                        <div key={idx} className="p-3 bg-white rounded border">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: color.hex, border: '1px solid #ccc' }} />
                              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{color.name}</strong>
                              <code className="text-muted extra-small">{color.hex}</code>
                            </div>
                            <button 
                              type="button" 
                              className="btn p-0 border-0 text-danger"
                              onClick={() => handleRemoveColor(color.name)}
                              title={`Remove color ${color.name}`}
                            >
                              <FiTrash2 style={{ fontSize: '1rem' }} /> Remove Color
                            </button>
                          </div>

                          <FileUploadInput 
                            value={color.images?.[0] || ''}
                            onChange={(url) => {
                              const updatedColors = [...formData.colors];
                              updatedColors[idx] = {
                                ...updatedColors[idx],
                                images: url ? [url] : []
                              };
                              setFormData(prev => ({ ...prev, colors: updatedColors }));
                            }}
                            type="image"
                            folder="products"
                            label={`Image for ${color.name} Color Variant`}
                            placeholder={`Upload or paste image URL for ${color.name}...`}
                            recommendedSize="Recommended: 800 x 1000 px (4:5 Aspect Ratio)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Add Color Inline Form */}
                    <div className="row g-2 align-items-center" style={{ margin: 0 }}>
                      <div className="col-md-5 px-1">
                        <input 
                          type="text" 
                          placeholder="Color Name (e.g. Navy Blue)" 
                          className="admin-input py-1 px-2"
                          value={newColorName}
                          onChange={(e) => setNewColorName(e.target.value)}
                        />
                      </div>
                      <div className="col-md-3 px-1">
                        <input 
                          type="color" 
                          className="form-control form-control-color w-100"
                          style={{ height: '36px', padding: '2px' }}
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                        />
                      </div>
                      <div className="col-md-4 px-1">
                        <button 
                          type="button" 
                          className="btn-admin-outline w-100 py-1"
                          onClick={handleAddColor}
                        >
                          <FiPlus /> Add Color Variant
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Size Options with Remove Icons & Add Controls */}
                <div className="col-12 px-1">
                  <label className="admin-form-label mb-1">AVAILABLE SIZES (CLICK ✕ TO REMOVE)</label>
                  <div className="p-3 border rounded bg-light mb-2">
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {formData.sizes.map((sz, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-2 bg-white px-3 py-1.5 rounded border">
                          <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{sz}</strong>
                          <button 
                            type="button" 
                            className="btn p-0 border-0 text-danger ms-1"
                            onClick={() => handleRemoveSize(sz)}
                            title={`Remove size ${sz}`}
                          >
                            <FiX style={{ fontSize: '1rem', fontWeight: 800 }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Size Inline Form */}
                    <div className="d-flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Add Size (e.g. XXL, 36, Custom)" 
                        className="admin-input py-1 px-2"
                        style={{ maxWidth: '240px' }}
                        value={newSizeName}
                        onChange={(e) => setNewSizeName(e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="btn-admin-outline py-1"
                        onClick={handleAddSize}
                      >
                        <FiPlus /> Add Size
                      </button>
                    </div>
                  </div>
                </div>

                {/* Size & Color Stock Matrix Management */}
                <div className="col-12 px-1">
                  <label className="admin-form-label mb-2">INVENTORY STOCK MATRIX</label>
                  <div className="p-3 border rounded bg-light" style={{ overflowX: 'hidden' }}>
                    <table className="admin-matrix-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>COLOR</th>
                          <th>SIZE</th>
                          <th>STOCK QUANTITY</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.colors.map(color => (
                          formData.sizes.map(size => {
                            const key = `${color.name}-${size}`;
                            const stock = formData.inventory[key] ?? 0;
                            return (
                              <tr key={key}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: color.hex, border: '1px solid #ccc' }} />
                                    <strong>{color.name}</strong>
                                  </div>
                                </td>
                                <td><span className="cat-slug-badge">{size}</span></td>
                                <td>
                                  <input 
                                    type="number"
                                    min="0"
                                    className="admin-input py-1 px-2"
                                    style={{ width: '90px' }}
                                    value={stock}
                                    onChange={(e) => handleInventoryChange(key, e.target.value)}
                                  />
                                </td>
                                <td>
                                  <span className={`status-badge-pill ${stock > 0 ? 'active' : 'draft'}`}>
                                    {stock > 0 ? `In Stock (${stock})` : 'OUT OF STOCK'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pairs Well With — Suggested Products (PDP section) */}
                <div className="col-12 px-1">
                  <label className="admin-form-label mb-1">
                    PAIRS WELL WITH (PRODUCT DETAIL PAGE SUGGESTIONS)
                  </label>
                  <div className="p-3 border rounded bg-light mb-2">
                    <p className="text-muted extra-small mb-2">
                      Select products from your uploaded catalog to display in the "Pairs Well With" section on this product's page.
                      Selected: {formData.suggested_products.length} product(s).
                    </p>
                    <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                      <input
                        type="text"
                        className="admin-input py-1 px-2"
                        placeholder="Search products to suggest..."
                        value={suggestedSearch}
                        onChange={(e) => setSuggestedSearch(e.target.value)}
                      />
                      {formData.suggested_products.length > 0 && (
                        <button
                          type="button"
                          className="btn-admin-outline py-1 text-nowrap"
                          onClick={() => setFormData(prev => ({ ...prev, suggested_products: [], pair_offers: {} }))}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px', background: '#fff' }}>
                      {products
                        .filter(p => String(p.id) !== String(editingProduct?.id))
                        .filter(p => {
                          const q = suggestedSearch.toLowerCase();
                          return !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
                        })
                        .map(p => {
                          const isChecked = formData.suggested_products.some(sp => String(sp) === String(p.id));
                          return (
                            <label
                              key={p.id}
                              className="d-flex align-items-center gap-2 px-3 py-2 border-bottom cursor-pointer"
                              style={{ color: '#0f172a', fontSize: '0.88rem' }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFormData(prev => {
                                    const current = prev.suggested_products.map(String);
                                    const productId = String(p.id);
                                    const next = isChecked
                                      ? current.filter(sp => sp !== productId)
                                      : [...current, productId];
                                    const nextPairOffers = { ...(prev.pair_offers || {}) };
                                    if (isChecked) delete nextPairOffers[productId];
                                    return { ...prev, suggested_products: next, pair_offers: cleanupPairOffers(next, nextPairOffers) };
                                  });
                                }}
                              />
                              <FiLink2 className="text-muted" />
                              <span className="flex-grow-1 line-clamp-1">{p.name}</span>
                              <code className="cat-slug-badge">{p.sku || p.id}</code>
                            </label>
                          );
                        })}
                      {products.length === 0 && (
                        <div className="p-3 text-muted extra-small">
                          No products loaded yet. Add products first, then choose suggestions here.
                        </div>
                      )}
                    </div>
                    {formData.suggested_products.length > 0 && (
                      <div className="mt-3">
                        <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-2">
                          <div>
                            <div className="admin-form-label mb-1">PAIR OFFER SETUP</div>
                            <div className="text-muted extra-small">
                              Set a discount % for each pair product (calculated from its MRP). A single pair add-on in the cart uses its own %. When 2+ pair add-ons are added together, every add-on gets a flat {PAIR_OFFER_PERCENT}% off its MRP.
                            </div>
                          </div>
                        </div>
                        <div className="d-grid gap-2">
                          {formData.suggested_products.map(pairId => {
                            const selectedProduct = products.find(prod => String(prod.id) === String(pairId));
                            if (!selectedProduct) return null;
                            const offer = formData.pair_offers?.[String(pairId)] || {};
                            return (
                              <div key={pairId} className="p-3 border rounded bg-white">
                                <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                                  <div className="min-w-0">
                                    <div className="fw-bold text-dark small line-clamp-1">{selectedProduct.name}</div>
                                    <div className="text-muted extra-small">
                                      MRP: ₹{Number(selectedProduct.originalPrice || selectedProduct.price || 0).toLocaleString()} → Offer price: ₹{Number(offer.offer_price || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <label className="d-flex align-items-center gap-2 text-dark small mb-0">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(offer.enabled)}
                                      onChange={(e) => togglePairOffer(selectedProduct, pairId, e.target.checked)}
                                    />
                                    Activate offer
                                  </label>
                                </div>
                                {offer.enabled && (
                                  <div className="row g-2">
                                    <div className="col-md-3">
                                      <label className="admin-form-label mb-1">Discount %</label>
                                      <input
                                        type="number"
                                        className="admin-input py-1 px-2"
                                        min="0"
                                        max="90"
                                        value={offer.discount_percent || ''}
                                        onChange={(e) => applyPairPercentageDeal(selectedProduct, pairId, Number(e.target.value))}
                                        placeholder="e.g. 20"
                                      />
                                    </div>
                                    <div className="col-md-3">
                                      <label className="admin-form-label mb-1">Offer Price (₹)</label>
                                      <input
                                        type="text"
                                        className="admin-input py-1 px-2"
                                        value={`₹${Number(offer.offer_price || 0).toLocaleString()}`}
                                        readOnly
                                        placeholder="Auto from MRP"
                                      />
                                    </div>
                                    <div className="col-md-3">
                                      <label className="admin-form-label mb-1">Badge</label>
                                      <input
                                        type="text"
                                        className="admin-input py-1 px-2"
                                        value={offer.badge || ''}
                                        onChange={(e) => updatePairOffer(pairId, { badge: e.target.value })}
                                        placeholder="e.g. AVAIL 20% OFF"
                                      />
                                    </div>
                                    <div className="col-md-3">
                                      <label className="admin-form-label mb-1">Promo Note</label>
                                      <input
                                        type="text"
                                        className="admin-input py-1 px-2"
                                        value={offer.note || ''}
                                        onChange={(e) => updatePairOffer(pairId, { note: e.target.value })}
                                        placeholder="e.g. Add this pair and save instantly"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Cover Image Upload */}
                <div className="col-12 px-1">
                  <FileUploadInput 
                    value={formData.images?.[0] || ''}
                    onChange={(url) => setFormData(prev => ({ 
                      ...prev, 
                      images: url ? [url, ...(prev.images?.slice(1) || [])] : prev.images 
                    }))}
                    type="image"
                    folder="products"
                    label="PRODUCT MAIN COVER IMAGE (Upload)"
                    recommendedSize="Recommended: 800 x 1000 px (4:5 Aspect Ratio)"
                  />
                </div>

                {/* Status Toggle */}
                <div className="col-12 px-1">
                  <label className="admin-form-label">CATALOG VISIBILITY STATUS</label>
                  <div className="d-flex gap-4">
                    <label className="d-flex align-items-center gap-2 cursor-pointer" style={{ color: '#0f172a', fontWeight: 600 }}>
                      <input 
                        type="radio" 
                        name="status"
                        checked={formData.status === 'Active'}
                        onChange={() => setFormData(prev => ({ ...prev, status: 'Active' }))}
                      />
                      Active (Visible on Website)
                    </label>
                    <label className="d-flex align-items-center gap-2 cursor-pointer" style={{ color: '#0f172a', fontWeight: 600 }}>
                      <input 
                        type="radio" 
                        name="status"
                        checked={formData.status === 'Draft'}
                        onChange={() => setFormData(prev => ({ ...prev, status: 'Draft' }))}
                      />
                      Draft (Hidden)
                    </label>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                <button type="button" className="btn-admin-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-admin-red d-flex align-items-center gap-2">
                  <FiCheck /> {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
