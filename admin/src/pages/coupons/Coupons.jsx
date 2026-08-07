import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import './Coupons.css';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coupons')
      .then(res => {
        if (res.data.success) setCoupons(res.data.data || []);
      })
      .catch(err => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'code', label: 'Coupon Code' },
    { key: 'discount_type', label: 'Type' },
    { key: 'discount_value', label: 'Value', render: (val, row) => row.discount_type === 'percentage' ? `${val}%` : `₹${val}` },
    { key: 'min_order', label: 'Min Order', render: (val) => `₹${val}` },
    { key: 'is_active', label: 'Status', render: (val) => <StatusBadge status={val ? 'active' : 'inactive'} /> }
  ];

  return (
    <div className="coupons-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white font-weight-bold mb-0">Discount Coupons</h2>
        <button className="btn-primary">+ Add Coupon</button>
      </div>
      <div className="admin-card p-4 rounded-3">
        <DataTable columns={columns} data={coupons} loading={loading} />
      </div>
    </div>
  );
};

export default Coupons;
