import mongoose from 'mongoose';
import { cards } from './data/cards.js';
import { player } from './data/player.js';
import { Card } from './models/Card.js';
import { Player } from './models/Player.js';
import logger from './logger.js';

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is missing. API will use local mock data.');
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'cardgame',
      serverSelectionTimeoutMS: 8000,
    });
    logger.info('MongoDB connected.');
    await seedDatabase();
    return true;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    logger.warn('API will use local mock data.');
    return false;
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

async function seedDatabase() {
  const seedIds = cards.map((card) => card.id);

  await Promise.all(
    cards.map(({ id, ...card }) =>
      Card.updateOne(
        { gameId: id },
        {
          $set: card,
          $setOnInsert: {
            gameId: id,
          },
        },
        { upsert: true },
      ),
    ),
  );

  await Card.deleteMany({ gameId: { $nin: seedIds } });

  await Player.updateOne(
    { username: player.username },
    { $setOnInsert: player },
    { upsert: true },
  );
}
