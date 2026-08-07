import os

base_dir = "c:/Users/Lokesh/Desktop/E-commerce/orderly/admin/src/pages"
files = {}

# 3. ProductsList.jsx & ProductsList.css
files["products/ProductsList.jsx"] = """import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import './ProductsList.css';

const ProductsList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products', { params: { search, category } });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category]);

  const handleDelete = async () => {
    try {
      const res = await api.delete(`/admin/products/${deleteModal.id}`);
      if (res.data.success) {
        toast.success('Product deleted');
        fetchProducts();
      }
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/products/${id}/status`, { status: currentStatus === 'active' ? 'inactive' : 'active' });
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    { key: 'image', label: 'Image', render: (val) => <img src={val} alt="thumb" className="prod-thumb" /> },
    { key: 'name', label: 'Name' },
    { key: 'brand', label: 'Brand' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price (₹)', render: (val) => `₹${val}` },
    { key: 'rating', label: 'Rating' },
    { key: 'status', label: 'Status', render: (val, row) => (
      <div onClick={() => toggleStatus(row._id, val)} style={{cursor: 'pointer'}}>
        <StatusBadge status={val} />
      </div>
    ) },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="action-btns">
        <button className="btn-edit" onClick={() => navigate(`/products/edit/${row._id}`)}>Edit</button>
        <button className="btn-delete" onClick={() => setDeleteModal({ open: true, id: row._id })}>Delete</button>
      </div>
    ) }
  ];

  return (
    <div className="products-list-page">
      <div className="page-header">
        <h2>Products</h2>
        <button className="btn-primary" onClick={() => navigate('/products/new')}>Add Product</button>
      </div>
      <div className="filters">
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
        <select value={category} onChange={e => setCategory(e.target.value)} className="filter-select">
          <option value="">All Categories</option>
          <option value="shirts">Shirts</option>
          <option value="pants">Pants</option>
        </select>
      </div>
      <DataTable columns={columns} data={products} loading={loading} />
      
      {deleteModal.open && (
        <Modal onClose={() => setDeleteModal({ open: false, id: null })}>
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this product?</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeleteModal({ open: false, id: null })}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductsList;
"""

files["products/ProductsList.css"] = """.products-list-page {
  padding: 1.5rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.search-input, .filter-select {
  padding: 0.5rem;
  border-radius: 6px;
  background-color: #1A1D27;
  border: 1px solid rgba(255,255,255,0.08);
  color: #F1F5F9;
}
.prod-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.action-btns {
  display: flex;
  gap: 0.5rem;
}
.btn-edit {
  background-color: #F59E0B;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-delete, .btn-danger {
  background-color: #EF4444;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
"""

# 4. AddProduct.jsx
files["products/AddProduct.jsx"] = """import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api.js';
import ImageUploader from '../../../components/common/ImageUploader';

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', brand: '', category: '', occasion: '', price: '', originalPrice: '', badge: '',
    description: '', fabric: '', fit: '', washCare: '', shippingInfo: '', returnsInfo: '',
    images: [], colors: [], sizes: []
  });
  
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/products', formData);
      if (res.data.success) {
        toast.success('Product created');
        navigate('/products');
      }
    } catch (err) {
      toast.error('Failed to create product');
    }
  };

  return (
    <div className="add-product-page" style={{ padding: '1.5rem' }}>
      <h2>Add Product</h2>
      <form onSubmit={handleSave} className="form-card" style={{ background: '#1A1D27', padding: '1.5rem', borderRadius: '8px' }}>
        <div className="input-group">
          <label>Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{width: '100%'}}/>
        </div>
        <ImageUploader images={formData.images} onChange={(imgs) => setFormData({...formData, images: imgs})} />
        {/* Placeholder for remaining inputs */}
        <button type="submit" style={{ background: '#C1121F', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem'}}>Save Product</button>
      </form>
    </div>
  );
};
export default AddProduct;
"""

# 5. EditProduct.jsx
files["products/EditProduct.jsx"] = """import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api.js';
import ImageUploader from '../../../components/common/ImageUploader';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  
  useEffect(() => {
    api.get(`/admin/products/${id}`).then(res => {
      if (res.data.success) setFormData(res.data.data);
    }).catch(err => toast.error('Failed to load product'));
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/admin/products/${id}`, formData);
      if (res.data.success) {
        toast.success('Product updated');
        navigate('/products');
      }
    } catch (err) {
      toast.error('Failed to update product');
    }
  };

  if (!formData) return <div>Loading...</div>;

  return (
    <div className="edit-product-page" style={{ padding: '1.5rem' }}>
      <h2>Edit Product</h2>
      <form onSubmit={handleSave} className="form-card" style={{ background: '#1A1D27', padding: '1.5rem', borderRadius: '8px' }}>
        <div className="input-group">
          <label>Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{width: '100%'}}/>
        </div>
        <ImageUploader images={formData.images} onChange={(imgs) => setFormData({...formData, images: imgs})} />
        <button type="submit" style={{ background: '#C1121F', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem'}}>Update Product</button>
      </form>
    </div>
  );
};
export default EditProduct;
"""

for file_path, content in files.items():
    full_path = os.path.join(base_dir, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Generated part 2")
