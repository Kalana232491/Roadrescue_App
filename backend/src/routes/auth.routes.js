import { Router } from 'express';
import * as Auth from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', Auth.register);
router.post('/login', Auth.login);

export default router;