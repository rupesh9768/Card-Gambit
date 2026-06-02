import { Router } from 'express';
import { getDuelResult, playDuelRound, rewardDuel, startDuel } from '../controllers/duelController.js';

const router = Router();

router.post('/start', startDuel);
router.post('/play', playDuelRound);
router.post('/reward', rewardDuel);
router.get('/result', getDuelResult);

export default router;
