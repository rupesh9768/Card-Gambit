const cardsBySpecies = [
  {
    species: 'Humans',
    race: 'Human',
    cards: [
      { name: 'Iron Recruit', ability: 'Hold Line', rarity: 'Common', collected: true },
      { name: 'Field Captain', ability: 'Rally', rarity: 'Rare', collected: false },
    ],
  },
  {
    species: 'Monsters',
    race: 'Monster',
    cards: [
      { name: 'Cave Gnarl', ability: 'Bite', rarity: 'Common', collected: true },
      { name: 'Fang Brute', ability: 'Rampage', rarity: 'Rare', collected: false },
    ],
  },
  {
    species: 'Gods',
    race: 'Divine',
    cards: [
      { name: 'Dawn Herald', ability: 'Bless', rarity: 'Rare', collected: true },
      { name: 'Storm Vessel', ability: 'Thunder Mark', rarity: 'Epic', collected: false },
    ],
  },
  {
    species: 'Entities',
    race: 'Entity',
    cards: [
      { name: 'Null Wisp', ability: 'Phase', rarity: 'Common', collected: true },
      { name: 'Mirror Shade', ability: 'Reflect', rarity: 'Epic', collected: false },
    ],
  },
  {
    species: 'Undead',
    race: 'Undead',
    cards: [
      { name: 'Bone Squire', ability: 'Bone Guard', rarity: 'Common', collected: true },
      { name: 'Grave Thorn', ability: 'Grave Snare', rarity: 'Rare', collected: false },
    ],
  },
  {
    species: 'Dragons',
    race: 'Dragon',
    cards: [
      {
        name: 'Flame Dragon',
        ability: 'Flame Breath',
        rarity: 'Epic',
        collected: true,
        imageUrl: '/cards/flame-dragon.jpg',
      },
      {
        name: 'Ice Dragon',
        ability: 'Frost Breath',
        rarity: 'Epic',
        collected: true,
        imageUrl: '/cards/ice-dragon.jpg',
      },
    ],
  },
  {
    species: 'Wizards',
    race: 'Wizard',
    cards: [
      { name: 'Apprentice Nox', ability: 'Minor Bolt', rarity: 'Common', collected: true },
      { name: 'Rune Reader', ability: 'Rune Read', rarity: 'Rare', collected: false },
    ],
  },
];

export const cards = cardsBySpecies.flatMap((set, speciesIndex) =>
  set.cards.map((card, cardIndex) => {
    const id = speciesIndex * 2 + cardIndex + 1;
    const power = speciesIndex + cardIndex + 2;

    return {
      id,
      name: card.name,
      species: set.species,
      race: set.race,
      health: 12 + power * 3,
      attack: 4 + Math.ceil(power * 1.4),
      defense: 3 + Math.ceil(power * 1.1),
      ability: card.ability,
      rarity: card.rarity,
      collected: card.collected,
      imageUrl: card.imageUrl ?? '',
    };
  }),
);

export const species = cardsBySpecies.map((set) => set.species);
export const rarities = ['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Unknown'];
