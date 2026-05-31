import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import GameCard from '../components/GameCard.jsx';
import PageShell from '../components/PageShell.jsx';
import { getCards } from '../lib/api.js';

export default function Collection() {
  const [data, setData] = useState({ cards: [], rarities: ['All'], collection: null });
  const [error, setError] = useState('');

  useEffect(() => {
    getCards()
      .then(setData)
      .catch(() => setError('Could not load cards from the backend.'));
  }, []);

  const collectedCount = data.collection?.collected ?? 0;
  const totalCount = data.collection?.total ?? data.cards.length;

  return (
    <PageShell showBack>
      <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-200">Collected Cards</p>
          <h1 className="mt-2 font-display text-4xl font-black text-slate-50 sm:text-5xl">Card Collection</h1>
          <p className="mt-2 text-sm text-slate-400">
            {collectedCount} / {totalCount} owned cards. Locked cards stay hidden until collected.
          </p>
          {error && <p className="mt-2 text-sm font-semibold text-rose-200">{error}</p>}
        </div>
        <label className="glass-panel flex w-full items-center gap-3 rounded-lg px-4 py-3 sm:w-72">
          <Filter className="text-sky-200" size={18} />
          <select className="w-full bg-transparent text-sm font-bold text-slate-200 outline-none">
            {data.rarities.map((rarity) => (
              <option key={rarity} value={rarity} className="bg-slate-950">
                {rarity} Rarity
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.cards.map((card) => (
          <GameCard key={card.id} card={card} />
        ))}
      </section>
    </PageShell>
  );
}
