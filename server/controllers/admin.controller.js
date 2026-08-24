import { sendAdminUserCreatedEmail } from '../utils/emailService.js';
import bcryptjs from 'bcryptjs';
import db from '../models/index.js';
import { generateAdminToken } from '../utils/generateToken.js';

const { Admin } = db;

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let admin;
    try {
      admin = await Admin.findOne({ where: { email } });
    } catch (dbErr) {
      console.warn('DB query note on admin login:', dbErr.message);
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passHash = admin.password_hash || admin.password;
    if (!passHash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials setup' });
    }

    const isMatch = await bcryptjs.compare(password, passHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!admin.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateAdminToken(admin.id);
    res.status(200).json({
      success: true,
      token,
      data: { admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, token }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let admin;
    try {
      admin = await Admin.findOne({ where: { email } });
    } catch (err) {
      console.warn('Google login DB query note:', err.message);
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found with this email' });
    }

    if (!admin.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateAdminToken(admin.id);
    res.status(200).json({
      success: true,
      token,
      data: { admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    let admin;
    try {
      admin = await Admin.findByPk(req.admin.id, {
        attributes: { exclude: ['password_hash', 'password'] }
      });
    } catch (err) {
      console.warn('getMe DB query note:', err.message);
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Session expired or admin not found' });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// SELF PASSWORD CHANGE (Logged-in Admin)
// ----------------------------------------------------
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const admin = await Admin.findByPk(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const passHash = admin.password_hash || admin.password;
    if (passHash) {
      const isMatch = await bcryptjs.compare(currentPassword, passHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
    }

    const newHash = await bcryptjs.hash(newPassword, 10);
    await admin.update({ password_hash: newHash });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to change password' });
  }
};

// ----------------------------------------------------
// ADMIN USERS & ROLE MANAGEMENT
// ----------------------------------------------------
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ['password_hash', 'password'] },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    return res.status(500).json({ success: false, message: error.message, data: [] });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role, is_active } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const existing = await Admin.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An admin user with this email already exists' });
    }

    const password_hash = await bcryptjs.hash(password, 10);
    const newAdmin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role: role || 'admin',
      is_active: is_active !== undefined ? Boolean(is_active) : true
    });

    try {
      sendAdminUserCreatedEmail({
        name: newAdmin.name,
        email: newAdmin.email,
        password,
        role: newAdmin.role,
        creatorName: req.admin?.name || 'Super Admin'
      }).catch(e => console.warn('Admin user email notice:', e.message));
    } catch (e) {}

    const sanitized = {
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      is_active: newAdmin.is_active,
      createdAt: newAdmin.createdAt
    };

    return res.status(201).json({
      success: true,
      message: `Admin user "${newAdmin.name}" created successfully`,
      data: sanitized
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    if (String(admin.role).toLowerCase() === 'superadmin' && String(role).toLowerCase() !== 'superadmin') {
      return res.status(400).json({ success: false, message: 'Super Admin is a standard permanent root account and cannot be edited or demoted' });
    }

    if (email && email.trim().toLowerCase() !== admin.email) {
      const existing = await Admin.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existing && existing.id !== Number(id)) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
      }
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (role && String(admin.role).toLowerCase() !== 'superadmin') updates.role = role;
    if (is_active !== undefined && String(admin.role).toLowerCase() !== 'superadmin') updates.is_active = Boolean(is_active);

    await admin.update(updates);

    const sanitized = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      is_active: admin.is_active,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    };

    return res.status(200).json({
      success: true,
      message: `User "${admin.name}" updated successfully`,
      data: sanitized
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update user' });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const password_hash = await bcryptjs.hash(newPassword, 10);
    await admin.update({ password_hash });

    return res.status(200).json({
      success: true,
      message: `Password for "${admin.name}" has been reset successfully`
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === Number(req.admin.id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own active account' });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    if (String(admin.role).toLowerCase() === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Super Admin is a standard permanent root account and cannot be removed' });
    }

    const userName = admin.name;
    await admin.destroy();

    return res.status(200).json({
      success: true,
      message: `Admin user "${userName}" has been removed`
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete user' });
  }
};
