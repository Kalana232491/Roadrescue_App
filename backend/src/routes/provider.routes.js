import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import * as Provider from '../controllers/provider.controller.js';

const router = Router();

router.get('/me', authRequired, Provider.getMyProfile);
router.post('/upsert', authRequired, Provider.upsertProfile);
router.post('/accessories', authRequired, Provider.addAccessory);
router.get('/:profileId/accessories', Provider.listAccessories);

export default router;