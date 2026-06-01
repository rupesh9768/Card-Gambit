import { Link } from 'react-router-dom';
import { Flame, Play, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="fantasy-shell flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10 bg-violet-500/5 blur-sm" />
      <div className="absolute left-[12%] top-[18%] hidden h-24 w-24 rounded-full border border-amber-300/15 bg-amber-300/10 blur-xl md:block" />
      <div className="absolute bottom-[16%] right-[14%] hidden h-28 w-28 rounded-full border border-sky-300/15 bg-sky-300/10 blur-xl md:block" />

      <section className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full border border-amber-300/30 bg-slate-950/70 shadow-ember animate-float">
          <Flame className="text-amber-200" size={42} />
        </div>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-violet-100">
          <Sparkles size={14} />
          Arcane Arena
        </p>
        <h1 className="font-display text-5xl font-black leading-tight text-slate-50 sm:text-7xl lg:text-8xl">
          Card Gambit
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Command legendary champions, forge a deck of monsters and myth, and prepare for turn-based battles in the shadow realm.
        </p>
        <Link
          to="/dashboard"
          className="mt-10 inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-8 py-4 text-base font-black uppercase tracking-[0.14em] text-slate-950 shadow-ember transition hover:scale-105 hover:shadow-[0_0_42px_rgba(245,158,11,0.42)] active:scale-95"
        >
          <Play size={20} fill="currentColor" />
          Start Game
        </Link>
      </section>
    </main>
  );
}
