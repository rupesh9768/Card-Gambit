import { Router } from 'express';
import { openPack } from '../controllers/packController.js';

const router = Router();

router.post('/open', openPack);

export default router;
