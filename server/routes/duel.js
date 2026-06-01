import { Router } from 'express';
import { getDuelResult, playDuelRound, startDuel } from '../controllers/duelController.js';

const router = Router();

router.post('/start', startDuel);
router.post('/play', playDuelRound);
router.get('/result', getDuelResult);

export default router;
