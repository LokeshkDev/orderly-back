import express from 'express';
import { 
  getProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkUpdateProducts 
} from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/bulk-update', bulkUpdateProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
