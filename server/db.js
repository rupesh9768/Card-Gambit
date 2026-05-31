import mongoose from 'mongoose';
import { cards } from './data/cards.js';
import { player } from './data/player.js';
import { Card } from './models/Card.js';
import { Player } from './models/Player.js';

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is missing. API will use local mock data.');
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('MongoDB connected.');
    await seedDatabase();
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.warn('API will use local mock data.');
    return false;
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

async function seedDatabase() {
  const [cardCount, playerCount] = await Promise.all([
    Card.countDocuments(),
    Player.countDocuments(),
  ]);

  if (cardCount === 0) {
    await Card.insertMany(cards.map(({ id, ...card }) => ({ ...card, gameId: id })));
  }

  if (playerCount === 0) {
    await Player.create(player);
  }
}
