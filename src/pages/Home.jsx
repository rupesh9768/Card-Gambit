import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Play, Sparkles } from 'lucide-react';

const sparks = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  bottom: `${(index * 19) % 90}%`,
  delay: `${(index % 9) * 0.55}s`,
  duration: `${5.5 + (index % 5) * 0.65}s`,
}));

const cardGhosts = [
  { left: '9%', top: '20%', delay: '0s', rotate: '-12deg' },
  { left: '82%', top: '18%', delay: '1.5s', rotate: '12deg' },
  { left: '18%', top: '74%', delay: '0.7s', rotate: '8deg' },
  { left: '76%', top: '70%', delay: '2.2s', rotate: '-8deg' },
];

export default function Home() {
  return (
    <main className="lobby-screen flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {cardGhosts.map((card, index) => (
          <span
            key={index}
            className="lobby-card-ghost"
            style={{ left: card.left, top: card.top, animationDelay: card.delay, rotate: card.rotate }}
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

      <motion.section
        className="lobby-glass relative z-10 mx-auto max-w-5xl overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-10"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55 }}
      >
        <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" />

        <motion.div
          className="relative mx-auto mb-8 grid h-28 w-28 place-items-center rounded-full border border-[#f5c518]/45 bg-[#f5c518]/10 text-[#f5c518] shadow-ember"
          animate={{ y: [0, -10, 0], boxShadow: ['0 0 24px rgba(245,197,24,0.25)', '0 0 48px rgba(245,197,24,0.48)', '0 0 24px rgba(245,197,24,0.25)'] }}
          transition={{ duration: 3.2, repeat: Infinity }}
        >
          <Flame size={48} />
        </motion.div>

        <p className="relative mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
          <Sparkles size={14} />
          Arcane Arena
        </p>
        <h1 className="lobby-title-glow relative font-display text-5xl font-black uppercase leading-tight text-white sm:text-7xl lg:text-8xl">
          Card Gambit
        </h1>
        <p className="relative mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Command legendary champions, collect radiant cards, and clash through a stylized anime battle arena.
        </p>
        <motion.div className="relative mt-10" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
          <Link
            to="/dashboard"
            className="battle-card-panel inline-flex min-h-0 items-center justify-center gap-3 overflow-hidden rounded-full border border-[#f5c518]/40 bg-gradient-to-r from-[#f5c518] via-orange-400 to-violet-500 px-8 py-4 text-base font-black uppercase tracking-[0.14em] text-slate-950 shadow-ember"
          >
            <Play size={20} fill="currentColor" />
            Start Game
          </Link>
        </motion.div>
      </motion.section>
    </main>
  );
}
