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
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
