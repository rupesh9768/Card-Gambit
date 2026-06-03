import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, CalendarCheck, ChevronRight, Coins, Gem, LibraryBig, LogOut, Shield, Sparkles, Swords, Trophy, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboard } from '../lib/api.js';

const fallbackPlayer = {
  name: 'NYRA',
  username: 'NYRA',
  rank: 'Novice Battler',
  title: 'Novice Battler',
  level: 27,
  xp: 0,
  xpToNextLevel: 2700,
  coins: 12850,
  cards: '8/23',
};

const navLinks = [
  { to: '/dashboard', label: 'Lobby' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/battle-deck', label: 'Battle Deck' },
  { to: '/packs', label: 'Packs' },
];

const battleModes = [
  {
    label: 'Play Rank',
    subtitle: 'Climb the ranked arena',
    icon: Shield,
    mode: 'ranked',
    tone: 'from-blue-500/95 via-violet-600/95 to-purple-950',
    glow: 'shadow-[0_0_34px_rgba(124,58,237,0.36)] hover:shadow-[0_0_46px_rgba(6,182,212,0.42)]',
  },
  {
    label: 'Play Classic',
    subtitle: 'Fast duel with standard rules',
    icon: Swords,
    mode: 'classic',
    tone: 'from-amber-500/95 via-orange-600/95 to-rose-950',
    glow: 'shadow-[0_0_34px_rgba(245,158,11,0.32)] hover:shadow-[0_0_46px_rgba(251,113,133,0.42)]',
  },
  {
    label: 'Play AI',
    subtitle: 'Practice against the arcane engine',
    icon: Bot,
    mode: 'ai',
    tone: 'from-emerald-400/95 via-teal-600/95 to-cyan-950',
    glow: 'shadow-[0_0_34px_rgba(20,184,166,0.32)] hover:shadow-[0_0_46px_rgba(52,211,153,0.42)]',
  },
];

const sparks = Array.from({ length: 26 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  bottom: `${(index * 19) % 90}%`,
  delay: `${(index % 9) * 0.55}s`,
  duration: `${5.5 + (index % 5) * 0.65}s`,
}));

const cardGhosts = [
  { left: '8%', top: '18%', delay: '0s', rotate: '-12deg' },
  { left: '26%', top: '72%', delay: '1.5s', rotate: '9deg' },
  { left: '72%', top: '12%', delay: '0.7s', rotate: '13deg' },
  { left: '86%', top: '66%', delay: '2.2s', rotate: '-8deg' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    getDashboard().then(setDashboard).catch(() => setDashboard(null));
  }, []);

  const livePlayer = dashboard?.player ?? fallbackPlayer;
  const collection = dashboard?.collection;

  function handleBattle(mode) {
    if (mode === 'ai') {
      navigate('/duel');
      return;
    }

    navigate('/duel');
  }

  return (
    <main className="lobby-screen">
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

      <div className="relative z-10 flex h-screen flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <motion.header
          className="flex h-16 shrink-0 items-center justify-between rounded-full border border-white/10 bg-black/25 px-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Link to="/" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-[#f5c518]/40 bg-[#f5c518]/10 text-[#f5c518] shadow-ember transition group-hover:scale-105">
              <Gem size={22} />
            </span>
            <span>
              <span className="lobby-title-glow block font-display text-xl font-black uppercase leading-none tracking-wide text-white">
                Card Gambit
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Lobby</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                    isActive
                      ? 'border border-[#f5c518]/40 bg-[#f5c518]/12 text-[#f5c518] shadow-ember'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-rose-300/25 bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-100 transition hover:border-rose-300/55 hover:shadow-[0_0_24px_rgba(244,63,94,0.28)]"
            >
              <LogOut className="mr-2 inline" size={14} />
              Logout
            </button>
          </nav>
        </motion.header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-5 py-5 lg:grid-cols-[0.9fr_1.35fr]">
          <PlayerProfile player={livePlayer} collection={collection} />
          <ArenaGate onBattle={handleBattle} />
        </section>
      </div>
    </main>
  );
}

