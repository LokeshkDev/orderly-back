import express from 'express';
import multer from 'multer';
import { uploadSingle, uploadMultiple } from '../controllers/upload.controller.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max limit for HD video uploads
});

router.post('/', upload.single('file'), uploadSingle);
router.post('/single', upload.single('file'), uploadSingle);
router.post('/image', upload.single('file'), uploadSingle);
router.post('/video', upload.single('file'), uploadSingle);
router.post('/multiple', upload.array('files', 15), uploadMultiple);

export default router;
