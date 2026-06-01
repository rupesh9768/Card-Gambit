import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Coins, Crown, LibraryBig, Shield, Sparkles, Swords, Trophy } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import { getDashboard, startGame } from '../lib/api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch(() => setError('Backend is not connected.'));
  }, []);

  const player = dashboard?.player;
  const collection = dashboard?.collection;

  async function handlePlay(mode) {
    if (mode === 'ai') {
      navigate('/duel');
      return;
    }

    setStatus('Preparing arena...');
    try {
      const result = await startGame(mode);
      setStatus(result.message);
    } catch {
      setStatus('Battle server is not ready yet.');
    }
  }

  return (
    <PageShell>
      <section className="mx-auto grid max-w-6xl gap-5 py-4 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="glass-panel animate-fadeUp rounded-xl p-5">
          <div className="relative overflow-hidden rounded-lg border border-amber-300/20 bg-gradient-to-br from-amber-500/15 via-slate-950 to-violet-950/50 p-5">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border border-amber-300/35 bg-black/30 shadow-ember animate-softPulse">
                <Crown className="text-amber-200" size={38} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">Champion</p>
                <h1 className="mt-1 font-display text-4xl font-black text-slate-50">{player?.username ?? 'Loading'}</h1>
                <p className="text-sm font-semibold text-slate-400">{player?.title ?? 'Connecting...'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <InfoTile icon={Trophy} label="Level" value={player?.level ?? '-'} tone="text-violet-200" />
            <InfoTile icon={Coins} label="Coins" value={player ? player.coins.toLocaleString() : '-'} tone="text-amber-200" />
            <InfoTile icon={LibraryBig} label="Cards" value={collection ? `${collection.collected}/${collection.total}` : '-'} tone="text-sky-200" />
          </div>

          {error && <p className="mt-4 rounded-lg border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>}
        </aside>

        <section className="grid gap-5">
          <div className="animate-fadeUp rounded-xl border border-white/10 bg-slate-950/55 p-5 shadow-xl shadow-black/30 [animation-delay:80ms]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Arena Gate</p>
                <h2 className="mt-1 font-display text-3xl font-black text-slate-50">Choose Battle</h2>
              </div>
              <Sparkles className="text-amber-200" size={26} />
            </div>

            <div className="grid gap-4">
              <PlayButton icon={Shield} label="Play Rank" subtitle="Climb the ladder" tone="from-violet-500 via-indigo-500 to-sky-500" onClick={() => handlePlay('ranked')} />
              <PlayButton icon={Swords} label="Play Classic" subtitle="Fast casual match" tone="from-amber-400 via-orange-500 to-rose-500" onClick={() => handlePlay('classic')} />
              <PlayButton icon={Bot} label="Play AI" subtitle="Practice your deck" tone="from-emerald-400 via-teal-500 to-sky-500" onClick={() => handlePlay('ai')} />
            </div>

            {status && (
              <p className="mt-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-semibold text-slate-300 animate-fadeUp">
                {status}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MenuLink to="/inventory" icon={LibraryBig} label="Inventory" detail="Cards and locks" tone="hover:border-sky-300/40 hover:shadow-frost" />
            <MenuLink to="/battle-deck" icon={Swords} label="Battle Deck" detail="Manage 5 cards" tone="hover:border-amber-300/40 hover:shadow-ember" />
          </div>
        </section>
      </section>
    </PageShell>
  );
}

function InfoTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-center transition hover:-translate-y-0.5 hover:bg-white/[0.075]">
      <Icon className={`mx-auto ${tone}`} size={18} />
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-100">{value}</p>
    </div>
  );
}

function PlayButton({ icon: Icon, label, subtitle, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`game-button group flex min-h-20 items-center justify-between rounded-xl border border-white/15 bg-gradient-to-r ${tone} px-5 py-4 text-left shadow-xl shadow-black/35 transition duration-300 hover:-translate-y-1 hover:shadow-ember active:translate-y-0 active:scale-[0.98]`}
    >
      <span className="relative flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950/45 text-white ring-1 ring-white/20 transition group-hover:scale-110">
          <Icon size={24} />
        </span>
        <span>
          <span className="block font-display text-2xl font-black leading-none text-white">{label}</span>
          <span className="mt-1 block text-xs font-bold uppercase tracking-[0.2em] text-white/70">{subtitle}</span>
        </span>
      </span>
      <span className="relative text-2xl font-black text-white/70 transition group-hover:translate-x-1 group-hover:text-white">
        {'>'}
      </span>
    </button>
  );
}

function MenuLink({ to, icon: Icon, label, detail, tone }) {
  return (
    <Link
      to={to}
      className={`glass-panel group flex animate-fadeUp items-center justify-between rounded-xl px-5 py-4 transition hover:-translate-y-0.5 ${tone}`}
    >
      <span className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-100 transition group-hover:scale-110">
          <Icon size={20} />
        </span>
        <span>
          <span className="block font-bold text-slate-100">{label}</span>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{detail}</span>
        </span>
      </span>
      <span className="text-sm font-black text-slate-500 transition group-hover:text-slate-200">{'>'}</span>
    </Link>
  );
}
