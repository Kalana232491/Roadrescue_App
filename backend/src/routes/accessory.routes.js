import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import * as Accessory from '../controllers/accessory.controller.js';


const router = Router();


// Provider must be logged in
router.post('/', authRequired, Accessory.create);
router.delete('/:id', authRequired, Accessory.remove);


// Public
router.get('/profile/:profileId', Accessory.listByProfile);


export default router;