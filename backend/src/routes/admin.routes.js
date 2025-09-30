import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as Admin from '../controllers/admin.controller.js';

const router = Router();

router.get('/users', authRequired, requireRole('admin'), Admin.listUsers);
router.post('/users', authRequired, requireRole('admin'), Admin.createAdminUser);
router.get('/provider-profiles', authRequired, requireRole('admin'), Admin.listProviderProfiles);
router.post('/provider-status', authRequired, requireRole('admin'), Admin.setProviderStatus);
router.delete('/users/:userId', authRequired, requireRole('admin'), Admin.deleteUser);

export default router;
