import 'dotenv/config';
import express from 'express';
import { connectDatabase, isDatabaseConnected } from './db.js';
import authRoutes from './routes/auth.js';
import duelRoutes from './routes/duel.js';
import packRoutes from './routes/pack.js';
import { authenticate } from './middleware/authMiddleware.js';
import { collectCard, getCards, getCollectionSummary, getPlayer, getRarities, getSpecies } from './services/gameService.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/duel', authenticate, duelRoutes);
app.use('/api/pack', authenticate, packRoutes);

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    database: isDatabaseConnected() ? 'connected' : 'mock',
  });
});

app.get('/api/dashboard', authenticate, async (request, response, next) => {
  try {
    const [player, cards] = await Promise.all([getPlayer(request.user), getCards(request.user)]);

    response.json({
      player,
      collection: getCollectionSummary(cards),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/cards', authenticate, async (request, response, next) => {
  try {
    const cards = await getCards(request.user);

    response.json({
      cards,
      rarities: getRarities(),
      species: getSpecies(),
      collection: getCollectionSummary(cards),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/inventory', authenticate, async (request, response, next) => {
  try {
    const cards = await getCards(request.user);
    const ownedCards = cards.filter((card) => card.collected);

    response.json({
      cards: ownedCards,
      rarities: getRarities(),
      species: getSpecies(),
      collection: getCollectionSummary(cards),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/cards/:id/collect', authenticate, async (request, response, next) => {
  try {
    const cardId = Number(request.params.id);

    if (!Number.isInteger(cardId)) {
      return response.status(400).json({ message: 'Invalid card id.' });
    }

    const card = await collectCard(cardId, request.user);

    if (!card) {
      return response.status(404).json({ message: 'Card not found.' });
    }

    return response.json({ card });
  } catch (error) {
    next(error);
  }
});

app.post('/api/play/:mode', (request, response) => {
  const modes = ['ranked', 'classic', 'ai'];
  const { mode } = request.params;

  if (!modes.includes(mode)) {
    return response.status(400).json({ message: 'Invalid game mode.' });
  }

  return response.status(202).json({
    mode,
    status: 'queued',
    message: `${getModeLabel(mode)} battle will be connected later.`,
  });
});

app.get('/api/user/profile', authenticate, async (request, response) => {
  response.json({ user: await getPlayer(request.user) });
});

function getModeLabel(mode) {
  if (mode === 'ranked') {
    return 'Ranked';
  }

  if (mode === 'ai') {
    return 'AI';
  }

  return 'Classic';
}

app.use('/api', (_request, response) => {
  response.status(404).json({ message: 'API route not found.' });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: 'Server error.' });
});

connectDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`Card Gambit API running on http://127.0.0.1:${PORT}`);
  });
});
