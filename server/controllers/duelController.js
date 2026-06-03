import crypto from 'node:crypto';
import { applyDuelReward, getCards } from '../services/gameService.js';
import { calculateRating } from '../utils/cardRating.js';

const duels = new Map();
const maxRounds = 5;
const stances = {
  attack: {
    label: 'Attack',
    attackMultiplier: 1.15,
    defenseMultiplier: 0.9,
    abilityMultiplier: 1,
  },
  guard: {
    label: 'Guard',
    attackMultiplier: 0.9,
    defenseMultiplier: 1.15,
    abilityMultiplier: 1,
  },
  focus: {
    label: 'Focus',
    attackMultiplier: 1,
    defenseMultiplier: 1,
    abilityMultiplier: 1.25,
  },
};

const stanceKeys = Object.keys(stances);

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
    aiDifficulty: duel.aiDifficulty,
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
    const aiDifficulty = normalizeDifficulty(request.body?.difficulty);

    if (!Array.isArray(playerDeck) || playerDeck.length < maxRounds) {
      return response.status(400).json({ message: 'Player deck must contain 5 cards.' });
    }

    const allCards = (await getCards(request.user)).map(toPlainCard);
    const selectedIds = playerDeck.slice(0, maxRounds).map((card) => card.id);
    const selectedPlayerDeck = selectedIds.map((id) => allCards.find((card) => card.id === id));
    const hasMissingCard = selectedPlayerDeck.some((card) => !card);
    const hasLockedCard = selectedPlayerDeck.some((card) => card && !card.collected);

    if (hasMissingCard) {
      return response.status(400).json({ message: 'Player deck contains an unknown card.' });
    }

    if (hasLockedCard) {
      return response.status(403).json({ message: 'Locked cards cannot be used in the battle deck.' });
    }

    const aiDeck = drawRandomCards(allCards, maxRounds);

    if (aiDeck.length < maxRounds) {
      return response.status(400).json({ message: 'Not enough AI cards available.' });
    }

    const duel = {
      duelId: crypto.randomUUID(),
      aiDifficulty,
      playerDeck: selectedPlayerDeck.map((card) => ({ ...card, used: false })),
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
  const playerStance = normalizeStance(request.body?.stance);
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

  const { card: aiCard, stance: aiStance, reason: aiReason } = chooseAiMove(duel, playerCard, playerStance);
  const playerRating = calculateRating(playerCard);
  const aiRating = calculateRating(aiCard);
  const combat = resolveCombat({
    playerCard,
    aiCard,
    playerStance,
    aiStance,
    round: duel.round,
  });
  const roundWinner = combat.roundWinner;
  const pointsAwarded = roundWinner === 'draw' ? 0 : duel.round === maxRounds ? 2 : 1;

  if (roundWinner === 'player') {
    duel.score.player += pointsAwarded;
  } else if (roundWinner === 'ai') {
    duel.score.ai += pointsAwarded;
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
    playerStance,
    aiStance,
    aiReason,
    combat,
    roundWinner,
    pointsAwarded,
    score: duel.score,
    round: duel.round,
    complete: isDuelComplete(duel),
  });
}

function normalizeDifficulty(difficulty) {
  return ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
}

function normalizeStance(stance) {
  return stanceKeys.includes(stance) ? stance : 'attack';
}

