import { useEffect, useMemo, useState } from 'react';
import { Grip, Replace, Swords } from 'lucide-react';
import GameCard from '../components/GameCard.jsx';
import PageShell from '../components/PageShell.jsx';
import { getInventory } from '../lib/api.js';

const deckStorageKey = 'battle-card-game-deck';

export default function BattleDeck() {
  const [cards, setCards] = useState([]);
  const [deckIds, setDeckIds] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [dropSlot, setDropSlot] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getInventory()
      .then((data) => {
        const ownedCards = data.cards.filter((card) => card.collected);
        setCards(ownedCards);
        const savedDeckIds = readSavedDeck();
        const ownedIds = ownedCards.map((card) => card.id);
        const validSavedDeck = savedDeckIds.filter((id) => ownedIds.includes(id)).slice(0, 5);
        const fillCards = ownedCards
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

  function reorderSlot(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex === null || toIndex === null) {
      return;
    }
    setDeckIds((current) => {
      const next = [...current];
      const [movedCard] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedCard);
      return next;
    });
    setSelectedSlot(toIndex);
  }

  function replaceSlot(card) {
    setDeckIds((current) => current.map((id, index) => (index === selectedSlot ? card.id : id)));
  }

  function handleDragStart(event, index) {
    setDraggedSlot(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }

  function handleDragOver(event, index) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropSlot(index);
  }

  function handleDrop(event, index) {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData('text/plain'));
    reorderSlot(Number.isInteger(fromIndex) ? fromIndex : draggedSlot, index);
    setDraggedSlot(null);
    setDropSlot(null);
  }

  function clearDragState() {
    setDraggedSlot(null);
    setDropSlot(null);
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Drag cards to reorder</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {deckCards.map((card, index) => (
            <div
              key={card.id}
              draggable
              onDragStart={(event) => handleDragStart(event, index)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDragLeave={() => setDropSlot(null)}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={clearDragState}
              className={`animate-fadeUp rounded-xl p-2 transition duration-200 ${
                selectedSlot === index ? 'bg-amber-300/10 ring-2 ring-amber-300/55' : 'bg-white/[0.025] ring-1 ring-white/10'
              } ${dropSlot === index && draggedSlot !== index ? 'scale-[1.03] bg-sky-300/10 ring-2 ring-sky-300/60' : ''} ${
                draggedSlot === index ? 'scale-95 opacity-60' : ''
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <button
                type="button"
                onClick={() => setSelectedSlot(index)}
                className="mb-3 flex w-full items-center justify-between rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-100"
              >
                <span className="flex items-center gap-2">
                  <Grip size={15} className="text-slate-500" />
                  Slot {index + 1}
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  {selectedSlot === index ? 'Active' : 'Select'}
                </span>
              </button>

              <GameCard card={card} size="compact" />
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
