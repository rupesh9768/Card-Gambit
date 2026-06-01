import crypto from 'node:crypto';
import { getCards } from '../services/gameService.js';

const duels = new Map();
const maxRounds = 5;
const rarityBonus = {
  Common: 0,
  Rare: 10,
  Epic: 20,
  Legendary: 30,
  Unknown: 50,
};

function calculateRating(card) {
  return Math.min(100, card.attack + card.defense + card.health + (rarityBonus[card.rarity] ?? 0));
}

function drawRandomCards(cards, count) {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function toPlainCard(card) {
  return typeof card.toJSON === 'function' ? card.toJSON() : card;
}

function serializeDuel(duel) {
  return {
    duelId: duel.duelId,
    playerDeck: duel.playerDeck,
    aiDeck: duel.aiDeck.map((card) => ({
      id: card.id,
      used: duel.usedAiCards.some((usedCard) => usedCard.id === card.id),
    })),
    usedPlayerCards: duel.usedPlayerCards,
    usedAiCards: duel.usedAiCards,
    score: duel.score,
    round: duel.round,
  };
}

function getFinalWinner(score) {
  if (score.player > score.ai) {
    return 'player';
  }

  if (score.ai > score.player) {
    return 'ai';
  }

  return 'draw';
}

function isDuelComplete(duel) {
  return duel.round > maxRounds || duel.playerDeck.every((card) => card.used);
}

export async function startDuel(request, response, next) {
  try {
    const playerDeck = request.body?.playerDeck;

    if (!Array.isArray(playerDeck) || playerDeck.length < maxRounds) {
      return response.status(400).json({ message: 'Player deck must contain 5 cards.' });
    }

    const allCards = (await getCards()).map(toPlainCard);
    const aiDeck = drawRandomCards(allCards, maxRounds);

    if (aiDeck.length < maxRounds) {
      return response.status(400).json({ message: 'Not enough AI cards available.' });
    }

    const duel = {
      duelId: crypto.randomUUID(),
      playerDeck: playerDeck.slice(0, maxRounds).map((card) => ({ ...toPlainCard(card), used: false })),
      aiDeck: aiDeck.map((card) => ({ ...card, used: false })),
      usedPlayerCards: [],
      usedAiCards: [],
      score: { player: 0, ai: 0 },
      round: 1,
    };

    duels.set(duel.duelId, duel);

    return response.status(201).json(serializeDuel(duel));
  } catch (error) {
    next(error);
  }
}

export function playDuelRound(request, response) {
  const { duelId, selectedCardId } = request.body ?? {};
  const duel = duels.get(duelId);

  if (!duel) {
    return response.status(404).json({ message: 'Duel not found.' });
  }

  if (isDuelComplete(duel)) {
    return response.status(400).json({ message: 'Duel is already complete.' });
  }

  const playerCard = duel.playerDeck.find((card) => card.id === selectedCardId);

  if (!playerCard || playerCard.used) {
    return response.status(400).json({ message: 'Selected card is not available.' });
  }

  const availableAiCards = duel.aiDeck.filter((card) => !card.used);
  const aiCard = availableAiCards[Math.floor(Math.random() * availableAiCards.length)];
  const playerRating = calculateRating(playerCard);
  const aiRating = calculateRating(aiCard);
  let roundWinner = 'draw';

  if (playerRating > aiRating) {
    roundWinner = 'player';
    duel.score.player += 1;
  } else if (aiRating > playerRating) {
    roundWinner = 'ai';
    duel.score.ai += 1;
  }

  playerCard.used = true;
  aiCard.used = true;
  duel.usedPlayerCards.push(playerCard);
  duel.usedAiCards.push(aiCard);
  duel.round += 1;

  return response.json({
    duelId: duel.duelId,
    playerCard,
    aiCard,
    playerRating,
    aiRating,
    roundWinner,
    score: duel.score,
    round: duel.round,
    complete: isDuelComplete(duel),
  });
}

export function getDuelResult(request, response) {
  const duelId = request.query.duelId;
  const duel = duels.get(duelId);

  if (!duel) {
    return response.status(404).json({ message: 'Duel not found.' });
  }

  return response.json({
    duelId,
    complete: isDuelComplete(duel),
    winner: isDuelComplete(duel) ? getFinalWinner(duel.score) : 'ongoing',
    score: duel.score,
    round: duel.round,
  });
}
