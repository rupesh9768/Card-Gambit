import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Gem, Home, PackageOpen, Sparkles } from 'lucide-react';
import { getDashboard, openPack } from '../lib/api.js';

const packTypes = {
  standard: {
    id: 'standard',
    label: 'Standard Pack',
    cost: 100,
    size: 3,
    description: '3 cards for steady collection growth.',
  },
  arcane: {
    id: 'arcane',
    label: 'Arcane Pack',
    cost: 250,
    size: 5,
    description: '5 cards with a guaranteed Rare-or-better final slot.',
  },
};
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

const rarityImpact = {
  Common: 'pack-impact-common',
  Rare: 'pack-impact-rare',
  Epic: 'pack-impact-epic',
  Legendary: 'pack-impact-legendary',
  Unknown: 'pack-impact-unknown',
};

function buildPlaceholderCards(size) {
  return Array.from({ length: size }, (_, index) => ({
    id: `pack-placeholder-${index}`,
    name: 'Sealed Reward',
    rarity: 'Common',
    isPlaceholder: true,
  }));
}

export default function PacksPage() {
  const [coins, setCoins] = useState(null);
  const [packType, setPackType] = useState('standard');
  const [cards, setCards] = useState([]);
  const [packResult, setPackResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [error, setError] = useState('');
  const selectedPack = packTypes[packType];

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
    setCards(buildPlaceholderCards(selectedPack.size));
    setPackResult(null);
    setRevealedCount(0);
    setError('');

    try {
      const result = await openPack(undefined, packType);
      setCoins(result.updatedCoins);
      setCards(result.cards);
      setPackResult(result);

      result.cards.forEach((_card, index) => {
        setTimeout(() => setRevealedCount(index + 1), 520 + index * 560);
      });
      setTimeout(() => setPhase('revealed'), 520 + result.cards.length * 560 + 520);
    } catch {
      setPhase('idle');
      setCards([]);
      setError('Not enough coins to open this pack.');
    }
  }

  function resetPack() {
    setCards([]);
    setPackResult(null);
    setRevealedCount(0);
    setPhase('idle');
    setError('');
  }

  return (
    <main className="lobby-screen flex items-center justify-center px-4 py-4">
      <PackBackground />
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[1] bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        )}
      </AnimatePresence>

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

        <div className="lobby-glass pack-ritual-stage relative grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[2rem] p-5 text-center">
          <AnimatePresence>
            {phase !== 'idle' && (
              <motion.div
                className="pack-spotlight pointer-events-none absolute inset-0 z-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45 }}
              />
            )}
          </AnimatePresence>

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/80">{selectedPack.label}</p>
            <h1 className="lobby-title-glow mt-1 font-display text-4xl font-black uppercase text-white sm:text-5xl">Open Rewards</h1>
            <p className="mt-2 text-sm text-slate-400">
              Costs {selectedPack.cost} coins. Reveals {selectedPack.size} cards.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {Object.values(packTypes).map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  disabled={phase === 'opening'}
                  onClick={() => setPackType(pack.id)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                    packType === pack.id
                      ? 'border-[#f5c518]/45 bg-[#f5c518]/12 text-[#f5c518] shadow-ember'
                      : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-300/35 hover:text-cyan-100'
                  } disabled:cursor-wait disabled:opacity-60`}
                >
                  {pack.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs font-bold text-cyan-100/65">{selectedPack.description}</p>
          </div>

          <div className="relative z-10 grid min-h-0 place-items-center">
            <div className="relative grid h-full min-h-[21rem] w-full max-w-5xl place-items-center">
              <div className="pack-ritual-ring" />
              <motion.div
                className="pack-object relative z-10 grid h-52 w-40 place-items-center rounded-[1.8rem] border border-[#f5c518]/45 bg-gradient-to-br from-[#f5c518]/20 via-violet-700/40 to-cyan-950/45 shadow-ember"
                animate={
                  phase === 'opening'
                    ? { rotate: [-2, 2, -3, 3, 0], scale: [1, 1.04, 1.18, 0.92], y: [0, -4, -22, 18], opacity: [1, 1, 0.92, 0.45] }
                    : { y: [0, -8, 0] }
                }
                transition={phase === 'opening' ? { duration: 0.9 } : { duration: 3, repeat: Infinity }}
              >
                <div className="absolute inset-4 rounded-[1.3rem] border border-white/10 bg-black/25" />
                <PackageOpen className="relative text-[#f5c518] drop-shadow-[0_0_18px_rgba(245,197,24,0.7)]" size={78} />
                <p className="absolute bottom-7 font-display text-2xl font-black uppercase text-white">{selectedPack.id}</p>
              </motion.div>

              <div className="absolute inset-x-0 top-3 z-20 flex justify-center">
                {cards.map((card, index) => (
                  <PackCard key={`${card.id}-${index}`} card={card} index={index} total={cards.length} revealed={revealedCount > index} />
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-30 min-h-20">
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
                {packResult?.duplicateRefund > 0 && (
                  <p className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#f5c518]">
                    Duplicate Refund +{packResult.duplicateRefund}
                  </p>
                )}
                {packResult?.pity && (
                  <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-violet-100">
                    Epic Pity {packResult.pity.epic}/8
                  </p>
                )}
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

function PackCard({ card, index, total, revealed }) {
  const style = rarityStyles[card.rarity] ?? rarityStyles.Unknown;
  const impact = rarityImpact[card.rarity] ?? rarityImpact.Unknown;
  const isPlaceholder = card.isPlaceholder;

  return (
    <motion.div
      className={`pack-reveal-card rarity-aura rarity-${card.rarity} absolute h-64 w-40 rounded-2xl border bg-slate-950 ${style}`}
      initial={{ opacity: 0, y: 120, scale: 0 }}
      animate={{
        opacity: 1,
        y: revealed ? -12 : 72,
        x: (index - (total - 1) / 2) * 174,
        scale: revealed ? [0.82, card.rarity === 'Epic' ? 1.13 : 1.1, 1] : 0.78,
      }}
      transition={{ duration: revealed ? 0.64 : 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="pack-card-inner"
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pack-card-face pack-card-back">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-[#f5c518]/30 bg-black/35 text-[#f5c518] shadow-ember">
            <Sparkles size={28} />
          </div>
          <p className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/55">Sealed</p>
        </div>

        <div className="pack-card-face pack-card-front flex flex-col p-2">
          <div className="relative h-36 overflow-hidden rounded-xl border border-white/10 bg-violet-950">
            <CardArtwork card={card} />
            <div className="pack-shimmer absolute inset-0" />
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/70">{card.rarity}</p>
              <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/80">
                Qty {card.quantity ?? 1}
              </span>
            </div>
            <h3 className="mt-1 font-display text-lg font-black leading-tight text-white">{isPlaceholder ? 'Mystery Reward' : card.name}</h3>
            {!isPlaceholder && (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {card.duplicate ? `Duplicate +${card.coinRefund ?? 0} coins` : card.race ?? card.species ?? 'Arcane Card'}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            className={`pack-impact pointer-events-none absolute inset-[-1.5rem] rounded-[2rem] ${impact}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 0], scale: [0.75, 1.16, 1.35] }}
            exit={{ opacity: 0 }}
            transition={{ duration: card.rarity === 'Common' ? 0.45 : 0.95, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {revealed && card.rarity === 'Legendary' && <LegendaryBurst />}
    </motion.div>
  );
}

function CardArtwork({ card }) {
  if (card.imageUrl) {
    return <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover object-top" />;
  }

  return (
    <div className="pack-fantasy-art relative h-full w-full overflow-hidden">
      <span className="absolute -left-10 top-4 h-28 w-28 rounded-full bg-[#f5c518]/25 blur-2xl" />
      <span className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
      <span className="absolute inset-7 rounded-full border border-[#f5c518]/20 shadow-[inset_0_0_28px_rgba(245,197,24,0.14)]" />
      <span className="absolute inset-x-6 bottom-8 h-20 rounded-full bg-black/30 blur-xl" />
    </div>
  );
}

function LegendaryBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {Array.from({ length: 14 }, (_, index) => (
        <span
          key={index}
          className="pack-burst-spark"
          style={{
            left: '50%',
            top: '50%',
            '--angle': `${index * 25.7}deg`,
            animationDelay: `${index * 0.025}s`,
          }}
        />
      ))}
    </div>
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
