import { Link, NavLink } from 'react-router-dom';
import { ChevronLeft, Gem, LibraryBig, LogOut, PackageOpen, Shield, Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const sparks = Array.from({ length: 22 }, (_, index) => ({
  left: `${(index * 41) % 100}%`,
  bottom: `${(index * 23) % 90}%`,
  delay: `${(index % 8) * 0.5}s`,
  duration: `${5.5 + (index % 5) * 0.7}s`,
}));

const cardGhosts = [
  { left: '7%', top: '16%', delay: '0s', rotate: '-12deg' },
  { left: '86%', top: '18%', delay: '1.4s', rotate: '10deg' },
  { left: '18%', top: '74%', delay: '2.1s', rotate: '8deg' },
  { left: '78%', top: '70%', delay: '0.8s', rotate: '-9deg' },
];

const links = [
  { to: '/dashboard', label: 'Lobby', icon: Shield },
  { to: '/inventory', label: 'Inventory', icon: LibraryBig },
  { to: '/battle-deck', label: 'Battle Deck', icon: Swords },
  { to: '/packs', label: 'Packs', icon: PackageOpen },
];

export default function PageShell({ children, showBack = false }) {
  const { logout } = useAuth();

  return (
    <div className="theme-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
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

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-[#f5c518]/40 bg-[#f5c518]/10 text-[#f5c518] shadow-ember transition group-hover:scale-105">
            <Gem size={20} />
          </span>
          <span>
            <span className="lobby-title-glow block font-display text-lg font-black uppercase leading-none tracking-wide text-slate-100 sm:text-xl">
              Card Gambit
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Lobby System</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/25 p-1 shadow-2xl shadow-black/30 backdrop-blur-xl md:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'border border-[#f5c518]/40 bg-[#f5c518]/12 text-[#f5c518] shadow-ember'
                    : 'text-slate-300 hover:bg-white/8 hover:text-slate-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {showBack && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-300/55 hover:shadow-frost"
            >
              <ChevronLeft size={16} />
              Lobby
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-100 transition hover:border-rose-300/55 hover:shadow-[0_0_24px_rgba(244,63,94,0.28)]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
