import express from 'express';
import {
  createRazorpayOrder,
  handleRazorpayWebhook,
  getPaymentConfig,
  verifyRazorpayPayment,
  reportRazorpayFailure
} from '../controllers/payments.controller.js';
import { optionalCustomerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/razorpay/order', optionalCustomerAuth, createRazorpayOrder);
router.post('/razorpay/verify', optionalCustomerAuth, verifyRazorpayPayment);
router.post('/razorpay/failure', optionalCustomerAuth, reportRazorpayFailure);
router.post('/razorpay/webhook', handleRazorpayWebhook);

export default router;
