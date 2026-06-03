import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gem, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const redirectTo = location.state?.from?.pathname ?? '/dashboard';

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const user = await login(form);
      navigate(user.needsStarterPack ? '/starter-pack' : redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen eyebrow="Player Login" title="Enter The Lobby">
      <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
        <AuthInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(email) => setForm((current) => ({ ...current, email }))}
        />
        <AuthInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(password) => setForm((current) => ({ ...current, password }))}
        />
        {error && <p className="rounded-xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">{error}</p>}
        <motion.button
          type="submit"
          disabled={submitting}
          className="battle-card-panel mt-2 inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#f5c518]/35 bg-gradient-to-r from-[#f5c518] via-orange-300 to-cyan-300 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-ember disabled:cursor-wait disabled:opacity-70"
          whileHover={!submitting ? { y: -2, scale: 1.02 } : undefined}
          whileTap={!submitting ? { scale: 0.97 } : undefined}
        >
          <LogIn size={18} />
          {submitting ? 'Logging In...' : 'Login'}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        New to Card Gambit?{' '}
        <Link to="/register" className="font-black text-[#f5c518] transition hover:text-amber-200">
          Create account
        </Link>
      </p>
    </AuthScreen>
  );
}

export function AuthScreen({ eyebrow, title, children }) {
  return (
    <main className="lobby-screen grid place-items-center px-4 py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 22 }, (_, index) => (
          <span
            key={index}
            className="lobby-spark"
            style={{
              left: `${(index * 41) % 100}%`,
              bottom: `${(index * 23) % 90}%`,
              animationDelay: `${(index % 8) * 0.5}s`,
            }}
          />
        ))}
      </div>

      <motion.section
        className="lobby-glass relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] p-7"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#f5c518]/15 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-[#f5c518]/40 bg-[#f5c518]/10 text-[#f5c518] shadow-ember">
            <Gem size={23} />
          </span>
          <span>
            <span className="lobby-title-glow block font-display text-xl font-black uppercase leading-none text-white">
              Card Gambit
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">{eyebrow}</span>
          </span>
        </Link>

        <h1 className="lobby-title-glow relative mt-8 font-display text-4xl font-black uppercase text-white">{title}</h1>
        {children}
      </motion.section>
    </main>
  );
}

export function AuthInput({ label, type = 'text', value, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/75">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-[#f5c518]/50 focus:shadow-ember"
      />
    </label>
  );
}
