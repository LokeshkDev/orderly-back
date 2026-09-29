import express from 'express';
import multer from 'multer';
import { uploadSingle, uploadMultiple } from '../controllers/upload.controller.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max limit
});

// Resilient Multer wrapper accepting any field name ('file', 'image', 'images', 'files', etc.)
const handleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File exceeds maximum size limit of 50MB' });
      }
      return res.status(400).json({ success: false, message: err.message || 'File parsing error' });
    }
    next();
  });
};

router.post('/', handleUpload, uploadSingle);
router.post('/single', handleUpload, uploadSingle);
router.post('/image', handleUpload, uploadSingle);
router.post('/video', handleUpload, uploadSingle);
router.post('/multiple', handleUpload, uploadMultiple);

export default router;
