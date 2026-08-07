import React, { useState, useEffect } from 'react';
import { FiGrid, FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiEyeOff, FiCheck, FiX, FiLayers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import FileUploadInput from '../../components/common/FileUploadInput';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const emptyForm = { name: '', slug: '', subtitle: '', image: '', display_order: 0 };

const Occasions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const notifySync = (eventName) => {
    try {
      localStorage.setItem(eventName, String(Date.now()));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent(eventName));
  };

  const loadOccasions = () => {
    setLoading(true);
    api.get('/occasions')
      .then(res => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setData(res.data.data);
        }
      })
      .catch(() => toast.error('Failed to load occasions from server'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOccasions();
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setFormData({ ...emptyForm, display_order: data.length + 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditing(item);
    setFormData({
      name: item.name || '',
      slug: item.slug || '',
      subtitle: item.subtitle || '',
      image: item.image || '',
      display_order: item.display_order || 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Occasion name is required');
      return;
    }
    const payload = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    try {
      if (editing) {
        const res = await api.put(`/occasions/${editing.id}`, payload);
        if (res.data && res.data.success) {
          setData(prev => prev.map(o => o.id === editing.id ? { ...o, ...res.data.data } : o));
          toast.success(`Occasion "${formData.name}" updated!`);
        }
      } else {
        const res = await api.post('/occasions', payload);
        if (res.data && res.data.success) {
          setData(prev => [...prev, res.data.data]);
          toast.success(`Occasion "${formData.name}" created!`);
        }
      }
      notifySync('orderly_occasions_updated');
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save occasion');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Delete occasion "${item.name}"?`)) {
      try {
        const res = await api.delete(`/occasions/${item.id}`);
        if (res.data && res.data.success) {
          setData(prev => prev.filter(o => o.id !== item.id));
          toast.success('Occasion removed');
          notifySync('orderly_occasions_updated');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete occasion');
      }
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await api.put(`/occasions/${item.id}`, { is_active: !item.is_active });
      if (res.data && res.data.success) {
        setData(prev => prev.map(o => o.id === item.id ? { ...o, ...res.data.data } : o));
        toast.success('Occasion visibility status updated');
        notifySync('orderly_occasions_updated');
      }
    } catch (err) {
      toast.error('Failed to update occasion status');
    }
  };

  const filteredData = data.filter(item => {
    const q = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="occasions-page p-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="admin-page-title d-flex align-items-center gap-2" style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.5rem' }}>
            <FiGrid className="text-danger" /> Shop By Occasion Manager
          </h1>
          <p className="text-muted mb-0 small">Create and manage curated occasion banners displayed live on the storefront homepage.</p>
        </div>
        <button type="button" className="btn-admin-red" onClick={openAddModal}>
          <FiPlus /> Add New Occasion
        </button>
      </div>

      {/* Toolbar Filter */}
      <div className="admin-card-white mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <input 
                type="text"
                placeholder="Search occasions by title, subtitle, or slug..."
                className="admin-input ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-card-white">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>BANNER</th>
                <th>OCCASION TITLE</th>
                <th>SUBTITLE / TAGLINE</th>
                <th>SLUG</th>
                <th>ORDER</th>
                <th>STATUS</th>
                <th className="text-end pe-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <span className="spinner-border text-danger me-2" role="status" /> Loading occasion catalog...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map(item => (
                  <tr key={item.id}>
                    <td>
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=200&auto=format&fit=crop'} 
                        alt={item.name} 
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td><strong className="text-dark">{item.name}</strong></td>
                    <td><span className="badge bg-danger text-white px-2 py-1 rounded-pill small">{item.subtitle || 'Shop Occasion'}</span></td>
                    <td><code className="cat-slug-badge">{item.slug}</code></td>
                    <td><span className="fw-bold text-muted">#{item.display_order || 1}</span></td>
                    <td>
                      <StatusBadge status={item.is_active !== false ? 'active' : 'inactive'} />
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => handleToggle(item)}
                          title="Toggle Status"
                        >
                          {item.is_active !== false ? <FiEyeOff /> : <FiEye />}
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => openEditModal(item)}
                        >
                          <FiEdit /> Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2 text-danger"
                          onClick={() => handleDelete(item)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No occasions found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Occasion */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Occasion' : 'Add New Occasion'}>
        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Occasion Title *</label>
              <input
                type="text"
                className="admin-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Royal Wedding Collection"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="admin-form-label">URL Slug</label>
              <input
                type="text"
                className="admin-input"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="Auto-generated from title"
              />
            </div>
            <div className="col-md-8">
              <label className="admin-form-label">Subtitle / Badge Tagline</label>
              <input
                type="text"
                className="admin-input"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="e.g. LUXURY TAILORING FOR THE BIG DAY"
              />
            </div>
            <div className="col-md-4">
              <label className="admin-form-label">Display Order</label>
              <input
                type="number"
                className="admin-input"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="col-12">
              <FileUploadInput
                value={formData.image}
                onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                type="image"
                folder="occasions"
                label="Occasion Banner Cover Image (Cloudflare R2 Upload)"
                placeholder="Upload or paste banner image URL..."
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">
              <FiCheck /> {editing ? 'Save Occasion Changes' : 'Publish Occasion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Occasions;