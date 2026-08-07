import express from 'express';
import { 
  getCustomers, getCustomerById, createCustomerApi, updateCustomerApi, deleteCustomerApi, toggleCustomerStatus 
} from '../controllers/customers.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', adminAuth, getCustomers);
router.post('/', adminAuth, createCustomerApi);
router.get('/:id', adminAuth, getCustomerById);
router.put('/:id', adminAuth, updateCustomerApi);
router.delete('/:id', adminAuth, deleteCustomerApi);
router.patch('/:id/toggle', adminAuth, toggleCustomerStatus);

export default router;
