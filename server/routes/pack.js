import { Router } from 'express';
import { openPack, openStarter } from '../controllers/packController.js';

const router = Router();

router.post('/open', openPack);
router.post('/starter', openStarter);

export default router;
