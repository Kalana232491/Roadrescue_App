import { Router } from 'express';
import auth from './auth.routes.js';
import provider from './provider.routes.js';
import reviews from './review.routes.js';
import admin from './admin.routes.js';
import search from './search.routes.js';
import accessories from './accessory.routes.js';


const router = Router();


router.use('/auth', auth);
router.use('/providers', provider);
router.use('/reviews', reviews);
router.use('/admin', admin);
router.use('/search', search);
router.use('/accessories', accessories);


export default router;