import os

base_dir = "c:/Users/Lokesh/Desktop/E-commerce/orderly/admin/src/pages"
files = {}

combo_template = """import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import './Combos.css';

const {COMPONENT_NAME} = () => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/combos', { params: { type: '{COMBO_TYPE}' } });
      if (res.data.success) {
        setCombos(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load combos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const handleDelete = async () => {
    try {
      const res = await api.delete(`/admin/combos/${deleteModal.id}`);
      if (res.data.success) {
        toast.success('Combo deleted');
        fetchCombos();
      }
    } catch (err) {
      toast.error('Failed to delete combo');
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };

  const columns = [
    { key: 'image', label: 'Image', render: (val) => <img src={val} alt="thumb" className="prod-thumb" /> },
    { key: 'name', label: 'Name' },
    { key: 'packCount', label: 'Pack Count' },
    { key: 'price', label: 'Price (₹)', render: (val) => `₹${val}` },
    { key: 'badge', label: 'Badge' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="action-btns">
        <button className="btn-edit" onClick={() => navigate(`/combos/new?edit=${row._id}`)}>Edit</button>
        <button className="btn-delete" onClick={() => setDeleteModal({ open: true, id: row._id })}>Delete</button>
      </div>
    ) }
  ];

  return (
    <div className="combos-page">
      <div className="page-header">
        <h2>{PAGE_TITLE}</h2>
        <button className="btn-primary" onClick={() => navigate('/combos/new')}>Add Combo</button>
      </div>
      <DataTable columns={columns} data={combos} loading={loading} />
      
      {deleteModal.open && (
        <Modal onClose={() => setDeleteModal({ open: false, id: null })}>
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this combo?</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeleteModal({ open: false, id: null })}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default {COMPONENT_NAME};
"""

files["combos/ShirtCombos.jsx"] = combo_template.replace("{COMPONENT_NAME}", "ShirtCombos").replace("{COMBO_TYPE}", "shirts").replace("{PAGE_TITLE}", "Shirt Combos")
files["combos/PantCombos.jsx"] = combo_template.replace("{COMPONENT_NAME}", "PantCombos").replace("{COMBO_TYPE}", "pants").replace("{PAGE_TITLE}", "Pant Combos")
files["combos/FamilyCombos.jsx"] = combo_template.replace("{COMPONENT_NAME}", "FamilyCombos").replace("{COMBO_TYPE}", "family").replace("{PAGE_TITLE}", "Family Combos")

files["combos/AddCombo.jsx"] = """import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api.js';
import ImageUploader from '../../../components/common/ImageUploader';
import './Combos.css';

const AddCombo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const editId = query.get('edit');

  const [formData, setFormData] = useState({
    comboType: 'shirts', packCount: 2, name: '', brand: '', badgeText: '', price: '', originalPrice: '',
    description: '', images: [], colors: [], sizes: []
  });

  useEffect(() => {
    if (editId) {
      api.get(`/admin/combos/${editId}`).then(res => {
        if (res.data.success) setFormData(res.data.data);
      }).catch(err => toast.error('Failed to load combo'));
    }
  }, [editId]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/combos/${editId}`, formData);
        toast.success('Combo updated');
      } else {
        await api.post('/admin/combos', formData);
        toast.success('Combo created');
      }
      navigate(`/combos/${formData.comboType}`);
    } catch (err) {
      toast.error('Failed to save combo');
    }
  };

  return (
    <div className="add-combo-page" style={{ padding: '1.5rem' }}>
      <h2>{editId ? 'Edit Combo' : 'Add Combo'}</h2>
      <form onSubmit={handleSave} className="form-card" style={{ background: '#1A1D27', padding: '1.5rem', borderRadius: '8px' }}>
        <div className="input-group">
          <label>Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{width: '100%'}}/>
        </div>
        <ImageUploader images={formData.images} onChange={(imgs) => setFormData({...formData, images: imgs})} />
        <button type="submit" style={{ background: '#C1121F', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem'}}>Save Combo</button>
      </form>
    </div>
  );
};
export default AddCombo;
"""

files["combos/Combos.css"] = """.combos-page {
  padding: 1.5rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.prod-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
"""

for file_path, content in files.items():
    full_path = os.path.join(base_dir, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Generated part 3")
