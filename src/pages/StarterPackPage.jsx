import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PackageOpen, ShieldCheck, Sparkles, Swords } from 'lucide-react';
import GameCard from '../components/GameCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { openStarterPack } from '../lib/api.js';

const revealDelay = 520;

export default function StarterPackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [phase, setPhase] = useState('sealed');
  const [cards, setCards] = useState([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      setRevealedCount(0);
    };
  }, []);

  async function handleOpen() {
    if (phase !== 'sealed') {
      return;
    }

    setPhase('opening');
    setError('');

    try {
      const result = await openStarterPack();
      setCards(result.cards);

      result.cards.forEach((_card, index) => {
        setTimeout(() => setRevealedCount(index + 1), 650 + index * revealDelay);
      });

      setTimeout(async () => {
        setPhase('ready');
        await refreshUser();
      }, 900 + result.cards.length * revealDelay);
    } catch (requestError) {
      setError(requestError.message);
      setPhase('sealed');
    }
  }

  return (
    <main className="lobby-screen flex min-h-screen items-center justify-center overflow-hidden px-4 py-5">
      <StarterBackground />

      <section className="lobby-glass pack-ritual-stage relative z-10 grid h-full w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[2rem] p-5 text-center">
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200/80">First Gambit</p>
          <h1 className="lobby-title-glow mt-1 font-display text-5xl font-black uppercase text-white sm:text-6xl">Awaken Your Deck</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-slate-300">
            Your starter pack contains exactly 5 cards: 2 Common, 2 Rare, and 1 Epic. These become your first battle deck.
          </p>
        </div>

        <div className="relative z-10 grid min-h-0 place-items-center">
          <div className="pack-ritual-ring" />
          <AnimatePresence>
            {phase === 'sealed' && (
              <motion.div
                className="pack-object relative grid h-72 w-52 place-items-center rounded-[2rem] border border-[#f5c518]/55 bg-gradient-to-br from-[#f5c518]/25 via-violet-700/45 to-cyan-950/50 shadow-ember"
                initial={{ opacity: 0, y: 28, scale: 0.92 }}
                animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, rotate: 8 }}
                transition={{ y: { duration: 3, repeat: Infinity }, opacity: { duration: 0.45 }, scale: { duration: 0.45 } }}
              >
                <PackageOpen className="relative text-[#f5c518] drop-shadow-[0_0_24px_rgba(245,197,24,0.8)]" size={92} />
                <p className="absolute bottom-9 font-display text-3xl font-black uppercase text-white">Starter</p>
              </motion.div>
            )}
          </AnimatePresence>

          {phase !== 'sealed' && (
            <div className="relative flex w-full max-w-6xl items-center justify-center gap-3 sm:gap-4">
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  className="w-[clamp(8.5rem,15vw,12rem)]"
                  initial={{ opacity: 0, y: 96, scale: 0.45, rotateY: 90 }}
                  animate={{
                    opacity: revealedCount > index ? 1 : 0.18,
                    y: revealedCount > index ? 0 : 66,
                    scale: revealedCount > index ? [0.82, 1.08, 1] : 0.72,
                    rotateY: revealedCount > index ? 0 : 90,
                  }}
                  transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                >
                  <GameCard card={{ ...card, collected: true }} size="deck" />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-20 min-h-24">
          {error && <p className="mb-3 text-sm font-black text-rose-200">{error}</p>}
          {phase === 'sealed' && (
            <motion.button
              type="button"
              onClick={handleOpen}
              className="battle-card-panel inline-flex items-center gap-3 overflow-hidden rounded-full border border-[#f5c518]/45 bg-gradient-to-r from-cyan-300 via-[#f5c518] to-violet-400 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-ember"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              <Sparkles size={18} />
              Awaken Starter Deck
            </motion.button>
          )}

          {phase === 'opening' && (
            <p className="font-display text-2xl font-black uppercase text-[#f5c518] lobby-title-glow">Cards Awakening...</p>
          )}

          {phase === 'ready' && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
              <p className="font-display text-3xl font-black uppercase text-[#f5c518] lobby-title-glow">Starter Battle Deck Created</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/duel?tutorial=true', { replace: true })}
                  className="battle-card-panel inline-flex items-center gap-3 overflow-hidden rounded-full border border-[#f5c518]/45 bg-[#f5c518]/15 px-7 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#f5c518] shadow-ember"
                >
                  <Swords size={16} />
                  Enter First Duel
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/battle-deck', { replace: true })}
                  className="inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-7 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 shadow-frost"
                >
                  <ShieldCheck size={16} />
                  View Deck
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}

function StarterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="lobby-sigil" />
      {Array.from({ length: 30 }, (_, index) => (
        <span
          key={index}
          className="lobby-spark"
          style={{
            left: `${(index * 37) % 100}%`,
            bottom: `${(index * 19) % 90}%`,
            animationDelay: `${(index % 8) * 0.45}s`,
          }}
        />
      ))}
    </div>
  );
}
