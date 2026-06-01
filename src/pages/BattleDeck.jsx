import { useEffect, useMemo, useState } from 'react';
import { Grip, Replace, ShieldAlert, Swords } from 'lucide-react';
import GameCard from '../components/GameCard.jsx';
import PageShell from '../components/PageShell.jsx';
import { getInventory } from '../lib/api.js';

const deckStorageKey = 'card-gambit-deck';
const maxDeckSize = 5;

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
        const validSavedDeck = savedDeckIds.filter((id) => ownedIds.includes(id)).slice(0, maxDeckSize);
        const fillCards = ownedCards
          .filter((card) => !validSavedDeck.includes(card.id))
          .slice(0, maxDeckSize - validSavedDeck.length)
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

  const deckPower = deckCards.reduce((total, card) => total + card.attack + card.defense + card.health, 0);

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
    if (deckIds.length < maxDeckSize) {
      setDeckIds((current) => [...current, card.id]);
      setSelectedSlot(deckIds.length);
      return;
    }

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
    clearDragState();
  }

  function clearDragState() {
    setDraggedSlot(null);
    setDropSlot(null);
  }

  return (
    <PageShell showBack>
      <section className="lobby-glass mb-6 flex flex-col gap-4 overflow-hidden rounded-3xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#f5c518]">Battle Loadout</p>
          <h1 className="lobby-title-glow mt-2 font-display text-4xl font-black text-slate-50 sm:text-5xl">Battle Deck</h1>
          <p className="mt-2 text-sm text-slate-400">Only unlocked cards can enter these five combat slots.</p>
          {error && <p className="mt-2 text-sm font-semibold text-rose-200">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DeckStat icon={Swords} label="Power" value={deckPower} />
          <DeckStat icon={ShieldAlert} label="Cards" value={`${deckCards.length}/${maxDeckSize}`} />
        </div>
      </section>

      <section className="lobby-glass rounded-3xl p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="lobby-title-glow font-display text-2xl font-bold text-slate-50">Active Deck</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Drag slots to reorder</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {deckCards.map((card, index) => (
            <div
              key={card.id}
              draggable
              onDragStart={(event) => handleDragStart(event, index)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDragLeave={() => setDropSlot(null)}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={clearDragState}
              className={`rounded-xl border p-2 transition duration-200 ${
                selectedSlot === index ? 'border-[#f5c518]/60 bg-[#f5c518]/10 shadow-ember' : 'border-white/10 bg-white/[0.04]'
              } ${dropSlot === index && draggedSlot !== index ? 'scale-[1.03] border-sky-300/70 bg-sky-300/10 shadow-frost' : ''} ${
                draggedSlot === index ? 'scale-95 opacity-60' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedSlot(index)}
                className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:border-[#f5c518]/40 hover:text-[#f5c518]"
              >
                <span className="flex items-center gap-2">
                  <Grip size={14} />
                  Slot {index + 1}
                </span>
                <span>{selectedSlot === index ? 'Active' : 'Pick'}</span>
              </button>

              <GameCard card={card} size="deck" />
            </div>
          ))}

          {deckCards.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-slate-400">
              Unlock cards to build your battle deck.
            </div>
          )}
        </div>
      </section>

      <section className="lobby-glass mt-6 rounded-3xl p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="lobby-title-glow font-display text-2xl font-bold text-slate-50">Owned Card Bench</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Place into Slot {selectedSlot + 1}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {benchCards.map((card, index) => (
            <div
              key={card.id}
              className="animate-fadeUp rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur transition hover:border-[#f5c518]/35 hover:shadow-ember"
              style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
            >
              <GameCard card={card} size="deck" />
              <button
                type="button"
                onClick={() => replaceSlot(card)}
                className="game-button mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#f5c518]/30 bg-[#f5c518]/15 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f5c518] transition hover:-translate-y-0.5 hover:bg-[#f5c518]/25 hover:shadow-ember"
              >
                <Replace size={15} />
                Place
              </button>
            </div>
          ))}
        </div>

        {benchCards.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-slate-400">
            No extra owned cards available.
          </div>
        )}
      </section>
    </PageShell>
  );
}

function DeckStat({ icon: Icon, label, value }) {
  return (
    <div className="lobby-glass flex min-w-32 items-center gap-3 rounded-2xl px-4 py-3">
      <Icon className="text-[#f5c518]" size={20} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-xl font-black text-slate-50">{value}</p>
      </div>
    </div>
  );
}

function readSavedDeck() {
  try {
    return JSON.parse(localStorage.getItem(deckStorageKey) ?? '[]');
  } catch {
    return [];
  }
}