function PlayerProfile({ player, collection }) {
  const name = (player.username ?? player.name ?? 'NYRA').toUpperCase();
  const rank = player.title ?? player.rank ?? 'Novice Battler';
  const level = player.level ?? 1;
  const xp = player.xp ?? 0;
  const xpToNextLevel = player.xpToNextLevel ?? level * 100;
  const xpPercent = Math.min(100, Math.round((xp / xpToNextLevel) * 100));
  const cardCount = collection ? `${collection.collected}/${collection.total}` : player.cards;

  return (
    <motion.aside
      className="lobby-glass relative min-h-0 overflow-hidden rounded-3xl p-5"
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" />

      <p className="relative text-xs font-black uppercase tracking-[0.28em] text-[#f5c518]">Player Profile</p>
      <div className="relative mt-5 flex items-center gap-5">
        <div className="lobby-portrait grid h-32 w-32 shrink-0 place-items-center border border-[#f5c518]/60 bg-gradient-to-br from-[#f5c518]/30 via-violet-600/30 to-cyan-400/25">
          <UserRound className="text-amber-100 drop-shadow-[0_0_18px_rgba(245,197,24,0.65)]" size={64} />
        </div>

        <div className="min-w-0">
          <h1 className="lobby-title-glow font-display text-5xl font-black leading-none text-white">{name}</h1>
          <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-cyan-100/80">{rank}</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full border border-[#f5c518]/30 bg-black/35">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#f5c518] via-cyan-300 to-violet-400"
              initial={{ width: '0%' }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ delay: 0.45, duration: 0.9, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            XP {xp} / {xpToNextLevel}
          </p>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-3">
        <StatTile icon={Trophy} label="Level" value={level} tone="text-violet-200" />
        <StatTile icon={Coins} label="Coins" value={Number(player.coins ?? 0).toLocaleString()} tone="text-[#f5c518]" />
        <StatTile icon={LibraryBig} label="Cards" value={cardCount} tone="text-cyan-200" badge={`${cardCount} collected`} />
      </div>

      <ProgressionPanel player={player} />
    </motion.aside>
  );
}

function ProgressionPanel({ player }) {
  const quests = player.dailyQuests ?? [];
  const nextMilestone = player.nextMilestone;

  return (
    <div className="relative mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/75">
          <CalendarCheck size={14} />
          Daily Quests
        </span>
        {nextMilestone && (
          <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#f5c518]">
            Lv {nextMilestone.level}: +{nextMilestone.coins} coins
          </span>
        )}
      </div>

      <div className="grid gap-2">
        {quests.slice(0, 3).map((quest) => {
          const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));

          return (
            <div key={quest.id} className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-slate-200">{quest.label}</p>
                <p className="text-[9px] font-black text-[#f5c518]">
                  +{quest.xpReward} XP / +{quest.coinsReward}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/35">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-[#f5c518]"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.55 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone, badge }) {
  return (
    <motion.div
      className="group relative rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-center backdrop-blur"
      whileHover={{ y: -5, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/30 shadow-ember">
        <Icon className={tone} size={21} />
      </span>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 font-display text-xl font-black text-white">{value}</p>
      {badge && (
        <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-300/35 bg-cyan-950/90 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100 opacity-0 shadow-frost transition group-hover:opacity-100">
          {badge}
        </span>
      )}
    </motion.div>
  );
}

function ArenaGate({ onBattle }) {
  return (
    <motion.section
      className="lobby-glass relative min-h-0 overflow-hidden rounded-3xl p-5"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay: 0.08 }}
    >
      <div className="absolute -right-12 -top-20 h-60 w-60 rounded-full bg-[#f5c518]/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/75">Arena Gate</p>
          <h2 className="lobby-title-glow mt-1 font-display text-4xl font-black text-white">Choose Battle</h2>
        </div>
        <Sparkles className="text-[#f5c518] drop-shadow-[0_0_18px_rgba(245,197,24,0.65)]" size={30} />
      </div>

      <div className="relative mt-5 grid gap-3">
        {battleModes.map((mode, index) => (
          <BattleButton key={mode.label} mode={mode} index={index} onClick={() => onBattle(mode.mode)} />
        ))}
      </div>
    </motion.section>
  );
}

function BattleButton({ mode, index, onClick }) {
  const Icon = mode.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`battle-card-panel group relative min-h-[5.65rem] overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r ${mode.tone} p-3 text-left ring-1 ring-white/10 ${mode.glow}`}
      initial={{ opacity: 0, x: 36 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.18 + index * 0.1 }}
      whileHover={{ y: -3, scale: 1.012 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="absolute left-0 top-0 h-full w-1 bg-white/45 shadow-[0_0_18px_rgba(255,255,255,0.55)]" />
      <span className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-white/18 blur-2xl transition group-hover:scale-125" />
      <div className="relative z-10 flex h-full items-center justify-between gap-4">
        <span className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-black/30 text-white shadow-2xl transition group-hover:scale-110 group-hover:rotate-3">
            <Icon size={25} />
          </span>
          <span>
            <span className="block font-display text-2xl font-black uppercase leading-none text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.3)]">
              {mode.label}
            </span>
            <span className="mt-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-white/72">{mode.subtitle}</span>
          </span>
        </span>
        <ChevronRight className="text-white/75 transition group-hover:translate-x-2 group-hover:text-white" size={30} />
      </div>
    </motion.button>
  );
}
