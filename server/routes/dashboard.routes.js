import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', adminAuth, getDashboardStats);

export default router;
