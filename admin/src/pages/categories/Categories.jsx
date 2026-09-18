import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiSearch, FiEdit, FiTrash2, FiX, FiCheck, 
  FiFolder, FiLayers, FiTag, FiChevronDown, FiChevronRight 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import FileUploadInput from '../../components/common/FileUploadInput';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('product'); // 'product' or 'combo'

  // Load all categories from the MySQL DB — the DB is the single source of truth.
  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn('Failed to load categories from DB:', err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedParentIds, setExpandedParentIds] = useState([]);

  const toggleExpandParent = (parentId) => {
    setExpandedParentIds(prev => 
      prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]
    );
  };

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    description: '',
    type: 'product',
    parent_id: '',
    display_order: 1,
    is_active: true
  });

  const openAddModal = () => {
    setEditingCategory(null);
    const tabCategories = categories.filter(c => (c.type || 'product') === activeTab && !c.parent_id);
    setFormData({
      name: '',
      slug: '',
      image: '',
      description: '',
      type: activeTab,
      parent_id: '',
      display_order: tabCategories.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openAddSubModal = (parentCat) => {
    setEditingCategory(null);
    const subCats = categories.filter(c => Number(c.parent_id) === Number(parentCat.id));
    setFormData({
      name: '',
      slug: '',
      image: parentCat.image || '',
      description: '',
      type: parentCat.type || activeTab,
      parent_id: parentCat.id,
      display_order: subCats.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      image: cat.image || '',
      description: cat.description || '',
      type: cat.type || 'product',
      parent_id: cat.parent_id || '',
      display_order: cat.display_order || 1,
      is_active: cat.is_active ?? true
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, name: val, slug: autoSlug }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      const payload = {
        ...formData,
        type: formData.type || activeTab,
        parent_id: formData.parent_id ? Number(formData.parent_id) : null
      };

      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory.id}`, payload);
        const saved = res.data && res.data.success ? res.data.data : payload;
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...saved } : c));
        toast.success(`Category "${formData.name}" updated in the database!`);
      } else {
        const res = await api.post('/categories', payload);
        const saved = res.data && res.data.success ? res.data.data : { id: Date.now(), ...payload, product_count: 0 };
        setCategories(prev => [...prev, saved]);
        toast.success(`Category "${formData.name}" created in the database!`);
      }
      window.dispatchEvent(new CustomEvent('orderly_categories_updated'));
      setIsModalOpen(false);
    } catch (err) {
      console.warn('Category save warning:', err.message);
      toast.error('Failed to save category. Please try again.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      window.dispatchEvent(new CustomEvent('orderly_categories_updated'));
      toast.success(`Category "${name}" removed!`);
    } catch (err) {
      console.warn('Category delete warning:', err.message);
      toast.error('Failed to delete category. Please try again.');
      loadCategories();
    }
  };

  const currentTabCategories = categories.filter(c => {
    const cType = c.type || 'product';
    return cType === activeTab;
  });

  const topLevelCategories = currentTabCategories.filter(c => !c.parent_id);
  const getSubcategories = (parentId) => currentTabCategories.filter(c => Number(c.parent_id) === Number(parentId));

  const filteredParents = topLevelCategories.filter(cat => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    const selfMatch = (cat.name || '').toLowerCase().includes(s) || (cat.slug || '').toLowerCase().includes(s);
    if (selfMatch) return true;
    const subs = getSubcategories(cat.id);
    return subs.some(sub => (sub.name || '').toLowerCase().includes(s) || (sub.slug || '').toLowerCase().includes(s));
  });

  const productTopCount = categories.filter(c => (c.type || 'product') === 'product' && !c.parent_id).length;
  const comboTopCount = categories.filter(c => c.type === 'combo' && !c.parent_id).length;
  const productSubCount = categories.filter(c => (c.type || 'product') === 'product' && c.parent_id).length;
  const comboSubCount = categories.filter(c => c.type === 'combo' && c.parent_id).length;

  useEffect(() => {
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase().trim();
      const matchParentIds = topLevelCategories.filter(cat => {
        const subs = getSubcategories(cat.id);
        return subs.some(sub => (sub.name || '').toLowerCase().includes(s) || (sub.slug || '').toLowerCase().includes(s));
      }).map(c => c.id);
      if (matchParentIds.length > 0) {
        setExpandedParentIds(prev => Array.from(new Set([...prev, ...matchParentIds])));
      }
    }
  }, [searchTerm]);

  return (
    <div className="admin-categories-page p-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="dash-title">
            {activeTab === 'product' ? 'Apparel Categories' : 'Combo Categories'}
          </h1>
          <p className="dash-sub">
            {activeTab === 'product' 
              ? 'Organize menswear departments, sub-categories, order, and banners.'
              : 'Organize combo bundle categories (e.g. Formal Combos, Casual Sets, Summer Vacation Outfits).'}
          </p>
        </div>

        <button className="btn-admin-red d-flex align-items-center gap-2" onClick={openAddModal}>
          <FiPlus /> {activeTab === 'product' ? 'Add Category' : 'Add Combo Category'}
        </button>
      </div>

      {/* Dual Tab Navigation */}
      <div className="cat-tabs-container mb-4">
        <button
          type="button"
          className={`cat-tab-btn ${activeTab === 'product' ? 'active' : ''}`}
          onClick={() => setActiveTab('product')}
        >
          <FiFolder />
          <span>Apparel Categories</span>
          <span className="cat-tab-counter">{productTopCount} {productSubCount > 0 ? `(+${productSubCount} subs)` : ''}</span>
        </button>

        <button
          type="button"
          className={`cat-tab-btn ${activeTab === 'combo' ? 'active' : ''}`}
          onClick={() => setActiveTab('combo')}
        >
          <FiLayers />
          <span>Combo Categories</span>
          <span className="cat-tab-counter">{comboTopCount} {comboSubCount > 0 ? `(+${comboSubCount} subs)` : ''}</span>
        </button>
      </div>

      {/* Toolbar Search Filter */}
      <div className="admin-card-white mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-6">
            <div className="position-relative">
              <input
                type="text"
                placeholder={`Search ${activeTab === 'product' ? 'apparel' : 'combo'} categories by name or slug...`}
                className="admin-input ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="admin-card-white">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>MEDIA</th>
                <th>CATEGORY NAME</th>
                <th>SLUG</th>
                <th>{activeTab === 'product' ? 'PRODUCTS' : 'DESCRIPTION / SETS'}</th>
                <th>ORDER</th>
                <th>STATUS</th>
                <th className="text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <span className="spinner-border text-danger" role="status" /> Loading categories from database...
                  </td>
                </tr>
              ) : filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }} className="text-muted">
                    No {activeTab === 'product' ? 'apparel' : 'combo'} categories found. Click "{activeTab === 'product' ? 'Add Category' : 'Add Combo Category'}" to create one.
                  </td>
                </tr>
              ) : filteredParents.map(cat => {
                const subCats = getSubcategories(cat.id);
                const isExpanded = expandedParentIds.includes(cat.id);

                return (
                  <React.Fragment key={cat.id}>
                    <tr style={{ background: isExpanded ? '#f8fafc' : undefined }}>
                      <td>
                        <img
                          src={cat.image || '/logo.png'}
                          alt={cat.name}
                          style={{ width: '42px', height: '42px', objectFit: cat.image ? 'cover' : 'contain', background: '#050505', borderRadius: '6px' }}
                          onError={(e) => { e.target.src = '/logo.png'; }}
                        />
                      </td>
                      <td>
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{cat.name}</strong>
                          <div className="d-flex align-items-center gap-1 mt-1">
                            {subCats.length > 0 ? (
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 extra-small py-0 px-2 fw-bold"
                                style={{ borderRadius: '12px', fontSize: '0.74rem' }}
                                onClick={() => toggleExpandParent(cat.id)}
                                title={isExpanded ? 'Collapse sub-categories' : 'Expand sub-categories'}
                              >
                                {isExpanded ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
                                {subCats.length} sub-categor{subCats.length > 1 ? 'ies' : 'y'}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="btn btn-sm btn-light border text-secondary extra-small py-0 px-2"
                              style={{ borderRadius: '12px', fontSize: '0.72rem' }}
                              onClick={() => openAddSubModal(cat)}
                              title={`Add subcategory under ${cat.name}`}
                            >
                              + Add Sub
                            </button>
                          </div>
                        </div>
                      </td>
                      <td><code className="cat-slug-badge">{cat.slug}</code></td>
                      <td>
                        {activeTab === 'product' ? (
                          <span className="badge-count-pill">{cat.product_count || 0} items</span>
                        ) : (
                          <span className="text-muted extra-small text-truncate d-inline-block" style={{ maxWidth: '280px' }}>
                            {cat.description || 'Curated combo sets collection'}
                          </span>
                        )}
                      </td>
                      <td><strong>#{cat.display_order}</strong></td>
                      <td>
                        <span className={`status-badge-pill ${cat.is_active ? 'active' : 'draft'}`}>
                          {cat.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn-admin-outline py-1 px-2"
                            onClick={() => openEditModal(cat)}
                            title="Edit Category"
                          >
                            <FiEdit /> Edit
                          </button>
                          <button
                            className="btn-admin-outline py-1 px-2 text-danger"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            title="Delete Category"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion Sub-Categories Nested Row */}
                    {isExpanded && (
                      <tr className="category-accordion-detail-row">
                        <td colSpan={7} style={{ background: '#f8fafc', padding: '10px 16px 16px 56px', borderBottom: '2px solid #cbd5e1' }}>
                          <div className="p-3 bg-white rounded border shadow-sm">
                            <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                              <div className="fw-bold small text-dark d-flex align-items-center gap-2">
                                <span className="text-danger fw-bold fs-6">↳</span> Sub-categories of <strong>{cat.name}</strong> ({subCats.length})
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 py-1 px-2 fw-bold"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                onClick={() => openAddSubModal(cat)}
                              >
                                <FiPlus size={12} /> Add Sub-Category under {cat.name}
                              </button>
                            </div>

                            {subCats.length === 0 ? (
                              <div className="text-muted small py-2">
                                No sub-categories created yet under {cat.name}. Click "+ Add Sub-Category" above to create one.
                              </div>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                                  <thead>
                                    <tr className="text-muted" style={{ borderBottom: '1px solid #e2e8f0' }}>
                                      <th style={{ width: '45px' }}>MEDIA</th>
                                      <th>SUB-CATEGORY NAME</th>
                                      <th>SLUG</th>
                                      <th>{activeTab === 'product' ? 'PRODUCTS' : 'DESCRIPTION'}</th>
                                      <th>ORDER</th>
                                      <th>STATUS</th>
                                      <th className="text-end">ACTIONS</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subCats.map(sub => (
                                      <tr key={sub.id}>
                                        <td>
                                          <img
                                            src={sub.image || cat.image || '/logo.png'}
                                            alt={sub.name}
                                            style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', background: '#050505' }}
                                            onError={(e) => { e.target.src = '/logo.png'; }}
                                          />
                                        </td>
                                        <td>
                                          <div className="d-flex align-items-center gap-1">
                                            <span className="text-danger fw-bold">↳</span>
                                            <strong style={{ color: '#1e293b' }}>{sub.name}</strong>
                                          </div>
                                        </td>
                                        <td><code className="cat-slug-badge">{sub.slug}</code></td>
                                        <td>
                                          {activeTab === 'product' ? (
                                            <span className="badge-count-pill">{sub.product_count || 0} items</span>
                                          ) : (
                                            <span className="text-muted extra-small text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                              {sub.description || `Sub-category of ${cat.name}`}
                                            </span>
                                          )}
                                        </td>
                                        <td>#{sub.display_order}</td>
                                        <td>
                                          <span className={`status-badge-pill ${sub.is_active ? 'active' : 'draft'}`}>
                                            {sub.is_active ? 'Active' : 'Draft'}
                                          </span>
                                        </td>
                                        <td className="text-end">
                                          <div className="d-inline-flex gap-2">
                                            <button
                                              className="btn-admin-outline py-1 px-2"
                                              style={{ fontSize: '11px' }}
                                              onClick={() => openEditModal(sub)}
                                              title="Edit Sub-Category"
                                            >
                                              <FiEdit size={12} /> Edit
                                            </button>
                                            <button
                                              className="btn-admin-outline py-1 px-2 text-danger"
                                              style={{ fontSize: '11px' }}
                                              onClick={() => handleDelete(sub.id, sub.name)}
                                              title="Delete Sub-Category"
                                            >
                                              <FiTrash2 size={12} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Category Modal Popup */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header d-flex align-items-center justify-content-between pb-3 border-bottom">
              <h3 className="mb-0 font-weight-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                <FiFolder className="text-danger" /> {editingCategory ? `Edit ${formData.type === 'combo' ? 'Combo' : 'Apparel'} Category` : `Create New ${formData.type === 'combo' ? 'Combo' : 'Apparel'} Category`}
              </h3>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>

            <form onSubmit={handleSave} className="admin-modal-body py-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="admin-form-label">CATEGORY TYPE</label>
                  <div className="d-flex gap-4 mb-2">
                    <label className="d-flex align-items-center gap-2 cursor-pointer fw-bold">
                      <input
                        type="radio"
                        name="cat_type"
                        value="product"
                        checked={formData.type === 'product'}
                        onChange={() => setFormData(prev => ({ ...prev, type: 'product' }))}
                      />
                      Apparel Category (Single Products)
                    </label>
                    <label className="d-flex align-items-center gap-2 cursor-pointer fw-bold">
                      <input
                        type="radio"
                        name="cat_type"
                        value="combo"
                        checked={formData.type === 'combo'}
                        onChange={() => setFormData(prev => ({ ...prev, type: 'combo' }))}
                      />
                      Combo Category (Curated Sets)
                    </label>
                  </div>
                </div>

                <div className="col-12">
                  <label className="admin-form-label">PARENT CATEGORY (Optional)</label>
                  <select
                    className="admin-input"
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  >
                    <option value="">None (Top-Level Main Category)</option>
                    {categories
                      .filter(c => (c.type || 'product') === (formData.type || activeTab) && !c.parent_id && (!editingCategory || c.id !== editingCategory.id))
                      .map(parent => (
                        <option key={parent.id} value={parent.id}>
                          Sub-category of: {parent.name}
                        </option>
                      ))}
                  </select>
                  <span className="text-muted extra-small">
                    Select a parent category to create a sub-category, or leave as "None" for a top-level category.
                  </span>
                </div>

                <div className="col-12">
                  <label className="admin-form-label">CATEGORY NAME *</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder={formData.type === 'combo' ? 'e.g. Executive & Formal Combos, Casual Sets' : 'e.g. Shirts, Oversized Tees, Denim'}
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="admin-form-label">URL SLUG</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. formal-combos"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>

                <div className="col-12">
                  <label className="admin-form-label">DESCRIPTION (Optional)</label>
                  <textarea
                    rows={2}
                    className="admin-input"
                    placeholder="Brief description for category banner and SEO..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="col-12">
                  <FileUploadInput
                    value={formData.image}
                    onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                    type="image"
                    folder="categories"
                    label="CATEGORY BANNER IMAGE (Upload)"
                    recommendedSize="Recommended: 800 x 800 px (1:1 Ratio)"
                  />
                </div>

                <div className="col-md-6">
                  <label className="admin-form-label">DISPLAY ORDER</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) }))}
                  />
                </div>

                <div className="col-md-6">
                  <label className="admin-form-label">VISIBILITY STATUS</label>
                  <div className="d-flex gap-3 mt-2">
                    <label className="d-flex align-items-center gap-2 cursor-pointer" style={{ color: '#0f172a', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="status"
                        checked={formData.is_active === true}
                        onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                      />
                      Active
                    </label>
                    <label className="d-flex align-items-center gap-2 cursor-pointer" style={{ color: '#0f172a', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="status"
                        checked={formData.is_active === false}
                        onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                      />
                      Draft
                    </label>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                <button type="button" className="btn-admin-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-admin-red d-flex align-items-center gap-2">
                  <FiCheck /> {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;