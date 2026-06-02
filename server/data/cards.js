import { calculateRating } from '../utils/cardRating.js';

const cardsBySpecies = [
  {
    species: 'Humans',
    race: 'Human',
    cards: [
      {
        name: 'Iron Vanguard',
        ability: 'Hold Line',
        rarity: 'Common',
        attack: 20,
        defense: 24,
        health: 28,
        collected: true,
        imageUrl: '/cards/Iron%20Vanguard.jpg',
      },
      {
        name: 'Shadow Duelist',
        ability: 'Silent Riposte',
        rarity: 'Rare',
        attack: 25,
        defense: 17,
        health: 27,
        collected: false,
        imageUrl: '/cards/Shadow%20Duelist.jpg',
      },
    ],
  },
  {
    species: 'Monsters',
    race: 'Monster',
    cards: [
      {
        name: 'Cave Gnarl',
        ability: 'Bite',
        rarity: 'Common',
        attack: 28,
        defense: 17,
        health: 30,
        collected: true,
        imageUrl: '/cards/Cave%20Gnarl.jpg',
      },
      {
        name: 'Bloodfang Beast',
        ability: 'Rampage',
        rarity: 'Rare',
        attack: 30,
        defense: 15,
        health: 27,
        collected: false,
        imageUrl: '/cards/Bloodfang%20Beast.jpg',
      },
    ],
  },
  {
    species: 'Gods',
    race: 'Divine',
    cards: [
      {
        name: 'Solar Aegis',
        ability: 'Radiant Guard',
        rarity: 'Legendary',
        attack: 22,
        defense: 28,
        health: 30,
        collected: true,
        imageUrl: '/cards/Solar%20Aegis.jpg',
      },
      {
        name: 'Void Oracle',
        ability: 'Cosmic Sight',
        rarity: 'Legendary',
        attack: 24,
        defense: 20,
        health: 34,
        collected: false,
        imageUrl: '/cards/Void%20Oracle.jpg',
      },
    ],
  },
  {
    species: 'Entities',
    race: 'Entity',
    cards: [
      {
        name: 'Abyss Walker',
        ability: 'Void Step',
        rarity: 'Epic',
        attack: 26,
        defense: 20,
        health: 29,
        collected: true,
        imageUrl: '/cards/Abyss%20Walker.jpg',
      },
      {
        name: 'Mind Fracture',
        ability: 'Psychic Break',
        rarity: 'Epic',
        attack: 27,
        defense: 16,
        health: 30,
        collected: false,
        imageUrl: '/cards/Mind%20Fracture.jpg',
      },
    ],
  },
  {
    species: 'Undead',
    race: 'Undead',
    cards: [
      {
        name: 'Bone Reaper',
        ability: 'Soul Harvest',
        rarity: 'Epic',
        attack: 25,
        defense: 18,
        health: 27,
        collected: true,
        imageUrl: '/cards/Bone%20Reaper.jpg',
      },
      {
        name: 'Grave Thorn',
        ability: 'Grave Snare',
        rarity: 'Epic',
        attack: 23,
        defense: 20,
        health: 29,
        collected: false,
        imageUrl: '/cards/Grave%20Thorn.jpg',
      },
    ],
  },
  {
    species: 'Dragons',
    race: 'Dragon',
    cards: [
      {
        name: 'Flame Tyrant',
        ability: 'Flame Breath',
        rarity: 'Epic',
        attack: 28,
        defense: 22,
        health: 30,
        collected: true,
        imageUrl: '/cards/flame-dragon.jpg',
      },
      {
        name: 'Frost Wyrm',
        ability: 'Frost Breath',
        rarity: 'Epic',
        attack: 24,
        defense: 25,
        health: 29,
        collected: true,
        imageUrl: '/cards/ice-dragon.jpg',
      },
    ],
  },
  {
    species: 'Wizards',
    race: 'Wizard',
    cards: [
      {
        name: 'Arcane Nox',
        ability: 'Arcane Bolt',
        rarity: 'Rare',
        attack: 24,
        defense: 18,
        health: 31,
        collected: true,
        imageUrl: '/cards/Arcane%20Nox.jpg',
      },
      {
        name: 'Storm Sage',
        ability: 'Stormcall',
        rarity: 'Rare',
        attack: 22,
        defense: 17,
        health: 32,
        collected: false,
        imageUrl: '/cards/Storm%20Sage.jpg',
      },
    ],
  },
  {
    species: 'Unknown',
    race: 'Unknown',
    cards: [
      {
        name: 'Brucklin',
        ability: 'Reality Tear',
        rarity: 'Unknown',
        attack: 28,
        defense: 22,
        health: 25,
        collected: false,
        imageUrl: '/cards/Brucklin.jpg',
      },
    ],
  },
];

export const cards = cardsBySpecies.flatMap((set, speciesIndex) =>
  set.cards.map((card, cardIndex) => {
    const id = speciesIndex * 2 + cardIndex + 1;
    const cardWithStats = {
      ...card,
      species: set.species,
      race: set.race,
    };

    return {
      id,
      name: card.name,
      species: set.species,
      race: set.race,
      health: card.health,
      attack: card.attack,
      defense: card.defense,
      rating: calculateRating(cardWithStats),
      ability: card.ability,
      rarity: card.rarity,
      collected: card.collected,
      quantity: card.collected ? 1 : 0,
      imageUrl: card.imageUrl ?? '',
    };
  }),
);

export const species = cardsBySpecies.map((set) => set.species);
export const rarities = ['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Unknown'];
