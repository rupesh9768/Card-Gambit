export const rarityBonus = {
  Common: 0,
  Rare: 5,
  Epic: 10,
  Legendary: 15,
  Unknown: 25,
};

export function calculateRating(card) {
  const rating = Number(card.attack ?? 0) + Number(card.defense ?? 0) + Number(card.health ?? 0) + (rarityBonus[card.rarity] ?? 0);
  return Math.min(rating, 100);
}