function chooseAiMove(duel, playerCard, playerStance) {
  const availableAiCards = duel.aiDeck.filter((card) => !card.used);
  const difficulty = normalizeDifficulty(duel.aiDifficulty);

  if (difficulty === 'easy') {
    const randomCard = availableAiCards[Math.floor(Math.random() * availableAiCards.length)];
    return {
      card: randomCard,
      stance: stanceKeys[Math.floor(Math.random() * stanceKeys.length)],
      reason: 'Easy AI played unpredictably.',
    };
  }

  const candidates = availableAiCards.flatMap((card) =>
    stanceKeys.map((stance) => {
      const combat = resolveCombat({
        playerCard,
        aiCard: card,
        playerStance,
        aiStance: stance,
        round: duel.round,
        preview: true,
      });
      const scoreDiff = combat.ai.score - combat.player.score;
      const winValue = combat.roundWinner === 'ai' ? 30 : combat.roundWinner === 'draw' ? 8 : -18;
      const preservePenalty = difficulty === 'hard' && duel.round <= 2 ? Math.max(0, calculateRating(card) - 88) * 0.8 : 0;
      const comebackBonus = difficulty === 'hard' && duel.score.ai < duel.score.player ? Math.max(0, card.attack - playerCard.defense) * 0.3 : 0;

      return {
        card,
        stance,
        score: winValue + scoreDiff - preservePenalty + comebackBonus,
      };
    }),
  );

  candidates.sort((left, right) => right.score - left.score);

  if (difficulty === 'medium') {
    return {
      card: candidates[0].card,
      stance: candidates[0].stance,
      reason: 'Medium AI countered your selected card.',
    };
  }

  return {
    card: candidates[0].card,
    stance: candidates[0].stance,
    reason: duel.round <= 2 ? 'Hard AI countered while preserving top cards.' : 'Hard AI chose the best combat line.',
  };
}

function resolveCombat({ playerCard, aiCard, playerStance, aiStance, round, preview = false }) {
  const player = createCombatant(playerCard, playerStance);
  const ai = createCombatant(aiCard, aiStance);
  const events = [];

  applyPreCombatAbility(player, ai, events);
  applyPreCombatAbility(ai, player, events);

  let damageToAi = Math.max(5, Math.round(player.attack - ai.defense * 0.6));
  let damageToPlayer = Math.max(5, Math.round(ai.attack - player.defense * 0.6));

  damageToAi = applyDamageAbility(player, ai, damageToAi, events);
  damageToPlayer = applyDamageAbility(ai, player, damageToPlayer, events);
  damageToAi = applyReductionAbility(ai, damageToAi, events);
  damageToPlayer = applyReductionAbility(player, damageToPlayer, events);

  player.remainingHp = player.health - damageToPlayer;
  ai.remainingHp = ai.health - damageToAi;

  applyAfterCombatAbility(player, ai, events);
  applyAfterCombatAbility(ai, player, events);

  const playerScoreBonus = getScoreBonus(player, ai, events);
  const aiScoreBonus = getScoreBonus(ai, player, events);
  const playerScore = Math.round(player.remainingHp + playerScoreBonus);
  const aiScore = Math.round(ai.remainingHp + aiScoreBonus);
  const scoreGap = playerScore - aiScore;
  let roundWinner = 'draw';

  if (Math.abs(scoreGap) > 3) {
    roundWinner = scoreGap > 0 ? 'player' : 'ai';
  }

  if (round === maxRounds && roundWinner !== 'draw') {
    events.push({
      side: 'arena',
      text: 'Final Clash: winner gains 2 points.',
    });
  }

  return {
    roundWinner,
    player: summarizeCombatant(player, damageToPlayer, playerScore, playerScoreBonus),
    ai: summarizeCombatant(ai, damageToAi, aiScore, aiScoreBonus),
    events: preview ? [] : events,
  };
}

function createCombatant(card, stance) {
  const stanceConfig = stances[normalizeStance(stance)];

  return {
    card,
    side: '',
    stance: normalizeStance(stance),
    attack: Math.round(card.attack * stanceConfig.attackMultiplier),
    defense: Math.round(card.defense * stanceConfig.defenseMultiplier),
    health: Number(card.health),
    abilityScale: stanceConfig.abilityMultiplier,
    remainingHp: Number(card.health),
  };
}

function scaled(value, combatant) {
  return Math.round(value * combatant.abilityScale);
}

function pushEvent(events, combatant, text) {
  events.push({
    cardId: combatant.card.id,
    cardName: combatant.card.name,
    species: combatant.card.species,
    stance: combatant.stance,
    text,
  });
}

