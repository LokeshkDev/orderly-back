import express from 'express';
import { 
  createOrder, getMyOrders, getOrders, getOrderById, 
  updateOrderStatus, updateTracking, updateOrder, deleteOrder 
} from '../controllers/orders.controller.js';
import { customerAuth, optionalCustomerAuth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/', optionalCustomerAuth, createOrder);
router.get('/my', customerAuth, getMyOrders);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id', adminAuth, updateOrder);
router.delete('/:id', adminAuth, deleteOrder);
router.patch('/:id/status', adminAuth, updateOrderStatus);
router.patch('/:id/tracking', adminAuth, updateTracking);

export default router;
