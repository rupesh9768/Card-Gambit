import 'dotenv/config';
import express from 'express';
import { connectDatabase, isDatabaseConnected } from './db.js';
import duelRoutes from './routes/duel.js';
import packRoutes from './routes/pack.js';
import { collectCard, getCards, getCollectionSummary, getPlayer, getRarities, getSpecies } from './services/gameService.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use('/api/duel', duelRoutes);
app.use('/api/pack', packRoutes);

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    database: isDatabaseConnected() ? 'connected' : 'mock',
  });
});

app.get('/api/dashboard', async (_request, response, next) => {
  try {
    const [player, cards] = await Promise.all([getPlayer(), getCards()]);

    response.json({
      player,
      collection: getCollectionSummary(cards),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/cards', async (_request, response, next) => {
  try {
    const cards = await getCards();

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

app.get('/api/inventory', async (_request, response, next) => {
  try {
    const cards = await getCards();
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

app.post('/api/cards/:id/collect', async (request, response, next) => {
  try {
    const cardId = Number(request.params.id);

    if (!Number.isInteger(cardId)) {
      return response.status(400).json({ message: 'Invalid card id.' });
    }

    const card = await collectCard(cardId);

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
