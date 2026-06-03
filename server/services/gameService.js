import { cards as mockCards, rarities, species } from '../data/cards.js';
import { player as mockPlayer } from '../data/player.js';
import { isDatabaseConnected } from '../db.js';
import { Card } from '../models/Card.js';
import { Player } from '../models/Player.js';
import { calculateRating } from '../utils/cardRating.js';

const rarityRank = {
  Common: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Unknown: 5,
};

const duplicateRefunds = {
  Common: 5,
  Rare: 12,
  Epic: 30,
  Legendary: 75,
  Unknown: 180,
};

const packConfigs = {
  standard: {
    id: 'standard',
    label: 'Standard Pack',
    cost: 100,
    size: 3,
    guaranteedRare: false,
  },
  arcane: {
    id: 'arcane',
    label: 'Arcane Pack',
    cost: 250,
    size: 5,
    guaranteedRare: true,
  },
};

const dailyQuestTemplates = [
  {
    id: 'daily_duels_3',
    label: 'Finish 3 duels',
    type: 'duel',
    target: 3,
    xpReward: 70,
    coinsReward: 80,
  },
  {
    id: 'daily_win_1',
    label: 'Win 1 duel',
    type: 'win',
    target: 1,
    xpReward: 60,
    coinsReward: 70,
  },
  {
    id: 'daily_pack_1',
    label: 'Open 1 pack',
    type: 'pack',
    target: 1,
    xpReward: 45,
    coinsReward: 40,
  },
];

const levelMilestones = [
  { level: 2, title: 'Daily Quests Unlocked', coins: 100, note: 'Daily quests now become part of your reward loop.' },
  { level: 5, title: 'Pack Apprentice', coins: 150, note: 'Bonus coins for your first milestone pack chase.' },
  { level: 10, title: 'Arcane Pack Access', coins: 250, note: 'Arcane Packs are your high-value chase pack.' },
  { level: 15, title: 'Veteran Duelist', coins: 350, note: 'Bigger coin grant for long-term progress.' },
  { level: 20, title: 'Season Challenger', coins: 500, note: 'A major seasonal milestone reward.' },
];

const achievementTemplates = [
  {
    id: 'first_win',
    label: 'First Victory',
    description: 'Win your first duel.',
    xpReward: 40,
    coinsReward: 60,
    isComplete: (player) => Number(player.totalWins ?? 0) >= 1,
  },
  {
    id: 'streak_3',
    label: 'Triple Gambit',
    description: 'Reach a 3 win streak.',
    xpReward: 90,
    coinsReward: 120,
    isComplete: (player) => Number(player.bestWinStreak ?? 0) >= 3,
  },
  {
    id: 'pack_rookie',
    label: 'Pack Rookie',
    description: 'Open 5 packs.',
    xpReward: 80,
    coinsReward: 100,
    isComplete: (player) => Number(player.totalPacksOpened ?? 0) >= 5,
  },
  {
    id: 'collector_10',
    label: 'Collector Spark',
    description: 'Own 10 unique cards.',
    xpReward: 110,
    coinsReward: 150,
    isComplete: (player) => countUniqueOwnedCards(player) >= 10,
  },
];

export async function getCards(user = null) {
  if (!isDatabaseConnected()) {
    return mergeUserCards(mockCards.map(withRating), user);
  }

  const cards = await Card.find().sort({ gameId: 1 });
  return mergeUserCards(cards.map(toPlainCard), user);
}

