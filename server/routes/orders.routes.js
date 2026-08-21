import express from 'express';
import { 
  createOrder, getMyOrders, getOrders, getOrderById, 
  updateOrderStatus, updateTracking, updateOrder, deleteOrder, clearAllOrders 
} from '../controllers/orders.controller.js';
import { customerAuth, optionalCustomerAuth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { orderValidation, idParamValidation, paginationValidation } from '../middleware/validation.js';

const router = express.Router();

router.delete('/clear-all', adminAuth, clearAllOrders);
router.post('/', optionalCustomerAuth, orderValidation, createOrder);
router.get('/my', customerAuth, paginationValidation, getMyOrders);

router.get('/', paginationValidation, getOrders);
router.get('/:id', idParamValidation, getOrderById);
router.put('/:id', adminAuth, idParamValidation, updateOrder);
router.delete('/:id', adminAuth, idParamValidation, deleteOrder);
router.patch('/:id/status', adminAuth, idParamValidation, updateOrderStatus);
router.patch('/:id/tracking', adminAuth, idParamValidation, updateTracking);

export default router;
