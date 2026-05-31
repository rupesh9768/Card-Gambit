import { cards as mockCards, rarities, species } from '../data/cards.js';
import { player as mockPlayer } from '../data/player.js';
import { isDatabaseConnected } from '../db.js';
import { Card } from '../models/Card.js';
import { Player } from '../models/Player.js';

export async function getCards() {
  if (!isDatabaseConnected()) {
    return mockCards;
  }

  return Card.find().sort({ gameId: 1 });
}

export async function getPlayer() {
  if (!isDatabaseConnected()) {
    return mockPlayer;
  }

  const player = await Player.findOne().sort({ createdAt: 1 });
  return player ?? mockPlayer;
}

export function getRarities() {
  return rarities;
}

export function getSpecies() {
  return species;
}

export function getCollectionSummary(cards) {
  return {
    collected: cards.filter((card) => card.collected).length,
    total: cards.length,
  };
}

export async function collectCard(cardId) {
  if (!isDatabaseConnected()) {
    const card = mockCards.find((card) => card.id === cardId);

    if (card) {
      card.collected = true;
    }

    return card;
  }

  return Card.findOneAndUpdate({ gameId: cardId }, { collected: true }, { new: true });
}
