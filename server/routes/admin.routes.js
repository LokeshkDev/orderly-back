import express from 'express';
import { 
  login, 
  googleLogin, 
  getMe, 
  changePassword, 
  getAllAdmins, 
  createAdminUser, 
  updateAdminUser, 
  resetUserPassword, 
  deleteAdminUser 
} from '../controllers/admin.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { loginValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/login', loginValidation, login);
router.post('/google', googleLogin);
router.get('/me', adminAuth, getMe);

// Self Password Change
router.put('/change-password', adminAuth, changePassword);

// Team / Role-based Admin User Management
router.get('/users', adminAuth, getAllAdmins);
router.post('/users', adminAuth, createAdminUser);
router.put('/users/:id', adminAuth, updateAdminUser);
router.put('/users/:id/reset-password', adminAuth, resetUserPassword);
router.delete('/users/:id', adminAuth, deleteAdminUser);

export default router;
