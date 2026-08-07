import express from 'express';
import { login, googleLogin, getMe } from '../controllers/admin.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', adminAuth, getMe);

export default router;
