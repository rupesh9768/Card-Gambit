const speciesSets = [
  {
    species: 'Humans',
    race: 'Human',
    names: ['Iron Recruit', 'Field Captain', 'Banner Guard', 'Duelist Vale', 'Royal Medic', 'Siege Marshal', 'Crimson Knight', 'Oath Keeper', 'Silver Ranger', 'King Ardan'],
    ability: ['Hold Line', 'Rally', 'Guard Stance', 'Quick Riposte', 'Mend', 'War Cry', 'Blade Dance', 'Shield Oath', 'Piercing Shot', 'Royal Command'],
  },
  {
    species: 'Monsters',
    race: 'Monster',
    names: ['Cave Gnarl', 'Fang Brute', 'Mire Crawler', 'Thornback', 'Ash Mauler', 'Horned Ravager', 'Dread Howler', 'Venom Maw', 'Stonehide', 'Apex Terror'],
    ability: ['Bite', 'Rampage', 'Ambush', 'Spiked Shell', 'Smash', 'Charge', 'Fear Cry', 'Poison Bite', 'Thick Hide', 'Predator Roar'],
  },
  {
    species: 'Gods',
    race: 'Divine',
    names: ['Dawn Herald', 'Rain Giver', 'Forge Saint', 'Moon Judge', 'Sun Oracle', 'Storm Vessel', 'War Aspect', 'Sky Matron', 'Fate Binder', 'Aurelion Prime'],
    ability: ['Bless', 'Renew', 'Forge Armor', 'Judgement', 'Solar Flare', 'Thunder Mark', 'Divine Strike', 'Sky Ward', 'Fate Shift', 'Godfall'],
  },
  {
    species: 'Entities',
    race: 'Entity',
    names: ['Null Wisp', 'Mirror Shade', 'Static Eye', 'Dream Knot', 'Echo Form', 'Void Thread', 'Phase Eater', 'Glass Mind', 'Star Husk', 'The Unnamed'],
    ability: ['Phase', 'Reflect', 'Static Field', 'Sleep Hex', 'Echo', 'Void Pull', 'Consume', 'Mind Crack', 'Star Drain', 'Unknown Law'],
  },
  {
    species: 'Undead',
    race: 'Undead',
    names: ['Bone Squire', 'Grave Thorn', 'Crypt Archer', 'Pale Monk', 'Rot Walker', 'Wraith Blade', 'Mourning Witch', 'Hollow Baron', 'Death Choir', 'Lich Regent'],
    ability: ['Bone Guard', 'Grave Snare', 'Cursed Arrow', 'Pale Prayer', 'Rot Touch', 'Soul Cut', 'Mourning Hex', 'Noble Curse', 'Death Song', 'Raise Dead'],
  },
  {
    species: 'Dragons',
    race: 'Dragon',
    names: ['Flame Dragon', 'Frostjaw Drake', 'Copper Wing', 'Stormscale', 'Magma Brood', 'Azure Drake', 'Nightflame', 'Elder Talon', 'Sky Tyrant', 'Ancient Pyra'],
    ability: ['Flame Breath', 'Frost Bite', 'Wing Beat', 'Storm Breath', 'Lava Skin', 'Arcane Breath', 'Dark Flame', 'Talon Rend', 'Air Rule', 'Ancient Fire'],
  },
  {
    species: 'Wizards',
    race: 'Wizard',
    names: ['Apprentice Nox', 'Rune Reader', 'Mist Caller', 'Pyre Adept', 'Frost Sage', 'Voidbound Oracle', 'Spell Thief', 'Archmage Venn', 'Time Weaver', 'Grand Magus'],
    ability: ['Minor Bolt', 'Rune Read', 'Mist Veil', 'Fire Charm', 'Ice Ward', 'Void Sight', 'Steal Spell', 'Arcane Flood', 'Time Slip', 'Grand Spell'],
  },
];

const rarityByIndex = ['Common', 'Common', 'Common', 'Rare', 'Rare', 'Rare', 'Epic', 'Epic', 'Legendary', 'Unknown'];

export const cards = speciesSets.flatMap((set, speciesIndex) =>
  set.names.map((name, cardIndex) => {
    const power = speciesIndex + cardIndex + 1;
    const id = speciesIndex * 10 + cardIndex + 1;

    return {
      id,
      name,
      species: set.species,
      race: set.race,
      health: 10 + power * 2,
      attack: 3 + Math.ceil(power * 1.25),
      defense: 2 + Math.ceil(power * 0.95),
      ability: set.ability[cardIndex],
      rarity: rarityByIndex[cardIndex],
      collected: cardIndex < 4 || id % 9 === 0,
      imageUrl: name === 'Flame Dragon' ? '/cards/flame-dragon.png' : '',
    };
  }),
);

export const species = speciesSets.map((set) => set.species);
export const rarities = ['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Unknown'];
