import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Gem, Home, PackageOpen, Sparkles } from 'lucide-react';
import { getDashboard, openPack } from '../lib/api.js';

const packCost = 100;
const sparks = Array.from({ length: 30 }, (_, index) => ({
  left: `${(index * 43) % 100}%`,
  bottom: `${(index * 21) % 92}%`,
  delay: `${(index % 9) * 0.5}s`,
  duration: `${5.2 + (index % 6) * 0.6}s`,
}));
const ghosts = [
  { left: '8%', top: '20%', delay: '0s', rotate: '-12deg' },
  { left: '82%', top: '18%', delay: '1.3s', rotate: '11deg' },
  { left: '20%', top: '76%', delay: '2s', rotate: '8deg' },
  { left: '76%', top: '72%', delay: '0.6s', rotate: '-9deg' },
];

const rarityStyles = {
  Common: 'border-slate-300/45 shadow-[0_0_18px_rgba(148,163,184,0.22)]',
  Rare: 'border-cyan-300/70 shadow-[0_0_28px_rgba(6,182,212,0.42)]',
  Epic: 'border-violet-300/75 shadow-[0_0_32px_rgba(124,58,237,0.48)]',
  Legendary: 'border-[#f5c518]/85 shadow-[0_0_42px_rgba(245,197,24,0.62)] pack-legendary-shine',
  Unknown: 'border-fuchsia-300/75 shadow-[0_0_36px_rgba(217,70,239,0.45)] pack-glitch',
};

