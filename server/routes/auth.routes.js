import express from 'express';
import { register, login, googleLogin, getMe } from '../controllers/auth.controller.js';
import { customerAuth } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/google', googleLogin);
router.get('/me', customerAuth, getMe);

export default router;
