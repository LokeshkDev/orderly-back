import express from 'express';
import { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus } from '../controllers/coupons.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/validate', validateCoupon);

router.get('/', adminAuth, getCoupons);
router.post('/', adminAuth, createCoupon);
router.put('/:id', adminAuth, updateCoupon);
router.delete('/:id', adminAuth, deleteCoupon);
router.patch('/:id/toggle', adminAuth, toggleCouponStatus);

export default router;
