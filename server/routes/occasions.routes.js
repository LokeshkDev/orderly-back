import express from 'express';
import { getOccasions, getOccasion, createOccasion, updateOccasion, deleteOccasion } from '../controllers/occasions.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', getOccasions);
router.get('/:id', getOccasion);
router.post('/', adminAuth, createOccasion);
router.put('/:id', adminAuth, updateOccasion);
router.delete('/:id', adminAuth, deleteOccasion);

export default router;
