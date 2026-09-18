import express from 'express';
import { 
  getCombos, getComboById, createCombo, updateCombo, deleteCombo, bulkUpdateCombos 
} from '../controllers/combo.controller.js';

const router = express.Router();

router.get('/', getCombos);
router.post('/bulk-update', bulkUpdateCombos);
router.get('/:id', getComboById);
router.post('/', createCombo);
router.put('/:id', updateCombo);
router.delete('/:id', deleteCombo);

export default router;
