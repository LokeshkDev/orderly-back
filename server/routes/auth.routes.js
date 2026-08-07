import express from 'express';
import { register, login, googleLogin, getMe } from '../controllers/auth.controller.js';
import { customerAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', customerAuth, getMe);

export default router;
