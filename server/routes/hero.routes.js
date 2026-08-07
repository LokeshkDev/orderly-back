import express from 'express';
import { getActiveHeroSlides, getAllHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide, toggleHeroSlideStatus } from '../controllers/hero.controller.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', getActiveHeroSlides);
router.get('/all', adminAuth, getAllHeroSlides);
router.post('/', adminAuth, createHeroSlide);
router.put('/:id', adminAuth, updateHeroSlide);
router.delete('/:id', adminAuth, deleteHeroSlide);
router.patch('/:id/toggle', adminAuth, toggleHeroSlideStatus);

export default router;
