import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const emptyForm = { name: '', slug: '', logo_text: '' };

const Brands = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadBrands = () => {
    setLoading(true);
    api.get('/brands')
      .then(res => {
        if (res.data.success) setData(res.data.data || []);
      })
      .catch(err => toast.error('Failed to load brands'))
      .finally(() => setLoading(false));
  };

  // Cross-tab sync signal so the live website refreshes immediately.
  const notifySync = (eventName) => {
    try {
      localStorage.setItem(eventName, String(Date.now()));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent(eventName));
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditing(item);
    setFormData({ name: item.name || '', slug: item.slug || '', logo_text: item.logo_text || '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Brand name is required');
      return;
    }
    const payload = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    try {
      if (editing) {
        const res = await api.put(`/brands/${editing.id}`, payload);
        if (res.data.success) {
          setData(prev => prev.map(b => b.id === editing.id ? { ...b, ...res.data.data } : b));
          toast.success('Brand updated in database!');
        }
      } else {
        const res = await api.post('/brands', payload);
        if (res.data.success) {
          setData(prev => [...prev, res.data.data]);
          toast.success('Brand added to database!');
        }
      }
      notifySync('orderly_brands_updated');
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save brand');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Delete brand "${item.name}"?`)) {
      try {
        const res = await api.delete(`/brands/${item.id}`);
        if (res.data.success) {
          setData(prev => prev.filter(b => b.id !== item.id));
          toast.success('Brand deleted');
          notifySync('orderly_brands_updated');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete brand');
      }
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await api.put(`/brands/${item.id}`, { is_active: !item.is_active });
      if (res.data.success) {
        setData(prev => prev.map(b => b.id === item.id ? { ...b, ...res.data.data } : b));
        toast.success('Brand status updated');
        notifySync('orderly_brands_updated');
      }
    } catch (err) {
      toast.error('Failed to update brand status');
    }
  };

  const columns = [
    { key: 'name', label: 'House Name' },
    { key: 'logo_text', label: 'Badge Logo Text' },
    { key: 'is_active', label: 'Status', render: (val) => <StatusBadge status={val ? 'active' : 'inactive'} /> }
  ];

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white font-weight-bold mb-0">Brand Houses</h2>
        <button className="btn-primary" onClick={openAddModal}>+ Add Brand</button>
      </div>
      <div className="admin-card p-4 rounded-3">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          keyField="id"
          onEdit={openEditModal}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Brand' : 'Add Brand'}>
        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="admin-form-label">Brand Name *</label>
              <input
                type="text"
                className="admin-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              />
            </div>
            <div className="col-md-6">
              <label className="admin-form-label">Badge Logo Text</label>
              <input
                type="text"
                className="admin-input"
                value={formData.logo_text}
                onChange={(e) => setFormData(prev => ({ ...prev, logo_text: e.target.value }))}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn-admin-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Brand'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Brands;
