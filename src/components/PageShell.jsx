import { Link, NavLink } from 'react-router-dom';
import { ChevronLeft, Gem, LibraryBig, Shield } from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Shield },
  { to: '/collection', label: 'Collection', icon: LibraryBig },
];

export default function PageShell({ children, showBack = false }) {
  return (
    <div className="fantasy-shell">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-amber-300/30 bg-slate-950/80 text-amber-200 shadow-ember transition group-hover:scale-105">
            <Gem size={20} />
          </span>
          <span className="font-display text-lg font-bold tracking-wide text-slate-100 sm:text-xl">
            Battle Card Game
          </span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 p-1 backdrop-blur md:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-100 shadow-arcane'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {showBack && (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-100"
          >
            <ChevronLeft size={16} />
            Back
          </Link>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
