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
      dbName: process.env.MONGODB_DB_NAME || 'cardgame',
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
  await Promise.all(
    cards.map(({ id, collected, ...card }) =>
      Card.updateOne(
        { gameId: id },
        {
          $set: card,
          $setOnInsert: {
            gameId: id,
            collected,
          },
        },
        { upsert: true },
      ),
    ),
  );

  await Player.updateOne(
    { username: player.username },
    { $setOnInsert: player },
    { upsert: true },
  );
}
