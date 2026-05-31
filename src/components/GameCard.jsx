import { useState } from 'react';
import { Heart, Lock, Shield, Swords } from 'lucide-react';

const rarityStyles = {
  Common: {
    border: 'border-slate-400/45',
    text: 'text-slate-200',
    glow: 'hover:shadow-[0_0_28px_rgba(148,163,184,0.28)]',
    badge: 'bg-slate-500/15 text-slate-100 ring-slate-300/20',
    art: 'from-slate-500/20 via-slate-950 to-slate-900',
  },
  Rare: {
    border: 'border-sky-400/60',
    text: 'text-sky-200',
    glow: 'hover:shadow-frost',
    badge: 'bg-sky-500/15 text-sky-100 ring-sky-300/25',
    art: 'from-sky-400/25 via-slate-950 to-blue-950',
  },
  Epic: {
    border: 'border-violet-400/70',
    text: 'text-violet-200',
    glow: 'hover:shadow-arcane',
    badge: 'bg-violet-500/15 text-violet-100 ring-violet-300/25',
    art: 'from-violet-400/25 via-slate-950 to-fuchsia-950',
  },
  Legendary: {
    border: 'border-amber-300/80',
    text: 'text-amber-200',
    glow: 'hover:shadow-ember',
    badge: 'bg-amber-500/15 text-amber-100 ring-amber-300/30',
    art: 'from-amber-300/30 via-slate-950 to-rose-950',
  },
  Unknown: {
    border: 'border-fuchsia-300/60',
    text: 'text-fuchsia-200',
    glow: 'hover:shadow-[0_0_30px_rgba(217,70,239,0.34)]',
    badge: 'bg-fuchsia-500/15 text-fuchsia-100 ring-fuchsia-300/25',
    art: 'from-fuchsia-400/25 via-slate-950 to-indigo-950',
  },
};

export default function GameCard({ card, size = 'normal' }) {
  const [flipped, setFlipped] = useState(false);
  const styles = rarityStyles[card.rarity] ?? rarityStyles.Unknown;
  const collected = card.collected;
  const heightClass = size === 'compact' ? 'h-[26rem]' : 'h-[31rem]';
  const artHeightClass = size === 'compact' ? 'h-64' : 'h-80';

  function handleClick() {
    if (collected) {
      setFlipped((current) => !current);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!collected}
      className={`group ${heightClass} w-full rounded-xl text-left transition duration-300 [perspective:1200px] ${
        collected ? `cursor-pointer hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98] ${styles.glow}` : 'cursor-not-allowed opacity-55 grayscale transition hover:opacity-65'
      }`}
      aria-label={collected ? `${card.name} card` : 'Locked card'}
    >
      <div
        className={`relative h-full w-full rounded-xl transition duration-700 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <CardFront card={card} styles={styles} collected={collected} artHeightClass={artHeightClass} />
        <CardBack card={card} styles={styles} />
      </div>
    </button>
  );
}

function CardFront({ card, styles, collected, artHeightClass }) {
  return (
    <div className={`absolute inset-0 overflow-hidden rounded-xl border ${styles.border} bg-slate-950 p-4 shadow-xl shadow-black/35 [backface-visibility:hidden]`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-70" />
      <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
        <span>{collected ? card.species : 'Unknown'}</span>
        <span>{collected ? card.ability : 'Hidden'}</span>
      </div>

      <div className={`relative grid ${artHeightClass} place-items-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${styles.art}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.15),transparent_34%)]" />
        <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:translate-x-[320%] group-hover:opacity-100 group-hover:duration-700" />
        {collected && card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
          />
        ) : collected ? (
          <div className="rune-ring grid h-28 w-28 place-items-center rounded-full animate-pulseGlow">
            <span className={`font-display text-5xl font-black ${styles.text}`}>{card.name.charAt(0)}</span>
          </div>
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-black/35">
            <Lock className="text-slate-500" size={34} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold leading-tight text-slate-50">
            {collected ? card.name : 'Locked Card'}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {collected ? card.race : 'Not Collected'}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${styles.badge}`}>
          {collected ? card.rarity : 'Locked'}
        </span>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {collected ? 'Click to flip' : 'Find this card to unlock it'}
      </p>
    </div>
  );
}

function CardBack({ card, styles }) {
  return (
    <div className={`absolute inset-0 overflow-hidden rounded-xl border ${styles.border} bg-slate-950/95 p-4 shadow-xl shadow-black/35 [backface-visibility:hidden] [transform:rotateY(180deg)]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.18),transparent_36%)]" />
      <div className="relative flex h-full flex-col">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Card Details</p>
          <h3 className="mt-2 font-display text-2xl font-black text-slate-50">{card.name}</h3>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {card.species} / {card.race}
          </p>
        </div>

        <div className="my-6 grid flex-1 place-items-center rounded-lg border border-white/10 bg-white/[0.035]">
          <div className="grid gap-4 text-center">
            <span className={`mx-auto rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ring-1 ${styles.badge}`}>
              {card.rarity}
            </span>
            <p className="max-w-48 text-sm leading-6 text-slate-400">
              Ability: <span className="font-bold text-slate-200">{card.ability}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Swords} label="ATK" value={card.attack} tone="text-rose-200" />
          <Stat icon={Shield} label="DEF" value={card.defense} tone="text-sky-200" />
          <Stat icon={Heart} label="HP" value={card.health} tone="text-emerald-200" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-3 text-center">
      <Icon className={`mx-auto mb-1 ${tone}`} size={17} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-lg font-black text-slate-100">{value}</p>
    </div>
  );
}
