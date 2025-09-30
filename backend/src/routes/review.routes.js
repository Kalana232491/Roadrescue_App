import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import * as Review from '../controllers/review.controller.js';

const router = Router();

router.post('/:providerId', authRequired, Review.postReview);
router.get('/:providerId', Review.getReviews);

export default router;