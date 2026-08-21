import express from 'express';
import { login, googleLogin, getMe } from '../controllers/admin.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { loginValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/login', loginValidation, login);
router.post('/google', googleLogin);
router.get('/me', adminAuth, getMe);

export default router;
