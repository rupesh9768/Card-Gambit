import { cards as mockCards, rarities, species } from '../data/cards.js';
import { player as mockPlayer } from '../data/player.js';
import { isDatabaseConnected } from '../db.js';
import { Card } from '../models/Card.js';
import { Player } from '../models/Player.js';
import { calculateRating } from '../utils/cardRating.js';

export async function getCards(user = null) {
  if (!isDatabaseConnected()) {
    return mergeUserCards(mockCards.map(withRating), user);
  }

  const cards = await Card.find().sort({ gameId: 1 });
  return mergeUserCards(cards.map(toPlainCard), user);
}

export async function getPlayer(user = null) {
  if (user) {
    return withProgressFields(toPlain(user));
  }

  if (!isDatabaseConnected()) {
    return withProgressFields(mockPlayer);
  }

  const player = await Player.findOne().sort({ createdAt: 1 });
  return player ? withProgressFields(toPlain(player)) : withProgressFields(mockPlayer);
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

export async function collectCard(cardId, user = null) {
  if (!isDatabaseConnected()) {
    const card = mockCards.find((card) => card.id === cardId);

    if (card) {
      card.collected = true;
      card.quantity = Math.max(card.quantity ?? 0, 1);
    }

    return card;
  }

  const card = await Card.findOne({ gameId: cardId });

  if (!card) {
    return null;
  }

  if (user) {
    incrementUserCard(user, card.gameId);
    await user.save();
    return mergeCardWithUser(toPlainCard(card), user);
  }

  return toPlainCard(card);
}

export function getXpToNextLevel(level) {
  return Math.max(1, level) * 100;
}

export async function applyDuelReward({ user, userId, result }) {
  const won = result === 'win';
  const xpGained = won ? 50 : 20;
  const coinsGained = won ? 100 : 30;
  const rewardUser = user ?? (isDatabaseConnected() ? await findRewardPlayer(userId) : null);
  const droppedCard = won && Math.random() < 0.3 ? await dropRandomCard(rewardUser) : null;

  if (!isDatabaseConnected()) {
    const previousLevel = mockPlayer.level ?? 1;
    mockPlayer.xp = Number(mockPlayer.xp ?? 0) + xpGained;
    mockPlayer.coins = Number(mockPlayer.coins ?? 0) + coinsGained;
    mockPlayer.level = Number(mockPlayer.level ?? 1);
    applyLevelUps(mockPlayer);

    return buildRewardResponse({
      xpGained,
      coinsGained,
      previousLevel,
      player: withProgressFields(mockPlayer),
      droppedCard,
    });
  }

  const player = rewardUser;
  const previousLevel = player.level ?? 1;

  player.xp = Number(player.xp ?? 0) + xpGained;
  player.coins = Number(player.coins ?? 0) + coinsGained;
  player.level = Number(player.level ?? 1);
  applyLevelUps(player);
  await player.save();

  return buildRewardResponse({
    xpGained,
    coinsGained,
    previousLevel,
    player,
    droppedCard,
  });
}

export async function openStandardPack({ user, userId }) {
  const cost = 100;
  const packSize = 3;
  const player = user ?? (await getMutablePlayer(userId));

  if (Number(player.coins ?? 0) < cost) {
    const error = new Error('Not enough coins to open this pack.');
    error.status = 402;
    throw error;
  }

  player.coins = Number(player.coins ?? 0) - cost;
  await saveMutablePlayer(player);

  const cards = [];

  for (let index = 0; index < packSize; index += 1) {
    const rarity = rollPackRarity();
    const card = await dropRandomCardByRarity(rarity, player);

    if (card) {
      cards.push(toPlainCard(card));
    }
  }

  return {
    packType: 'Standard Pack',
    cost,
    cards,
    updatedCoins: player.coins,
  };
}

async function findRewardPlayer(userId) {
  if (userId) {
    try {
      const player = await Player.findById(userId);

      if (player) {
        return player;
      }
    } catch {
      // Fall back to the first player for now; auth will decide user identity later.
    }
  }

  const firstPlayer = await Player.findOne().sort({ createdAt: 1 });

  if (firstPlayer) {
    return firstPlayer;
  }

  return Player.create(mockPlayer);
}

async function getMutablePlayer(userId) {
  if (!isDatabaseConnected()) {
    mockPlayer.xp = Number(mockPlayer.xp ?? 0);
    mockPlayer.level = Number(mockPlayer.level ?? 1);
    mockPlayer.coins = Number(mockPlayer.coins ?? 0);
    return mockPlayer;
  }

  return findRewardPlayer(userId);
}

async function saveMutablePlayer(player) {
  if (typeof player.save === 'function') {
    await player.save();
  }
}

async function dropRandomCard(user = null) {
  if (!isDatabaseConnected()) {
    const card = mockCards[Math.floor(Math.random() * mockCards.length)];

    if (!card) {
      return null;
    }

    return incrementCardQuantity(card);
  }

  const cards = await Card.find();
  const card = cards[Math.floor(Math.random() * cards.length)];

  if (!card) {
    return null;
  }

  return incrementCardQuantity(card, user);
}

async function dropRandomCardByRarity(rarity, user = null) {
  const cards = await getCardsForDrop();
  const rarityCards = cards.filter((card) => card.rarity === rarity);
  const pool = rarityCards.length > 0 ? rarityCards : cards;
  const card = pool[Math.floor(Math.random() * pool.length)];

  if (!card) {
    return null;
  }

  return incrementCardQuantity(card, user);
}

async function getCardsForDrop() {
  if (!isDatabaseConnected()) {
    return mockCards;
  }

  return Card.find();
}

async function incrementCardQuantity(card, user = null) {
  if (user) {
    const plainCard = toPlainCard(card);
    const ownedCard = incrementUserCard(user, plainCard.id ?? plainCard.gameId);

    if (typeof user.save === 'function') {
      await user.save();
    }

    return {
      ...plainCard,
      collected: true,
      quantity: ownedCard.quantity,
    };
  }

  card.collected = true;
  card.quantity = Number(card.quantity ?? 0) + 1;

  if (typeof card.save === 'function') {
    await card.save();
  }

  return card;
}

function rollPackRarity() {
  const roll = Math.random() * 100;

  if (roll < 60) {
    return 'Common';
  }

  if (roll < 85) {
    return 'Rare';
  }

  if (roll < 95) {
    return 'Epic';
  }

  if (roll < 99) {
    return 'Legendary';
  }

  return 'Unknown';
}

function applyLevelUps(player) {
  while (player.xp >= getXpToNextLevel(player.level)) {
    const needed = getXpToNextLevel(player.level);
    player.level += 1;
    player.xp -= needed;
  }
}

function withProgressFields(player) {
  return {
    ...player,
    xp: Number(player.xp ?? 0),
    level: Number(player.level ?? 1),
    coins: Number(player.coins ?? 0),
    xpToNextLevel: getXpToNextLevel(Number(player.level ?? 1)),
  };
}

function buildRewardResponse({ xpGained, coinsGained, previousLevel, player, droppedCard }) {
  const plainPlayer = toPlain(player);
  const plainCard = droppedCard ? toPlainCard(droppedCard) : null;
  const normalizedPlayer = withProgressFields(plainPlayer);

  return {
    xpGained,
    coinsGained,
    previousLevel,
    newLevel: normalizedPlayer.level,
    levelUp: normalizedPlayer.level > previousLevel,
    xp: normalizedPlayer.xp,
    xpToNextLevel: normalizedPlayer.xpToNextLevel,
    player: normalizedPlayer,
    droppedCard: plainCard,
  };
}

function toPlain(document) {
  return typeof document.toJSON === 'function' ? document.toJSON() : document;
}

function toPlainCard(document) {
  return withRating(toPlain(document));
}

function withRating(card) {
  return {
    ...card,
    rating: calculateRating(card),
  };
}

function mergeUserCards(cards, user) {
  if (!user) {
    return cards;
  }

  return cards.map((card) => mergeCardWithUser(card, user));
}

function mergeCardWithUser(card, user) {
  const ownedCard = findUserCard(user, card.id ?? card.gameId);
  const quantity = Number(ownedCard?.quantity ?? 0);

  return {
    ...card,
    collected: quantity > 0,
    quantity,
  };
}

function findUserCard(user, cardId) {
  return user.cards?.find((card) => Number(card.cardId) === Number(cardId));
}

function incrementUserCard(user, cardId) {
  const ownedCard = findUserCard(user, cardId);

  if (ownedCard) {
    ownedCard.quantity = Number(ownedCard.quantity ?? 0) + 1;
    return ownedCard;
  }

  const nextCard = { cardId: Number(cardId), quantity: 1 };
  user.cards.push(nextCard);
  return nextCard;
}
