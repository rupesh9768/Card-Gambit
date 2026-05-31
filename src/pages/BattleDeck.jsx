import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Replace, Swords } from 'lucide-react';
import GameCard from '../components/GameCard.jsx';
import PageShell from '../components/PageShell.jsx';
import { getInventory } from '../lib/api.js';

const deckStorageKey = 'battle-card-game-deck';

export default function BattleDeck() {
  const [cards, setCards] = useState([]);
  const [deckIds, setDeckIds] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getInventory()
      .then((data) => {
        setCards(data.cards);
        const savedDeckIds = readSavedDeck();
        const ownedIds = data.cards.map((card) => card.id);
        const validSavedDeck = savedDeckIds.filter((id) => ownedIds.includes(id)).slice(0, 5);
        const fillCards = data.cards
          .filter((card) => !validSavedDeck.includes(card.id))
          .slice(0, 5 - validSavedDeck.length)
          .map((card) => card.id);

        setDeckIds([...validSavedDeck, ...fillCards]);
      })
      .catch(() => setError('Could not load battle deck cards.'));
  }, []);

  useEffect(() => {
    if (deckIds.length > 0) {
      localStorage.setItem(deckStorageKey, JSON.stringify(deckIds));
    }
  }, [deckIds]);

  const deckCards = useMemo(
    () => deckIds.map((id) => cards.find((card) => card.id === id)).filter(Boolean),
    [cards, deckIds],
  );

  const benchCards = useMemo(
    () => cards.filter((card) => !deckIds.includes(card.id)),
    [cards, deckIds],
  );

  const deckPower = deckCards.reduce(
    (total, card) => total + card.attack + card.defense + card.health,
    0,
  );

  function moveSlot(index, direction) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= deckIds.length) {
      return;
    }

    setDeckIds((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setSelectedSlot(targetIndex);
  }

  function replaceSlot(card) {
    setDeckIds((current) => current.map((id, index) => (index === selectedSlot ? card.id : id)));
  }

  return (
    <PageShell showBack>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-200">Battle Loadout</p>
          <h1 className="mt-2 font-display text-4xl font-black text-slate-50 sm:text-5xl">Battle Deck</h1>
          <p className="mt-2 text-sm text-slate-400">Manage your 5 active playing cards and their positions.</p>
          {error && <p className="mt-2 text-sm font-semibold text-rose-200">{error}</p>}
        </div>

        <div className="glass-panel flex items-center gap-3 rounded-full px-5 py-3">
          <Swords className="text-amber-200" size={20} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Deck Power</p>
            <p className="text-xl font-black text-slate-50">{deckPower}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-300/15 bg-slate-950/50 p-4 shadow-xl shadow-black/30">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-slate-50">Active Slots</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Select slot, then replace</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {deckCards.map((card, index) => (
            <div
              key={card.id}
              className={`animate-fadeUp rounded-xl p-2 transition ${
                selectedSlot === index ? 'bg-amber-300/10 ring-2 ring-amber-300/55' : 'bg-white/[0.025] ring-1 ring-white/10'
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <button
                type="button"
                onClick={() => setSelectedSlot(index)}
                className="mb-3 flex w-full items-center justify-between rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-100"
              >
                <span>Slot {index + 1}</span>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  {selectedSlot === index ? 'Active' : 'Select'}
                </span>
              </button>

              <GameCard card={card} size="compact" />

              <div className="mt-3 grid grid-cols-2 gap-2">
                <MoveButton label="Left" icon={ChevronLeft} disabled={index === 0} onClick={() => moveSlot(index, -1)} />
                <MoveButton label="Right" icon={ChevronRight} disabled={index === deckCards.length - 1} onClick={() => moveSlot(index, 1)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-slate-950/35 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-slate-50">Inventory Bench</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Replace Slot {selectedSlot + 1}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {benchCards.map((card, index) => (
            <div
              key={card.id}
              className="animate-fadeUp rounded-xl border border-white/10 bg-white/[0.025] p-2"
              style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
            >
              <GameCard card={card} size="compact" />
              <button
                type="button"
                onClick={() => replaceSlot(card)}
                className="game-button mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-amber-100 transition hover:-translate-y-0.5 hover:bg-amber-400/25 hover:shadow-ember"
              >
                <Replace size={16} />
                Place
              </button>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function readSavedDeck() {
  try {
    return JSON.parse(localStorage.getItem(deckStorageKey) ?? '[]');
  } catch {
    return [];
  }
}

function MoveButton({ label, icon: Icon, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:border-sky-300/35 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
