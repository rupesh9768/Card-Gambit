import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import GameCard from '../components/GameCard.jsx';
import PageShell from '../components/PageShell.jsx';
import { getCards } from '../lib/api.js';

export default function Collection() {
  const [data, setData] = useState({ cards: [], rarities: ['All'], species: ['All'], collection: null });
  const [selectedRarity, setSelectedRarity] = useState('All');
  const [selectedSpecies, setSelectedSpecies] = useState('All');
  const [error, setError] = useState('');

  useEffect(() => {
    getCards()
      .then(setData)
      .catch(() => setError('Could not load cards from the backend.'));
  }, []);

  const collectedCount = data.collection?.collected ?? 0;
  const totalCount = data.collection?.total ?? data.cards.length;
  const speciesOptions = ['All', ...(data.species ?? [])];
  const filteredCards = data.cards.filter((card) => {
    const rarityMatches = selectedRarity === 'All' || card.rarity === selectedRarity;
    const speciesMatches = selectedSpecies === 'All' || card.species === selectedSpecies;

    return rarityMatches && speciesMatches;
  });

  return (
    <PageShell showBack>
      <section className="lobby-glass mb-6 flex flex-col justify-between gap-4 overflow-hidden rounded-3xl p-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200/80">Player Inventory</p>
          <h1 className="lobby-title-glow mt-2 font-display text-4xl font-black text-slate-50 sm:text-5xl">Collected Cards</h1>
          <p className="mt-2 text-sm text-slate-400">
            {collectedCount} / {totalCount} unlocked. Locked cards reveal when collected.
          </p>
          {error && <p className="mt-2 text-sm font-semibold text-rose-200">{error}</p>}
        </div>
        <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
          <label className="lobby-glass flex items-center gap-3 rounded-2xl px-4 py-3 sm:w-60">
            <Filter className="text-sky-200" size={18} />
            <select
              value={selectedSpecies}
              onChange={(event) => setSelectedSpecies(event.target.value)}
              className="w-full bg-transparent text-sm font-bold text-slate-200 outline-none"
            >
              {speciesOptions.map((species) => (
                <option key={species} value={species} className="bg-slate-950">
                  {species} Species
                </option>
              ))}
            </select>
          </label>

          <label className="lobby-glass flex items-center gap-3 rounded-2xl px-4 py-3 sm:w-60">
            <Filter className="text-[#f5c518]" size={18} />
            <select
              value={selectedRarity}
              onChange={(event) => setSelectedRarity(event.target.value)}
              className="w-full bg-transparent text-sm font-bold text-slate-200 outline-none"
            >
              {data.rarities.map((rarity) => (
                <option key={rarity} value={rarity} className="bg-slate-950">
                  {rarity} Rarity
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCards.map((card, index) => (
          <div
            key={card.id}
            className="animate-fadeUp"
            style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
          >
            <GameCard card={card} />
          </div>
        ))}
      </section>

      {filteredCards.length === 0 && (
        <div className="lobby-glass mt-6 rounded-3xl p-8 text-center text-slate-400">
          No cards match this filter.
        </div>
      )}
    </PageShell>
  );
}
