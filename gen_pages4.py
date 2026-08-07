import os

base_dir = "c:/Users/Lokesh/Desktop/E-commerce/orderly/admin/src/pages"
files = {}

# 10. Categories.jsx & Categories.css
files["categories/Categories.jsx"] = """import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import './Categories.css';

const Categories = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/categories').then(res => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  const columns = [
    { key: 'image', label: 'Image', render: (val) => <img src={val} alt="thumb" className="cat-thumb" /> },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'displayOrder', label: 'Order' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="categories-page" style={{ padding: '1.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2>Categories</h2>
        <button className="btn-primary" style={{ background: '#C1121F', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px' }}>Add Category</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
};
export default Categories;
"""

files["categories/Categories.css"] = ".cat-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }"

# 11. Occasions.jsx
files["occasions/Occasions.jsx"] = """import React, { useState, useEffect } from 'react';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';

const Occasions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/occasions').then(res => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  const columns = [
    { key: 'image', label: 'Image', render: (val) => <img src={val} alt="thumb" style={{ width: '40px', height: '40px', objectFit: 'cover' }} /> },
    { key: 'name', label: 'Name' },
    { key: 'subtitle', label: 'Subtitle' }
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>Occasions</h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
};
export default Occasions;
"""

# 12. Brands.jsx
files["brands/Brands.jsx"] = """import React, { useState, useEffect } from 'react';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';

const Brands = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/brands').then(res => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'logoText', label: 'Logo Text' }
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>Brands</h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
};
export default Brands;
"""

# 13. HeroSlides.jsx & HeroSlides.css
files["hero/HeroSlides.jsx"] = """import React, { useState, useEffect } from 'react';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';
import './HeroSlides.css';

const HeroSlides = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/hero-slides').then(res => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  const columns = [
    { key: 'image', label: 'Image', render: (val) => <img src={val} alt="slide" className="slide-thumb" /> },
    { key: 'title', label: 'Title' },
    { key: 'order', label: 'Order' },
    { key: 'active', label: 'Active', render: (val) => val ? 'Yes' : 'No' }
  ];

  return (
    <div className="hero-page" style={{ padding: '1.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2>Hero Slides</h2>
        <button className="btn-primary" style={{ background: '#C1121F', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px' }}>Add Slide</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
};
export default HeroSlides;
"""
files["hero/HeroSlides.css"] = ".slide-thumb { width: 80px; height: 40px; object-fit: cover; border-radius: 4px; }"

# 14. SiteSettings.jsx & css
files["settings/SiteSettings.jsx"] = """import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api.js';
import './SiteSettings.css';

const SiteSettings = () => {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/admin/settings').then(res => setSettings(res.data.data));
  }, []);

  const handleSave = async () => {
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="settings-page" style={{ padding: '1.5rem' }}>
      <h2>Site Settings</h2>
      <div className="form-card" style={{ background: '#1A1D27', padding: '1.5rem', borderRadius: '8px' }}>
        {/* Placeholder form */}
        <button onClick={handleSave} style={{ background: '#C1121F', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>Save All</button>
      </div>
    </div>
  );
};
export default SiteSettings;
"""
files["settings/SiteSettings.css"] = ".settings-page { color: #F1F5F9; }"

# 15. OrdersList.jsx & Orders.css
files["orders/OrdersList.jsx"] = """import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import './Orders.css';

const OrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders').then(res => {
      setOrders(res.data.data);
      setLoading(false);
    });
  }, []);

  const columns = [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'customerName', label: 'Customer' },
    { key: 'total', label: 'Total', render: (val) => `₹${val}` },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <button onClick={() => navigate(`/orders/${row._id}`)} style={{ background: '#3b82f6', color: '#fff', padding: '0.25rem 0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View</button>
    ) }
  ];

  return (
    <div className="orders-page" style={{ padding: '1.5rem' }}>
      <h2>Orders</h2>
      <DataTable columns={columns} data={orders} loading={loading} />
    </div>
  );
};
export default OrdersList;
"""
files["orders/Orders.css"] = ".orders-page { color: #F1F5F9; }"

# 16. OrderDetail.jsx
files["orders/OrderDetail.jsx"] = """import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api.js';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/admin/orders/${id}`).then(res => setOrder(res.data.data));
  }, [id]);

  if (!order) return <div style={{ padding: '1.5rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '1.5rem', color: '#F1F5F9' }}>
      <h2>Order #{order.orderNumber}</h2>
      <div style={{ background: '#1A1D27', padding: '1.5rem', borderRadius: '8px' }}>
        <p>Customer: {order.customerName}</p>
        <p>Total: ₹{order.total}</p>
        {/* Additional details */}
      </div>
    </div>
  );
};
export default OrderDetail;
"""

# 17. Coupons.jsx & css
files["coupons/Coupons.jsx"] = """import React, { useState, useEffect } from 'react';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';
import './Coupons.css';

const Coupons = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/coupons').then(res => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'discount', label: 'Discount' },
    { key: 'active', label: 'Active', render: (val) => val ? 'Yes' : 'No' }
  ];

  return (
    <div className="coupons-page" style={{ padding: '1.5rem' }}>
      <h2>Coupons</h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
};
export default Coupons;
"""
files["coupons/Coupons.css"] = ".coupons-page { color: #F1F5F9; }"

# 18. Customers.jsx
files["customers/Customers.jsx"] = """import React, { useState, useEffect } from 'react';
import api from '../../../services/api.js';
import DataTable from '../../../components/common/DataTable';

const Customers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/customers').then(res => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'totalSpent', label: 'Total Spent', render: (val) => `₹${val}` }
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>Customers</h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
};
export default Customers;
"""

for file_path, content in files.items():
    full_path = os.path.join(base_dir, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Generated part 4")
