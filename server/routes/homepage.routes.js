import express from 'express';
import {
  getHomepageSections,
  getAllHomepageSections,
  updateHomepageSections,
  getVideoFilms,
  updateVideoFilms
} from '../controllers/homepage.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/sections', getHomepageSections);
router.get('/sections/all', adminAuth, getAllHomepageSections);
router.put('/sections', adminAuth, updateHomepageSections);

router.get('/video-films', getVideoFilms);
router.put('/video-films', updateVideoFilms);

export default router;
