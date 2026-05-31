import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Crown, LibraryBig, Shield, Swords, Trophy } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import { getDashboard, startGame } from '../lib/api.js';

export default function Dashboard() {
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
    setStatus('Finding battle...');
    try {
      const result = await startGame(mode);
      setStatus(result.message);
    } catch {
      setStatus('Battle server is not ready yet.');
    }
  }

  return (
    <PageShell>
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full border border-amber-300/25 bg-amber-500/10 shadow-ember">
              <Crown className="text-amber-200" size={36} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Player Details</p>
              <h1 className="mt-2 font-display text-3xl font-black text-slate-50">{player?.username ?? 'Loading'}</h1>
              <p className="text-sm text-slate-400">{player?.title ?? 'Connecting...'}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <InfoTile icon={Trophy} label="Level" value={player?.level ?? '-'} tone="text-violet-200" />
            <InfoTile icon={Coins} label="Coins" value={player ? player.coins.toLocaleString() : '-'} tone="text-amber-200" />
            <InfoTile
              icon={LibraryBig}
              label="Cards"
              value={collection ? `${collection.collected} / ${collection.total}` : '-'}
              tone="text-sky-200"
            />
          </div>
          {error && <p className="mt-4 text-sm font-semibold text-rose-200">{error}</p>}
        </div>

        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <PlayButton
              icon={Shield}
              label="Play Rank"
              subtitle="Competitive"
              tone="from-violet-500/25 to-sky-500/10"
              onClick={() => handlePlay('ranked')}
            />
            <PlayButton
              icon={Swords}
              label="Play Classic"
              subtitle="Casual battle"
              tone="from-amber-500/25 to-rose-500/10"
              onClick={() => handlePlay('classic')}
            />
          </div>
          {status && <p className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300">{status}</p>}

          <Link
            to="/collection"
            className="glass-panel group flex items-center justify-between rounded-lg px-5 py-4 transition hover:-translate-y-0.5 hover:border-sky-300/40 hover:shadow-frost"
          >
            <span className="flex items-center gap-3 font-bold text-slate-100">
              <LibraryBig className="text-sky-200" size={20} />
              Collection
            </span>
            <span className="text-sm font-bold text-slate-500 transition group-hover:text-slate-200">View Cards</span>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function InfoTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <Icon className={tone} size={22} />
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-100">{value}</p>
    </div>
  );
}

function PlayButton({ icon: Icon, label, subtitle, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-48 rounded-lg border border-white/10 bg-gradient-to-br ${tone} p-6 text-left shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-ember active:scale-[0.98]`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-slate-950/50 text-amber-100 transition group-hover:scale-110">
        <Icon size={24} />
      </span>
      <span className="mt-8 block font-display text-3xl font-black text-slate-50">{label}</span>
      <span className="mt-2 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{subtitle}</span>
    </button>
  );
}
