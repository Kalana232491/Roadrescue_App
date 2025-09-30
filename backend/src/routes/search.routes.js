import { Router } from 'express';
import * as Search from '../controllers/search.controller.js';

const router = Router();

router.get('/nearby', Search.nearby);

export default router;