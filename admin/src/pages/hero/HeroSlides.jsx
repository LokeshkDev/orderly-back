import React, { useState, useEffect } from 'react';
import { FiImage, FiPlus, FiLayers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import './HeroSlides.css';

const emptyForm = {
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  badge_text: '',
  cta_primary_text: 'Discover ORDERLY',
  cta_primary_link: '/shop',
  cta_secondary_text: 'Explore Shirts',
  cta_secondary_link: '/shop?category=Shirts',
  display_order: 1
};

const HeroSlides = () => {
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadData = async () => {
    setLoadingSlides(true);
    try {
      const slidesRes = await api.get('/hero-slides/all');
      if (slidesRes.data && slidesRes.data.success && Array.isArray(slidesRes.data.data)) {
        setSlides(slidesRes.data.data);
      }
    } catch (err) {
      console.warn('CMS load note:', err.message);
    } finally {
      setLoadingSlides(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingSlide(null);
    setFormData({ ...emptyForm, display_order: slides.length + 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingSlide(item);
    setFormData({
      title: item.title || '',
      subtitle: item.subtitle || '',
      description: item.description || '',
      image_url: item.image_url || item.image || '',
      badge_text: item.badge_text || item.badge || '',
      cta_primary_text: item.cta_primary_text || 'Discover ORDERLY',
      cta_primary_link: item.cta_primary_link || '/shop',
      cta_secondary_text: item.cta_secondary_text || 'Explore Shirts',
      cta_secondary_link: item.cta_secondary_link || '/shop?category=Shirts',
      display_order: item.display_order || slides.length + 1
    });
    setIsModalOpen(true);
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.error('Slide image URL is required');
      return;
    }
    try {
      if (editingSlide) {
        const res = await api.put(`/hero-slides/${editingSlide.id}`, formData);
        if (res.data && res.data.success) {
          toast.success('Hero slide updated successfully!');
          notifyStoreUpdated();
          loadData();
        }
      } else {
        const res = await api.post('/hero-slides', formData);
        if (res.data && res.data.success) {
          toast.success('New hero slide added!');
          notifyStoreUpdated();
          loadData();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hero slide');
    }
  };

  const handleDeleteSlide = async (item) => {
    if (window.confirm(`Are you sure you want to delete slide "${item.title}"?`)) {
      try {
        const res = await api.delete(`/hero-slides/${item.id}`);
        if (res.data && res.data.success) {
          toast.success('Hero slide deleted');
          notifyStoreUpdated();
          loadData();
        }
      } catch (err) {
        toast.error('Failed to delete hero slide');
      }
    }
  };

  const handleToggleSlide = async (item) => {
    try {
      const res = await api.patch(`/hero-slides/${item.id}/toggle`);
      if (res.data && res.data.success) {
        toast.success('Slide status updated');
        notifyStoreUpdated();
        loadData();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const notifyStoreUpdated = () => {
    window.dispatchEvent(new CustomEvent('orderly_hero_slides_updated'));
    try {
      localStorage.setItem('orderly_hero_slides_updated', String(Date.now()));
    } catch (err) {}
  };

  const slideColumns = [
    { 
      key: 'image_url', 
      label: 'SLIDE IMAGE', 
      render: (val, row) => (
        <img 
          src={val || row.image || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400&auto=format&fit=crop'} 
          alt="slide" 
          className="slide-thumb"
        />
      ) 
    },
    { 
      key: 'badge_text', 
      label: 'BADGE TAG',
      render: (val) => val ? <span className="status-badge-pill draft">{val}</span> : '-' 
    },
    { 
      key: 'title', 
      label: 'SLIDE TITLE',
      render: (val) => <strong className="text-dark">{val}</strong> 
    },
    { key: 'subtitle', label: 'SUBTITLE' },
    { key: 'display_order', label: 'ORDER' },
    { 
      key: 'is_active', 
      label: 'STATUS', 
      render: (val) => <StatusBadge status={val !== false ? 'active' : 'inactive'} /> 
    }
  ];

  return (
    <div className="hero-slides-page p-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="admin-page-title d-flex align-items-center gap-2">
            <FiImage className="text-danger" /> Hero Banner Carousel Management
          </h1>
          <p className="text-muted mb-0">Manage hero carousel banner slides, titles, and call-to-action buttons.</p>
        </div>
        <button className="btn-admin-red" onClick={openAddModal}>
          <FiPlus /> Add New Slide
        </button>
      </div>

      <div className="cms-card">
        <DataTable
          columns={slideColumns}
          data={slides}
          loading={loadingSlides}
          keyField="id"
          onEdit={openEditModal}
          onDelete={handleDeleteSlide}
          onToggle={handleToggleSlide}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
      >
        <form onSubmit={handleSaveSlide}>
          <div className="row g-3">
            <div className="col-12">
              <label className="admin-form-label">Slide Image URL *</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                required
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Badge Tag</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.badge_text}
                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                placeholder="e.g. LUXURY COLLECTION"
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Display Order</label>
              <input 
                type="number" 
                className="admin-input"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Slide Title</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. ROYAL ITALIAN LINEN SHIRTS"
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Subtitle</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Handcrafted in Milan"
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Description</label>
              <textarea 
                className="admin-textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Primary CTA Label</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.cta_primary_text}
                onChange={(e) => setFormData({ ...formData, cta_primary_text: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Primary CTA Link</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.cta_primary_link}
                onChange={(e) => setFormData({ ...formData, cta_primary_link: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Secondary CTA Label</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.cta_secondary_text}
                onChange={(e) => setFormData({ ...formData, cta_secondary_text: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Secondary CTA Link</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.cta_secondary_link}
                onChange={(e) => setFormData({ ...formData, cta_secondary_link: e.target.value })}
              />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-4">
              <button 
                type="button" 
                className="btn-admin-outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-admin-red">
                {editingSlide ? 'Update Slide' : 'Add Slide'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HeroSlides;