export default function PacksPage() {
  const [coins, setCoins] = useState(null);
  const [cards, setCards] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((data) => setCoins(data.player.coins))
      .catch(() => setCoins(null));
  }, []);

  async function handleOpenPack() {
    if (phase === 'opening') {
      return;
    }

    setPhase('opening');
    setCards([]);
    setRevealedCount(0);
    setError('');

    try {
      const result = await openPack();
      setCoins(result.updatedCoins);
      setCards(result.cards);

      result.cards.forEach((_card, index) => {
        setTimeout(() => setRevealedCount(index + 1), 650 + index * 430);
      });
      setTimeout(() => setPhase('revealed'), 650 + result.cards.length * 430 + 350);
    } catch {
      setPhase('idle');
      setError('Not enough coins to open this pack.');
    }
  }

  function resetPack() {
    setCards([]);
    setRevealedCount(0);
    setPhase('idle');
    setError('');
  }

  return (
    <main className="lobby-screen flex items-center justify-center px-4 py-4">
      <PackBackground />

      <section className="relative z-10 grid h-full w-full max-w-7xl grid-rows-[auto_1fr] gap-4">
        <header className="flex h-16 items-center justify-between rounded-full border border-white/10 bg-black/25 px-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <Link to="/dashboard" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-[#f5c518]/40 bg-[#f5c518]/10 text-[#f5c518] shadow-ember transition group-hover:scale-105">
              <Gem size={22} />
            </span>
            <span>
              <span className="lobby-title-glow block font-display text-xl font-black uppercase leading-none tracking-wide text-white">
                Card Gambit
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Pack Forge</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/30 bg-[#f5c518]/10 px-4 py-2 text-sm font-black text-[#f5c518] shadow-ember">
              <Coins size={17} />
              {coins === null ? '-' : coins.toLocaleString()}
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:shadow-frost"
            >
              <Home size={16} />
              Lobby
            </Link>
          </div>
        </header>

        <div className="lobby-glass grid min-h-0 overflow-hidden rounded-[2rem] p-5 text-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/80">Standard Pack</p>
            <h1 className="lobby-title-glow mt-1 font-display text-5xl font-black uppercase text-white">Open Rewards</h1>
            <p className="mt-2 text-sm text-slate-400">Costs {packCost} coins. Reveals 3 cards.</p>
          </div>

          <div className="grid min-h-0 place-items-center">
            <div className="relative grid w-full max-w-5xl place-items-center">
              <motion.div
                className="pack-object relative grid h-64 w-48 place-items-center rounded-[1.8rem] border border-[#f5c518]/45 bg-gradient-to-br from-[#f5c518]/20 via-violet-700/40 to-cyan-950/45 shadow-ember"
                animate={
                  phase === 'opening'
                    ? { rotate: [-2, 2, -3, 3, 0], scale: [1, 1.04, 1.18, 0.96], y: [0, -4, -18, 8] }
                    : { y: [0, -8, 0] }
                }
                transition={phase === 'opening' ? { duration: 0.9 } : { duration: 3, repeat: Infinity }}
              >
                <div className="absolute inset-4 rounded-[1.3rem] border border-white/10 bg-black/25" />
                <PackageOpen className="relative text-[#f5c518] drop-shadow-[0_0_18px_rgba(245,197,24,0.7)]" size={78} />
                <p className="absolute bottom-7 font-display text-2xl font-black uppercase text-white">Standard</p>
              </motion.div>

              <div className="absolute inset-x-0 top-[43%] flex justify-center gap-5">
                {cards.map((card, index) => (
                  <PackCard key={`${card.id}-${index}`} card={card} index={index} revealed={revealedCount > index} />
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-20">
            {error && <p className="mb-3 text-sm font-black text-rose-200">{error}</p>}
            {phase === 'revealed' ? (
              <div className="flex flex-wrap justify-center gap-3">
                <motion.button
                  type="button"
                  onClick={resetPack}
                  className="rounded-full border border-[#f5c518]/35 bg-[#f5c518]/12 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#f5c518] transition hover:shadow-ember"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Open Another Pack
                </motion.button>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                  <Coins size={15} />
                  Updated Coins {coins?.toLocaleString()}
                </p>
              </div>
            ) : (
              <motion.button
                type="button"
                onClick={handleOpenPack}
                disabled={phase === 'opening'}
                className="battle-card-panel inline-flex items-center gap-3 overflow-hidden rounded-full border border-[#f5c518]/40 bg-gradient-to-r from-[#f5c518] via-orange-400 to-violet-500 px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-ember disabled:cursor-wait disabled:opacity-70"
                whileHover={phase !== 'opening' ? { scale: 1.05 } : undefined}
                whileTap={phase !== 'opening' ? { scale: 0.96 } : undefined}
              >
                <Sparkles size={18} />
                {phase === 'opening' ? 'Opening...' : 'Open Pack'}
              </motion.button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function PackCard({ card, index, revealed }) {
  const style = rarityStyles[card.rarity] ?? rarityStyles.Unknown;

  return (
    <motion.div
      className={`pack-reveal-card relative h-72 w-48 overflow-hidden rounded-2xl border bg-slate-950 p-2 ${style}`}
      initial={{ opacity: 0, y: 120, scale: 0, rotateY: 0 }}
      animate={{
        opacity: 1,
        y: revealed ? -80 : 20,
        x: (index - 1) * 190,
        scale: revealed ? 1 : 0.75,
        rotateY: revealed ? 180 : 0,
      }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-violet-950 via-slate-950 to-cyan-950 [backface-visibility:hidden]">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-[#f5c518]/30 bg-black/35 text-[#f5c518] shadow-ember">
          <Sparkles size={28} />
        </div>
      </div>

      <div className="absolute inset-0 flex rotate-y-180 flex-col p-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <div className="relative h-40 overflow-hidden rounded-xl border border-white/10 bg-violet-950">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover object-top" />
          ) : (
            <div className="grid h-full place-items-center">
              <span className="font-display text-5xl font-black text-slate-400">{card.name.charAt(0)}</span>
            </div>
          )}
          <div className="pack-shimmer absolute inset-0" />
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70">{card.rarity}</p>
          <h3 className="font-display text-xl font-black leading-tight text-white">{card.name}</h3>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Qty {card.quantity ?? 1}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function PackBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ghosts.map((ghost, index) => (
        <span
          key={index}
          className="lobby-card-ghost"
          style={{ left: ghost.left, top: ghost.top, animationDelay: ghost.delay, rotate: ghost.rotate }}
        />
      ))}
      {sparks.map((spark, index) => (
        <span
          key={index}
          className="lobby-spark"
          style={{ left: spark.left, bottom: spark.bottom, animationDelay: spark.delay, animationDuration: spark.duration }}
        />
      ))}
    </div>
  );
}
