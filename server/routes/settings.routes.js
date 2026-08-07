import express from 'express';
import { getPublicSettings, getAllSettings, bulkUpdateSettings } from '../controllers/settings.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', getPublicSettings);
router.get('/all', adminAuth, getAllSettings);
router.put('/', adminAuth, bulkUpdateSettings);

export default router;
