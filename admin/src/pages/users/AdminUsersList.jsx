import React, { useState, useEffect } from 'react';
import { 
  FiShield, FiUsers, FiUserPlus, FiEdit, FiTrash2, FiKey, 
  FiSearch, FiFilter, FiCheck, FiX, FiRefreshCw, FiChevronDown, FiChevronUp 
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_CONFIG, getRoleConfig } from '../../utils/rbac';
import { toast } from 'react-toastify';
import './AdminUsersList.css';

const AdminUsersList = () => {
  const { admin: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Accordion state for mobile card view
  const [expandedUsers, setExpandedUsers] = useState({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    is_active: true
  });
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.warn('Failed to fetch admin users:', err.message);
      toast.error('Failed to load admin users from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = 
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchRole = roleFilter === 'All' || String(u.role).toLowerCase() === roleFilter.toLowerCase();
    const matchStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Active' && u.is_active) || 
      (statusFilter === 'Deactivated' && !u.is_active);

    return matchSearch && matchRole && matchStatus;
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      is_active: true
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role || 'admin',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setIsEditModalOpen(true);
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setResetPasswordVal('');
    setIsResetModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please enter name, email, and password');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admin/users', formData);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Admin user created successfully');
        setIsAddModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res.data?.message || 'Failed to create admin user');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user. Email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const res = await api.put("/admin/users/" + selectedUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'User updated successfully');
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res.data?.message || 'Failed to update user');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal) return;

    if (resetPasswordVal.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put("/admin/users/" + selectedUser.id + "/reset-password", {
        newPassword: resetPasswordVal
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || "Password reset for " + selectedUser.name);
        setIsResetModalOpen(false);
      } else {
        toast.error(res.data?.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (Number(user.id) === Number(currentAdmin?.id)) {
      toast.error('You cannot delete your own active administrator account');
      return;
    }

    if (String(user.role).toLowerCase() === 'superadmin') {
      toast.error('Super Admin is a permanent standard root account and cannot be deleted');
      return;
    }

    if (window.confirm("Are you sure you want to remove \"" + user.name + "\" (" + user.email + ") from admin access?")) {
      try {
        const res = await api.delete("/admin/users/" + user.id);
        if (res.data && res.data.success) {
          toast.success(res.data.message || 'User removed');
          fetchUsers();
        } else {
          toast.error(res.data?.message || 'Failed to remove user');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="admin-users-page p-3 p-md-4">
      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="dash-title mb-0">Admin Users & Roles</h1>
            <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger fw-bold px-2 py-1 extra-small">
              {users.length} Team Members
            </span>
          </div>
          <p className="dash-sub mb-0 mt-1">
            Create role-based accounts, assign store permissions, and reset staff credentials.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 w-100-mobile">
          <button 
            type="button" 
            className="btn-admin-outline flex-grow-1-mobile"
            onClick={fetchUsers}
            title="Refresh Users"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button 
            type="button" 
            className="btn-admin-primary flex-grow-1-mobile d-flex align-items-center justify-content-center gap-2"
            onClick={openAddModal}
          >
            <FiUserPlus /> Add Team Member
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card-white">
            <span className="stat-label">TOTAL ADMIN USERS</span>
            <h3 className="stat-value my-1">{users.length}</h3>
            <span className="meta-text text-muted">Registered in database</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card-white">
            <span className="stat-label text-danger">SUPER ADMINS</span>
            <h3 className="stat-value my-1 text-danger">
              {users.filter(u => String(u.role).toLowerCase() === 'superadmin').length || 1}
            </h3>
            <span className="meta-text text-muted">Unrestricted access</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card-white">
            <span className="stat-label text-primary">MANAGERS & EDITORS</span>
            <h3 className="stat-value my-1 text-primary">
              {users.filter(u => ['manager', 'editor'].includes(String(u.role).toLowerCase())).length}
            </h3>
            <span className="meta-text text-muted">Catalog & order team</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card-white">
            <span className="stat-label text-success">ACTIVE SESSIONS</span>
            <h3 className="stat-value my-1 text-success">
              {users.filter(u => u.is_active).length}
            </h3>
            <span className="meta-text text-muted">Can log in to panel</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 bg-white rounded-3 border mb-4 shadow-sm">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="admin-input ps-5"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select 
              className="admin-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              {Object.values(ROLE_CONFIG).map(r => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select 
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Deactivated">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (Visible on screens >= 768px) */}
      <div className="d-none d-md-block admin-table-wrapper shadow-sm rounded-3 border bg-white">
        <table className="admin-table w-100">
          <thead>
            <tr>
              <th style={{ width: '28%', padding: '14px 16px' }}>USER NAME & EMAIL</th>
              <th style={{ width: '16%', padding: '14px 16px' }}>ASSIGNED ROLE</th>
              <th style={{ width: '24%', padding: '14px 16px' }}>ROLE PERMISSIONS</th>
              <th style={{ width: '10%', padding: '14px 16px' }}>STATUS</th>
              <th style={{ width: '10%', padding: '14px 16px' }}>CREATED</th>
              <th style={{ width: '12%', padding: '14px 16px' }} className="text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  <span className="spinner-border spinner-border-sm text-danger me-2" role="status" />
                  Loading team accounts...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  No admin users found matching your filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const roleConf = getRoleConfig(user.role);
                const isSelf = Number(user.id) === Number(currentAdmin?.id);
                const isSuperAdmin = String(user.role).toLowerCase() === 'superadmin';

                return (
                  <tr key={user.id}>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="user-avatar-badge"
                          style={{ background: roleConf.bg, color: roleConf.color }}
                        >
                          {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <strong className="text-dark">
                              {user.name}
                            </strong>
                            {isSuperAdmin && (
                              <span className="badge bg-danger bg-opacity-10 text-danger extra-small" style={{ fontSize: '0.65rem' }}>
                                Standard Root
                              </span>
                            )}
                            {isSelf && <span className="badge bg-secondary extra-small">You</span>}
                          </div>
                          <span className="text-muted extra-small">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span 
                        className="role-badge-pill"
                        style={{ background: roleConf.bg, color: roleConf.color, border: "1px solid " + roleConf.borderColor }}
                      >
                        <FiShield size={12} className="me-1" /> {roleConf.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="text-muted extra-small d-block" style={{ lineHeight: '1.3' }}>
                        {isSuperAdmin ? 'Standard permanent root administrator account with full system access' : roleConf.desc}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={"status-badge-pill " + (user.is_active ? 'active' : 'draft')}>
                        {user.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="text-muted small">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }} className="text-end">
                      <div className="d-inline-flex align-items-center justify-content-end gap-2">
                        {!isSuperAdmin && (
                          <button
                            type="button"
                            className="btn-action-pill"
                            onClick={() => openEditModal(user)}
                            title="Edit User Role & Details"
                          >
                            <FiEdit size={13} /> Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-action-pill"
                          onClick={() => openResetModal(user)}
                          title="Reset User Password"
                        >
                          <FiKey size={13} /> Reset Key
                        </button>
                        {!isSelf && !isSuperAdmin && (
                          <button
                            type="button"
                            className="btn-action-pill danger"
                            onClick={() => handleDeleteUser(user)}
                            title="Remove User"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE / TABLET CARD ACCORDION VIEW (Visible on screens < 768px, matching Screenshot 2) */}
      <div className="d-block d-md-none mobile-cards-container">
        {loading ? (
          <div className="text-center py-5 bg-white rounded-3 border shadow-sm text-muted">
            <span className="spinner-border spinner-border-sm text-danger me-2" role="status" />
            Loading team accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-3 border shadow-sm text-muted">
            No admin users found matching your filters.
          </div>
        ) : (
          filteredUsers.map(user => {
            const roleConf = getRoleConfig(user.role);
            const isSelf = Number(user.id) === Number(currentAdmin?.id);
            const isSuperAdmin = String(user.role).toLowerCase() === 'superadmin';
            const isExpanded = Boolean(expandedUsers[user.id]);

            return (
              <div key={user.id} className="mobile-user-card bg-white rounded-3 border shadow-sm mb-3 overflow-hidden">
                {/* Collapsed Header Bar */}
                <div 
                  className="p-3 d-flex align-items-center justify-content-between cursor-pointer"
                  onClick={() => toggleExpand(user.id)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <button 
                      type="button" 
                      className="mobile-expand-circle-btn"
                      style={{ background: isExpanded ? '#DC2626' : '#f1f5f9', color: isExpanded ? '#ffffff' : '#64748b' }}
                    >
                      {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </button>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-dark">{user.name}</strong>
                        {isSuperAdmin && (
                          <span className="badge bg-danger bg-opacity-10 text-danger extra-small" style={{ fontSize: '0.62rem' }}>
                            Root
                          </span>
                        )}
                        {isSelf && <span className="badge bg-secondary extra-small">You</span>}
                      </div>
                      <span 
                        className="role-badge-pill mt-1"
                        style={{ background: roleConf.bg, color: roleConf.color, border: "1px solid " + roleConf.borderColor, fontSize: '0.7rem', padding: '2px 8px' }}
                      >
                        {roleConf.label}
                      </span>
                    </div>
                  </div>

                  <span className={"status-badge-pill " + (user.is_active ? 'active' : 'draft')}>
                    {user.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-top bg-light bg-opacity-50">
                    <div className="mobile-detail-row d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted extra-small fw-bold">EMAIL:</span>
                      <span className="text-dark extra-small font-monospace">{user.email}</span>
                    </div>
                    <div className="mobile-detail-row d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted extra-small fw-bold">ROLE ACCESS:</span>
                      <span className="text-dark extra-small text-end" style={{ maxWidth: '65%' }}>
                        {isSuperAdmin ? 'Full unrestricted root system access' : roleConf.desc}
                      </span>
                    </div>
                    <div className="mobile-detail-row d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted extra-small fw-bold">CREATED:</span>
                      <span className="text-dark extra-small">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="d-flex flex-wrap gap-2 pt-3 justify-content-end">
                      {!isSuperAdmin && (
                        <button
                          type="button"
                          className="btn-action-pill"
                          onClick={() => openEditModal(user)}
                        >
                          <FiEdit size={13} /> Edit Role
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-action-pill"
                        onClick={() => openResetModal(user)}
                      >
                        <FiKey size={13} /> Reset Password
                      </button>
                      {!isSelf && !isSuperAdmin && (
                        <button
                          type="button"
                          className="btn-action-pill danger"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <FiTrash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isAddModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div 
            className="admin-modal-dialog" 
            style={{ maxWidth: '520px', width: '100%', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-content p-4 bg-white rounded-3 shadow-lg border">
              <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="p-2 rounded-2 bg-danger bg-opacity-10 text-danger">
                    <FiUserPlus size={20} />
                  </span>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark">Create Admin User</h5>
                    <span className="text-muted extra-small">Add a staff member with role-based store access</span>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsAddModalOpen(false)} />
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="mb-3">
                  <label className="admin-form-label mb-1">FULL NAME *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="admin-form-label mb-1">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@orderly.com"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="admin-form-label mb-1">INITIAL PASSWORD *</label>
                  <input
                    type="password"
                    className="admin-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="admin-form-label mb-1">ASSIGNED ROLE *</label>
                  <select
                    className="admin-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {Object.values(ROLE_CONFIG).filter(r => r.key !== 'superadmin').map(r => (
                      <option key={r.key} value={r.key}>
                        {r.label} — {r.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="newUserActiveSwitch"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="newUserActiveSwitch">
                    Account Active (User can log in immediately)
                  </label>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-3 py-2" 
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-admin-primary px-4 py-2"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div 
            className="admin-modal-dialog" 
            style={{ maxWidth: '520px', width: '100%', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-content p-4 bg-white rounded-3 shadow-lg border">
              <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="p-2 rounded-2 bg-primary bg-opacity-10 text-primary">
                    <FiEdit size={20} />
                  </span>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark">Edit User Account</h5>
                    <span className="text-muted extra-small">Update role permissions and account status</span>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsEditModalOpen(false)} />
              </div>

              <form onSubmit={handleUpdateUser}>
                <div className="mb-3">
                  <label className="admin-form-label mb-1">FULL NAME *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="admin-form-label mb-1">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="admin-form-label mb-1">ASSIGNED ROLE *</label>
                  <select
                    className="admin-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {Object.values(ROLE_CONFIG).filter(r => r.key !== 'superadmin').map(r => (
                      <option key={r.key} value={r.key}>
                        {r.label} — {r.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="editUserActiveSwitch"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="editUserActiveSwitch">
                    Account Active (User can log in to admin panel)
                  </label>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-3 py-2" 
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary px-4 py-2"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setIsResetModalOpen(false)}>
          <div 
            className="admin-modal-dialog" 
            style={{ maxWidth: '440px', width: '100%', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-content p-4 bg-white rounded-3 shadow-lg border">
              <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="p-2 rounded-2 bg-warning bg-opacity-10 text-warning">
                    <FiKey size={20} />
                  </span>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark">Reset Staff Password</h5>
                    <span className="text-muted extra-small">For user: {selectedUser.name} ({selectedUser.email})</span>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsResetModalOpen(false)} />
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="mb-4">
                  <label className="admin-form-label mb-1">ENTER NEW PASSWORD (MIN. 6 CHARACTERS) *</label>
                  <input
                    type="password"
                    className="admin-input"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="Enter new password for this user"
                    required
                  />
                </div>

                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-3 py-2" 
                    onClick={() => setIsResetModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-admin-primary px-4 py-2"
                    disabled={submitting}
                  >
                    {submitting ? 'Resetting...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersList;
