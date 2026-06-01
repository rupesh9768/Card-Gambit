import { Lock, Sparkles } from 'lucide-react';

const rarityStyles = {
  Common: 'border-slate-400/45 shadow-slate-900/50',
  Rare: 'border-sky-300/70 shadow-sky-500/25',
  Epic: 'border-violet-300/75 shadow-violet-500/30',
  Legendary: 'border-amber-300/80 shadow-amber-500/35',
  Unknown: 'border-fuchsia-300/80 shadow-fuchsia-500/35',
};

const sizeStyles = {
  opponent: 'duel-card-size-opponent',
  hand: 'duel-card-size-hand',
  arena: 'duel-card-size-arena',
};

const imageHeights = {
  opponent: 'h-[48%]',
  hand: 'h-[44%]',
  arena: 'h-[49%]',
};

export default function BattleCard({
  card,
  hidden = false,
  rating,
  used = false,
  selected = false,
  onClick,
  variant = 'hand',
  className = '',
  style,
}) {
  const isClickable = Boolean(onClick) && !used;
  const rarityClass = rarityStyles[card?.rarity] ?? rarityStyles.Unknown;
  const compact = variant === 'opponent';
  const showAbility = variant === 'arena';

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => onClick?.(card)}
      style={style}
      className={`group relative shrink-0 overflow-hidden rounded-[1.05rem] border p-2 text-left shadow-2xl transition duration-300 [transform-origin:center_bottom] [transform-style:preserve-3d] ${
        sizeStyles[variant] ?? sizeStyles.hand
      } ${
        selected ? 'border-amber-200 bg-amber-300/10 shadow-ember' : `${rarityClass} bg-slate-950/85`
      } ${isClickable ? 'cursor-pointer hover:shadow-ember active:scale-[0.98]' : 'cursor-default'} ${
        used && variant === 'hand' ? 'opacity-40 grayscale' : ''
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1rem] bg-gradient-to-br from-white/12 via-transparent to-black/35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <div className="pointer-events-none absolute -inset-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_42%)] opacity-0 transition group-hover:opacity-100" />

      {hidden ? (
        <div className="duel-card-back grid h-full place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950">
          <div className="text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 sm:h-12 sm:w-12">
              <Lock className="text-slate-400" size={compact ? 18 : 24} />
            </div>
            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Hidden</p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-1 flex items-center justify-between gap-1">
            <p className="truncate text-[8px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[9px]">
              {card.species}
            </p>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold text-slate-300 sm:text-[9px]">
              {card.rarity}
            </span>
          </div>

          <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950 ${imageHeights[variant] ?? imageHeights.hand}`}>
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover object-top transition group-hover:scale-105" />
            ) : (
              <span className="font-display text-3xl font-black text-slate-500 sm:text-4xl">{card.name.charAt(0)}</span>
            )}
          </div>

          <div className="mt-1.5 min-h-0">
            <h3 className={`font-display font-black leading-tight text-slate-50 ${compact ? 'truncate text-xs' : 'text-sm sm:text-base'}`}>
              {card.name}
            </h3>
            {showAbility && <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{card.ability}</p>}
          </div>

          <div className={`mt-auto grid grid-cols-3 gap-1 text-center ${compact ? 'hidden' : ''}`}>
            <MiniStat label="ATK" value={card.attack} />
            <MiniStat label="DEF" value={card.defense} />
            <MiniStat label="HP" value={card.health} />
          </div>

          {rating !== undefined && (
            <div className="mt-1.5 flex items-center justify-center gap-1 rounded-lg border border-amber-300/25 bg-amber-400/10 px-2 py-1.5 text-amber-100">
              <Sparkles size={13} />
              <span className="text-[10px] font-black uppercase tracking-[0.16em]">Rating {rating}</span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.05] px-1 py-0.5">
      <p className="text-[7px] font-bold uppercase tracking-widest text-slate-500 sm:text-[8px]">{label}</p>
      <p className="text-[11px] font-black text-slate-100 sm:text-xs">{value}</p>
    </div>
  );
}
