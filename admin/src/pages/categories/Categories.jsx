import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiX, FiCheck, FiFolder, FiLayers, FiTag } from 'react-icons/fi';
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

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    description: '',
    type: 'product',
    display_order: 1,
    is_active: true
  });

  const openAddModal = () => {
    setEditingCategory(null);
    const tabCategories = categories.filter(c => (c.type || 'product') === activeTab);
    setFormData({
      name: '',
      slug: '',
      image: '',
      description: '',
      type: activeTab,
      display_order: tabCategories.length + 1,
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
        type: formData.type || activeTab
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

  const filteredCategories = currentTabCategories.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productCatCount = categories.filter(c => (c.type || 'product') === 'product').length;
  const comboCatCount = categories.filter(c => c.type === 'combo').length;

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
          <span className="cat-tab-counter">{productCatCount}</span>
        </button>

        <button
          type="button"
          className={`cat-tab-btn ${activeTab === 'combo' ? 'active' : ''}`}
          onClick={() => setActiveTab('combo')}
        >
          <FiLayers />
          <span>Combo Categories</span>
          <span className="cat-tab-counter">{comboCatCount}</span>
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
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }} className="text-muted">
                    No {activeTab === 'product' ? 'apparel' : 'combo'} categories found. Click "{activeTab === 'product' ? 'Add Category' : 'Add Combo Category'}" to create one.
                  </td>
                </tr>
              ) : filteredCategories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    ) : (
                      <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                        N/A
                      </div>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{cat.name}</strong>
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
              ))}
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