function applyPreCombatAbility(combatant, enemy, events) {
  if (combatant.card.species === 'Wizards') {
    const amount = scaled(5, combatant);
    combatant.health += amount;
    combatant.remainingHp += amount;
    pushEvent(events, combatant, `Wizard Focus: +${amount} HP before combat.`);
  }

  if (combatant.card.name === 'Brucklin') {
    const enemyStats = [
      ['attack', enemy.attack],
      ['defense', enemy.defense],
      ['health', enemy.health],
    ];
    const [stat, value] = enemyStats.sort((left, right) => right[1] - left[1])[0];
    const copiedValue = value + scaled(5, combatant);
    combatant[stat] = Math.max(combatant[stat], copiedValue);

    if (stat === 'health') {
      combatant.remainingHp = Math.max(combatant.remainingHp, copiedValue);
    }

    pushEvent(events, combatant, `Reality Tear: copied enemy ${stat.toUpperCase()} to ${combatant[stat]}.`);
  } else if (combatant.card.species === 'Unknown') {
    combatant.defense += scaled(4, combatant);
    pushEvent(events, combatant, `Unknown Echo: +${scaled(4, combatant)} DEF from unstable form.`);
  }
}

function applyDamageAbility(attacker, defender, damage, events) {
  let nextDamage = damage;

  if (attacker.card.species === 'Monsters' && defender.defense < 18) {
    const amount = scaled(6, attacker);
    nextDamage += amount;
    pushEvent(events, attacker, `Monster Burst: +${amount} damage against low DEF.`);
  }

  return nextDamage;
}

function applyReductionAbility(defender, damage, events) {
  if (defender.card.species !== 'Gods') {
    return damage;
  }

  const reductionPercent = 0.2 * defender.abilityScale;
  const reduced = Math.max(5, Math.round(damage * (1 - reductionPercent)));
  pushEvent(events, defender, `Divine Guard: reduced incoming damage from ${damage} to ${reduced}.`);
  return reduced;
}

function applyAfterCombatAbility(combatant, enemy, events) {
  if (combatant.card.species === 'Dragons') {
    const amount = scaled(5, combatant);
    enemy.remainingHp -= amount;
    pushEvent(events, combatant, `Dragon Burn: -${amount} enemy HP after combat.`);
  }

  if (combatant.card.species === 'Undead') {
    const drain = scaled(4, combatant);
    const heal = scaled(2, combatant);
    enemy.remainingHp -= drain;
    combatant.remainingHp += heal;
    pushEvent(events, combatant, `Undead Drain: -${drain} enemy HP, +${heal} self HP.`);
  }

  if (combatant.card.species === 'Entities') {
    const amount = scaled(3, combatant);
    enemy.remainingHp -= amount;
    pushEvent(events, combatant, `Entity Distortion: -${amount} enemy HP through defenses.`);
  }
}

function getScoreBonus(combatant, enemy, events) {
  if (combatant.card.species === 'Humans' && combatant.defense > enemy.defense) {
    const amount = scaled(4, combatant);
    pushEvent(events, combatant, `Human Tactics: +${amount} combat score from higher DEF.`);
    return amount;
  }

  return 0;
}

function summarizeCombatant(combatant, damageTaken, score, scoreBonus) {
  return {
    stance: combatant.stance,
    attack: combatant.attack,
    defense: combatant.defense,
    health: combatant.health,
    damageTaken,
    remainingHp: Math.round(combatant.remainingHp),
    score,
    scoreBonus,
  };
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

export async function rewardDuel(request, response, next) {
  try {
    const { userId, result } = request.body ?? {};

    if (!['win', 'lose'].includes(result)) {
      return response.status(400).json({ message: 'Result must be win or lose.' });
    }

    const reward = await applyDuelReward({ user: request.user, userId, result });
    return response.json(reward);
  } catch (error) {
    next(error);
  }
}
