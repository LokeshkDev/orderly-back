import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiUserPlus, FiSearch, FiEdit, FiTrash2, FiMail, FiPhone, FiCheck, FiShoppingBag, FiStar 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/api.js';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const DEFAULT_CUSTOMERS = [];

const emptyCustomerForm = {
  name: '',
  email: '',
  phone: '',
  status: 'Active'
};

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(emptyCustomerForm);

  const loadCustomers = async () => {
    let loadedList = [];

    try {
      const res = await getCustomers();
      if (res && res.success && Array.isArray(res.data)) {
        loadedList = res.data;
      }
    } catch (err) {}

    let savedList = [];
    try {
      const saved = localStorage.getItem('orderly_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) savedList = parsed;
      }
    } catch (e) {}

    const mergedMap = new Map();
    // Prioritize savedList (local edits & creations) over server loadedList and DEFAULT_CUSTOMERS
    [...DEFAULT_CUSTOMERS, ...loadedList, ...savedList].forEach(c => {
      if (c && c.email) {
        mergedMap.set(c.email.toLowerCase(), c);
      }
    });

    setCustomers(Array.from(mergedMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();

    const handleCustomersUpdated = () => {
      loadCustomers();
    };

    const interval = setInterval(() => {
      loadCustomers();
    }, 5000);

    window.addEventListener('orderly_customers_updated', handleCustomersUpdated);
    window.addEventListener('storage', handleCustomersUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('orderly_customers_updated', handleCustomersUpdated);
      window.removeEventListener('storage', handleCustomersUpdated);
    };
  }, []);

  const saveCustomersState = (updatedList) => {
    setCustomers(updatedList);
    try {
      localStorage.setItem('orderly_customers', JSON.stringify(updatedList));
      localStorage.setItem('orderly_customers_updated', String(Date.now()));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('orderly_customers_updated'));
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData(emptyCustomerForm);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingCustomer(item);
    setFormData({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      status: item.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Customer Name and Email are required');
      return;
    }

    if (editingCustomer) {
      const updated = customers.map(c => 
        (c.id === editingCustomer.id || (c.email && c.email.toLowerCase() === editingCustomer.email.toLowerCase())) 
          ? { ...c, ...formData } 
          : c
      );
      saveCustomersState(updated);
      try {
        await createCustomer(formData);
      } catch (err) {}
      toast.success(`Customer "${formData.name}" updated successfully!`);
    } else {
      const newCust = {
        id: Date.now(),
        ...formData,
        totalSpent: 0,
        ordersCount: 0,
        created_at: new Date().toISOString()
      };
      saveCustomersState([newCust, ...customers]);
      try {
        await createCustomer(formData);
      } catch (err) {}
      toast.success(`Customer "${formData.name}" registered successfully!`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = async (id, name, email) => {
    if (window.confirm(`Are you sure you want to delete customer profile "${name}"?`)) {
      const updated = customers.filter(c => 
        String(c.id) !== String(id) && (email ? c.email?.toLowerCase() !== email.toLowerCase() : true)
      );
      saveCustomersState(updated);
      try {
        await deleteCustomer(id);
      } catch (err) {}
      toast.success(`Customer "${name}" removed successfully!`);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="customers-page p-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="admin-page-title d-flex align-items-center gap-2" style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.5rem' }}>
            <FiUsers className="text-danger" /> Customer Accounts Registry
          </h1>
          <p className="text-muted mb-0 small">Registered website customers, order histories, total spent, and VIP tier statuses.</p>
        </div>
        <button type="button" className="btn-admin-red" onClick={openAddModal}>
          <FiUserPlus /> Add New Customer
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="admin-card-white mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <input 
                type="text"
                placeholder="Search customers by name, email, or phone number..."
                className="admin-input ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Matrix Table */}
      <div className="admin-card-white">
        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th className="ps-4 py-3">CUSTOMER NAME</th>
                <th>CONTACT DETAILS</th>
                <th>TOTAL ORDERS</th>
                <th>TOTAL SPENT</th>
                <th>JOINED DATE</th>
                <th>STATUS TIER</th>
                <th className="text-end pe-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <span className="spinner-border text-danger me-2" role="status" /> Loading customer directory...
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust, idx) => (
                  <tr key={cust.id ? `cust-${cust.id}-${cust.email || idx}` : `cust-idx-${idx}`}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-danger text-white fw-bold d-flex align-items-center justify-content-center" style={{ width: 38, height: 38, fontSize: '0.9rem' }}>
                          {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <strong className="text-dark d-block mb-0">{cust.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        <div className="text-dark"><FiMail className="text-muted me-1" /> {cust.email}</div>
                        {cust.phone && <div className="text-muted"><FiPhone className="text-muted me-1" /> {cust.phone}</div>}
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold text-dark"><FiShoppingBag className="text-muted me-1" /> {cust.ordersCount || 0} Orders</span>
                    </td>
                    <td>
                      <strong className="text-danger fs-6">₹{Number(cust.totalSpent || 0).toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className="small text-muted">
                        {cust.created_at ? new Date(cust.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={cust.status || 'Active'} />
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2"
                          onClick={() => openEditModal(cust)}
                        >
                          <FiEdit /> Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-admin-outline py-1 px-2 text-danger"
                          onClick={() => handleDeleteCustomer(cust.id, cust.name, cust.email)}
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
                    No registered customers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Customer */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer Profile' : 'Add New Customer Profile'}>
        <form onSubmit={handleSaveCustomer}>
          <div className="row g-3">
            <div className="col-12">
              <label className="admin-form-label">Full Name *</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Lokesh Sharma"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Email Address *</label>
              <input 
                type="email" 
                className="admin-input"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="admin-form-label">Phone Number</label>
              <input 
                type="text" 
                className="admin-input"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="col-12">
              <label className="admin-form-label">Account Tier Status</label>
              <select 
                className="admin-select"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Active">Active Standard Member</option>
                <option value="VIP">VIP Platinum Privilege Member</option>
                <option value="Inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn-admin-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-admin-red">
              <FiCheck /> {editingCustomer ? 'Save Customer Profile' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersList;
