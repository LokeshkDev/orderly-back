import React, { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiX, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/admin/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password. Check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div 
        className="admin-modal-dialog" 
        style={{ maxWidth: '440px', width: '100%', margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-content p-4 bg-white rounded-3 shadow-lg border">
          <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-2 bg-danger bg-opacity-10 text-danger">
                <FiLock size={18} />
              </span>
              <div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: '1.05rem', color: '#0f172a' }}>Change Password</h5>
                <span className="text-muted extra-small">Update your administrator credentials</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose} 
              aria-label="Close" 
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="admin-form-label mb-1">CURRENT PASSWORD *</label>
              <div className="position-relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="admin-input pe-5"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent pe-3 text-muted"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                >
                  {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="admin-form-label mb-1">NEW PASSWORD (MIN. 6 CHARACTERS) *</label>
              <div className="position-relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="admin-input pe-5"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent pe-3 text-muted"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="admin-form-label mb-1">CONFIRM NEW PASSWORD *</label>
              <input
                type="password"
                className="admin-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <span className="text-danger extra-small d-block mt-1">Passwords do not match</span>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <span className="text-success extra-small d-flex align-items-center gap-1 mt-1">
                  <FiCheck size={12} /> Passwords match
                </span>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button 
                type="button" 
                className="btn btn-outline-secondary px-3 py-2" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-danger px-4 py-2 d-flex align-items-center gap-2"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