export async function getPlayer(user = null) {
  if (user) {
    ensureDailyQuests(user);
    await saveMutablePlayer(user);
    return withProgressFields(toPlain(user));
  }

  if (!isDatabaseConnected()) {
    ensureDailyQuests(mockPlayer);
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
  const xpGained = won ? 60 : 25;
  const baseCoins = won ? 90 : 35;
  const rewardUser = user ?? (isDatabaseConnected() ? await findRewardPlayer(userId) : null);

  if (!isDatabaseConnected()) {
    const previousLevel = mockPlayer.level ?? 1;
    applyDuelStats(mockPlayer, won);
    const streakBonus = getWinStreakBonus(mockPlayer, won);
    mockPlayer.coins = Number(mockPlayer.coins ?? 0) + baseCoins + streakBonus;
    mockPlayer.level = Number(mockPlayer.level ?? 1);
    mockPlayer.xp = Number(mockPlayer.xp ?? 0) + xpGained;
    const droppedCard = await rollDuelDrop(mockPlayer, won);
    const questRewards = applyQuestProgress(mockPlayer, won ? ['duel', 'win'] : ['duel']);
    const achievementRewards = applyAchievements(mockPlayer);
    const levelUnlocks = applyLevelUps(mockPlayer);

    return buildRewardResponse({
      xpGained,
      coinsGained: baseCoins + streakBonus,
      previousLevel,
      player: withProgressFields(mockPlayer),
      droppedCard,
      streakBonus,
      questRewards,
      achievementRewards,
      levelUnlocks,
      dropPity: mockPlayer.duelDropPity,
    });
  }

  const player = rewardUser;
  const previousLevel = player.level ?? 1;
  applyDuelStats(player, won);
  const streakBonus = getWinStreakBonus(player, won);
  const droppedCard = await rollDuelDrop(player, won);

  player.xp = Number(player.xp ?? 0) + xpGained;
  player.coins = Number(player.coins ?? 0) + baseCoins + streakBonus;
  player.level = Number(player.level ?? 1);
  const questRewards = applyQuestProgress(player, won ? ['duel', 'win'] : ['duel']);
  const achievementRewards = applyAchievements(player);
  const levelUnlocks = applyLevelUps(player);
  await player.save();

  return buildRewardResponse({
    xpGained,
    coinsGained: baseCoins + streakBonus,
    previousLevel,
    player,
    droppedCard,
    streakBonus,
    questRewards,
    achievementRewards,
    levelUnlocks,
    dropPity: player.duelDropPity,
  });
}

export async function openStandardPack({ user, userId, packType = 'standard' }) {
  const config = packConfigs[packType] ?? packConfigs.standard;
  const { cost, size: packSize } = config;
  const player = user ?? (await getMutablePlayer(userId));

  if (Number(player.coins ?? 0) < cost) {
    const error = new Error('Not enough coins to open this pack.');
    error.status = 402;
    throw error;
  }

  player.coins = Number(player.coins ?? 0) - cost;
  ensurePackPity(player);

  const cards = [];
  let duplicateRefund = 0;
  let highestRarity = 'Common';

  for (let index = 0; index < packSize; index += 1) {
    const rarity = pickPackRarity(player, {
      guaranteeRare: config.guaranteedRare && index === packSize - 1 && cards.every((card) => getRarityRank(card.rarity) < getRarityRank('Rare')),
    });
    const card = await dropRandomCardByRarity(rarity, player, { preferUnowned: true });

    if (card) {
      cards.push(toPlainCard(card));
      highestRarity = getRarityRank(card.rarity) > getRarityRank(highestRarity) ? card.rarity : highestRarity;
      duplicateRefund += Number(card.coinRefund ?? 0);
      updatePackPity(player, card.rarity);
    }
  }

  player.totalPacksOpened = Number(player.totalPacksOpened ?? 0) + 1;
  const questRewards = applyQuestProgress(player, ['pack']);
  const achievementRewards = applyAchievements(player);
  const levelUnlocks = applyLevelUps(player);
  await saveMutablePlayer(player);

  return {
    packType: config.label,
    packId: config.id,
    cost,
    cards,
    updatedCoins: player.coins,
    duplicateRefund,
    highestRarity,
    pity: getPackPity(player),
    questRewards,
    achievementRewards,
    levelUnlocks,
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

async function dropRandomCard(user = null, options = {}) {
  if (!isDatabaseConnected()) {
    const pool = getPreferredDropPool(mockCards, user, options);
    const card = pool[Math.floor(Math.random() * pool.length)];

    if (!card) {
      return null;
    }

    return incrementCardQuantity(card, user);
  }

  const cards = await Card.find();
  const pool = getPreferredDropPool(cards, user, options);
  const card = pool[Math.floor(Math.random() * pool.length)];

  if (!card) {
    return null;
  }

  return incrementCardQuantity(card, user);
}

async function dropRandomCardByRarity(rarity, user = null, options = {}) {
  const cards = await getCardsForDrop();
  const rarityCards = cards.filter((card) => card.rarity === rarity);
  const pool = rarityCards.length > 0 ? rarityCards : cards;
  const preferredPool = getPreferredDropPool(pool, user, options);
  const card = preferredPool[Math.floor(Math.random() * preferredPool.length)];

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
    const cardId = plainCard.id ?? plainCard.gameId;
    const wasOwned = Number(findUserCard(user, cardId)?.quantity ?? 0) > 0;
    const ownedCard = incrementUserCard(user, cardId);
    const coinRefund = wasOwned ? getDuplicateRefund(plainCard.rarity) : 0;
    user.coins = Number(user.coins ?? 0) + coinRefund;

    if (typeof user.save === 'function') {
      await user.save();
    }

    return {
      ...plainCard,
      collected: true,
      quantity: ownedCard.quantity,
      duplicate: wasOwned,
      coinRefund,
    };
  }

  const wasOwned = Number(card.quantity ?? 0) > 0;
  card.collected = true;
  card.quantity = Number(card.quantity ?? 0) + 1;
  const coinRefund = wasOwned ? getDuplicateRefund(card.rarity) : 0;

  if (typeof card.save === 'function') {
    await card.save();
  }

  return {
    ...toPlainCard(card),
    duplicate: wasOwned,
    coinRefund,
  };
}

async function rollDuelDrop(player, won) {
  const dropChance = won ? 0.35 : 0.1;
  const guaranteed = Number(player.duelDropPity ?? 0) >= 4;

  if (!guaranteed && Math.random() >= dropChance) {
    player.duelDropPity = Number(player.duelDropPity ?? 0) + 1;
    return null;
  }

  player.duelDropPity = 0;
  const minimumRarity = guaranteed ? 'Rare' : null;
  return dropRandomCard(player, { preferUnowned: true, minimumRarity });
}

function pickPackRarity(player, { guaranteeRare = false } = {}) {
  ensurePackPity(player);

  if (player.packPity.unknown >= 59) {
    return 'Unknown';
  }

  if (player.packPity.legendary >= 19) {
    return 'Legendary';
  }

  if (player.packPity.epic >= 7) {
    return 'Epic';
  }

  const rarity = rollPackRarity();

  if (guaranteeRare && getRarityRank(rarity) < getRarityRank('Rare')) {
    return 'Rare';
  }

  return rarity;
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

function updatePackPity(player, rarity) {
  ensurePackPity(player);
  const rank = getRarityRank(rarity);

  player.packPity.epic = rank >= getRarityRank('Epic') ? 0 : Number(player.packPity.epic ?? 0) + 1;
  player.packPity.legendary = rank >= getRarityRank('Legendary') ? 0 : Number(player.packPity.legendary ?? 0) + 1;
  player.packPity.unknown = rank >= getRarityRank('Unknown') ? 0 : Number(player.packPity.unknown ?? 0) + 1;
}

function getPreferredDropPool(cards, user, { preferUnowned = false, minimumRarity = null } = {}) {
  const minimumRank = minimumRarity ? getRarityRank(minimumRarity) : 0;
  const rarityPool = minimumRank > 0 ? cards.filter((card) => getRarityRank(card.rarity) >= minimumRank) : cards;
  const basePool = rarityPool.length > 0 ? rarityPool : cards;

  if (!preferUnowned || !user) {
    return basePool;
  }

  const unownedPool = basePool.filter((card) => {
    const plainCard = toPlainCard(card);
    return Number(findUserCard(user, plainCard.id ?? plainCard.gameId)?.quantity ?? 0) <= 0;
  });

  return unownedPool.length > 0 ? unownedPool : basePool;
}

function getDuplicateRefund(rarity) {
  return duplicateRefunds[rarity] ?? duplicateRefunds.Common;
}

function getRarityRank(rarity) {
  return rarityRank[rarity] ?? rarityRank.Common;
}

function applyLevelUps(player) {
  const unlocks = [];

  while (player.xp >= getXpToNextLevel(player.level)) {
    const needed = getXpToNextLevel(player.level);
    player.level += 1;
    player.xp -= needed;
    const milestone = levelMilestones.find((item) => item.level === player.level);

    if (milestone) {
      player.coins = Number(player.coins ?? 0) + milestone.coins;
      unlocks.push(milestone);
    }
  }

  return unlocks;
}

function applyDuelStats(player, won) {
  player.totalDuels = Number(player.totalDuels ?? 0) + 1;

  if (won) {
    player.totalWins = Number(player.totalWins ?? 0) + 1;
    player.winStreak = Number(player.winStreak ?? 0) + 1;
    player.bestWinStreak = Math.max(Number(player.bestWinStreak ?? 0), player.winStreak);
    return;
  }

  player.totalLosses = Number(player.totalLosses ?? 0) + 1;
  player.winStreak = 0;
}

function getWinStreakBonus(player, won) {
  if (!won) {
    return 0;
  }

  return Math.min(50, Math.max(0, Number(player.winStreak ?? 0) - 1) * 10);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ensureDailyQuests(player) {
  const today = getTodayKey();

  if (player.dailyQuestDate === today && Array.isArray(player.dailyQuests) && player.dailyQuests.length === dailyQuestTemplates.length) {
    return;
  }

  player.dailyQuestDate = today;
  player.dailyQuests = dailyQuestTemplates.map((quest) => ({
    ...quest,
    progress: 0,
    claimed: false,
  }));
}

function applyQuestProgress(player, actionTypes) {
  ensureDailyQuests(player);
  const rewards = [];

  for (const quest of player.dailyQuests) {
    if (quest.claimed || !actionTypes.includes(quest.type)) {
      continue;
    }

    quest.progress = Math.min(Number(quest.target), Number(quest.progress ?? 0) + 1);

    if (quest.progress >= quest.target) {
      quest.claimed = true;
      player.xp = Number(player.xp ?? 0) + Number(quest.xpReward ?? 0);
      player.coins = Number(player.coins ?? 0) + Number(quest.coinsReward ?? 0);
      rewards.push(normalizeQuest(quest));
    }
  }

  return rewards;
}

function normalizeQuest(quest) {
  return {
    id: quest.id,
    label: quest.label,
    type: quest.type,
    target: Number(quest.target ?? 1),
    progress: Math.min(Number(quest.target ?? 1), Number(quest.progress ?? 0)),
    xpReward: Number(quest.xpReward ?? 0),
    coinsReward: Number(quest.coinsReward ?? 0),
    claimed: Boolean(quest.claimed),
  };
}

function applyAchievements(player) {
  if (!Array.isArray(player.achievements)) {
    player.achievements = [];
  }

  const unlockedIds = new Set(player.achievements.map((achievement) => achievement.id));
  const rewards = [];

  for (const achievement of achievementTemplates) {
    if (unlockedIds.has(achievement.id) || !achievement.isComplete(player)) {
      continue;
    }

    player.achievements.push({ id: achievement.id, unlockedAt: new Date() });
    player.xp = Number(player.xp ?? 0) + achievement.xpReward;
    player.coins = Number(player.coins ?? 0) + achievement.coinsReward;
    rewards.push({
      id: achievement.id,
      label: achievement.label,
      xpReward: achievement.xpReward,
      coinsReward: achievement.coinsReward,
    });
  }

  return rewards;
}

function countUniqueOwnedCards(player) {
  return (player.cards ?? []).filter((card) => Number(card.quantity ?? 0) > 0).length;
}

function ensurePackPity(player) {
  player.packPity = {
    epic: Number(player.packPity?.epic ?? 0),
    legendary: Number(player.packPity?.legendary ?? 0),
    unknown: Number(player.packPity?.unknown ?? 0),
  };
}

function getPackPity(player) {
  ensurePackPity(player);

  return {
    epic: Number(player.packPity.epic ?? 0),
    legendary: Number(player.packPity.legendary ?? 0),
    unknown: Number(player.packPity.unknown ?? 0),
    epicGuaranteedIn: Math.max(0, 8 - Number(player.packPity.epic ?? 0)),
    legendaryGuaranteedIn: Math.max(0, 20 - Number(player.packPity.legendary ?? 0)),
    unknownGuaranteedIn: Math.max(0, 60 - Number(player.packPity.unknown ?? 0)),
  };
}

function withProgressFields(player) {
  ensureDailyQuests(player);
  ensurePackPity(player);
  const unlockedAchievementIds = new Set((player.achievements ?? []).map((achievement) => achievement.id));

  return {
    ...player,
    xp: Number(player.xp ?? 0),
    level: Number(player.level ?? 1),
    coins: Number(player.coins ?? 0),
    xpToNextLevel: getXpToNextLevel(Number(player.level ?? 1)),
    winStreak: Number(player.winStreak ?? 0),
    bestWinStreak: Number(player.bestWinStreak ?? 0),
    totalDuels: Number(player.totalDuels ?? 0),
    totalWins: Number(player.totalWins ?? 0),
    totalLosses: Number(player.totalLosses ?? 0),
    totalPacksOpened: Number(player.totalPacksOpened ?? 0),
    duelDropPity: Number(player.duelDropPity ?? 0),
    packPity: getPackPity(player),
    dailyQuests: (player.dailyQuests ?? []).map(normalizeQuest),
    achievements: achievementTemplates.map((achievement) => ({
      id: achievement.id,
      label: achievement.label,
      description: achievement.description,
      xpReward: achievement.xpReward,
      coinsReward: achievement.coinsReward,
      unlocked: unlockedAchievementIds.has(achievement.id),
    })),
    nextMilestone: levelMilestones.find((milestone) => milestone.level > Number(player.level ?? 1)) ?? null,
  };
}

function buildRewardResponse({
  xpGained,
  coinsGained,
  previousLevel,
  player,
  droppedCard,
  streakBonus = 0,
  questRewards = [],
  achievementRewards = [],
  levelUnlocks = [],
  dropPity = 0,
}) {
  const plainPlayer = toPlain(player);
  const plainCard = droppedCard ? toPlainCard(droppedCard) : null;
  const normalizedPlayer = withProgressFields(plainPlayer);

  return {
    xpGained,
    coinsGained,
    streakBonus,
    previousLevel,
    newLevel: normalizedPlayer.level,
    levelUp: normalizedPlayer.level > previousLevel,
    xp: normalizedPlayer.xp,
    xpToNextLevel: normalizedPlayer.xpToNextLevel,
    player: normalizedPlayer,
    droppedCard: plainCard,
    questRewards,
    achievementRewards,
    levelUnlocks,
    dropPity,
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
