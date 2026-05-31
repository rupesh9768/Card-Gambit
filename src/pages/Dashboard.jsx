import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Coins, Crown, LibraryBig, Shield, Swords, Trophy } from 'lucide-react';
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
      <section className="mx-auto grid max-w-4xl gap-6 py-4">
        <div className="glass-panel animate-fadeUp rounded-lg p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-amber-300/25 bg-amber-500/10 shadow-ember animate-softPulse">
                <Crown className="text-amber-200" size={30} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Player Details</p>
                <h1 className="mt-1 font-display text-3xl font-black text-slate-50">{player?.username ?? 'Loading'}</h1>
                <p className="text-sm text-slate-400">{player?.title ?? 'Connecting...'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:w-80">
              <InfoTile icon={Trophy} label="Level" value={player?.level ?? '-'} tone="text-violet-200" />
              <InfoTile icon={Coins} label="Coins" value={player ? player.coins.toLocaleString() : '-'} tone="text-amber-200" />
              <InfoTile
                icon={LibraryBig}
                label="Cards"
                value={collection ? `${collection.collected}/${collection.total}` : '-'}
                tone="text-sky-200"
              />
            </div>
          </div>
          {error && <p className="mt-4 text-sm font-semibold text-rose-200">{error}</p>}
        </div>

        <div className="animate-fadeUp rounded-lg border border-white/10 bg-slate-950/45 p-5 shadow-xl shadow-black/25 [animation-delay:90ms]">
          <p className="text-center text-xs font-bold uppercase tracking-[0.28em] text-slate-500">Choose Battle</p>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <PlayButton
              icon={Shield}
              label="Play Rank"
              subtitle="Competitive"
              tone="from-violet-500 via-indigo-500 to-sky-500"
              onClick={() => handlePlay('ranked')}
            />
            <PlayButton
              icon={Swords}
              label="Play Classic"
              subtitle="Casual"
              tone="from-amber-400 via-orange-500 to-rose-500"
              onClick={() => handlePlay('classic')}
            />
            <PlayButton
              icon={Bot}
              label="Play AI"
              subtitle="Practice"
              tone="from-emerald-400 via-teal-500 to-sky-500"
              onClick={() => handlePlay('ai')}
            />
          </div>

          {status && (
            <p className="mt-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-semibold text-slate-300 animate-fadeUp">
              {status}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
          to="/inventory"
          className="glass-panel group flex animate-fadeUp items-center justify-between rounded-full px-5 py-4 transition hover:-translate-y-0.5 hover:border-sky-300/40 hover:shadow-frost [animation-delay:160ms]"
        >
          <span className="flex items-center gap-3 font-bold text-slate-100">
            <LibraryBig className="text-sky-200 transition group-hover:scale-110" size={20} />
            Inventory
          </span>
          <span className="text-sm font-bold text-slate-500 transition group-hover:text-slate-200">Owned Cards</span>
        </Link>

          <Link
            to="/battle-deck"
            className="glass-panel group flex animate-fadeUp items-center justify-between rounded-full px-5 py-4 transition hover:-translate-y-0.5 hover:border-amber-300/40 hover:shadow-ember [animation-delay:210ms]"
          >
            <span className="flex items-center gap-3 font-bold text-slate-100">
              <Swords className="text-amber-200 transition group-hover:scale-110" size={20} />
              Battle Deck
            </span>
            <span className="text-sm font-bold text-slate-500 transition group-hover:text-slate-200">5 Cards</span>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function InfoTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-center transition hover:-translate-y-0.5 hover:bg-white/[0.07]">
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
      className={`game-button group flex min-h-20 items-center justify-between rounded-full border border-white/15 bg-gradient-to-r ${tone} px-5 py-4 text-left shadow-xl shadow-black/35 transition duration-300 hover:-translate-y-1 hover:shadow-ember active:translate-y-0 active:scale-[0.98]`}
    >
      <span className="relative flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-950/45 text-white ring-1 ring-white/20 transition group-hover:scale-110">
          <Icon size={24} />
        </span>
        <span>
          <span className="block font-display text-2xl font-black leading-none text-white">{label}</span>
          <span className="mt-1 block text-xs font-bold uppercase tracking-[0.2em] text-white/70">{subtitle}</span>
        </span>
      </span>
      <span className="relative hidden text-2xl font-black text-white/70 transition group-hover:translate-x-1 group-hover:text-white sm:block">
        {'>'}
      </span>
    </button>
  );
}
