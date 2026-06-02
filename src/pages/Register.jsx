import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { AuthInput, AuthScreen } from './Login.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { registerUser } from '../lib/api.js';

export default function Register() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await registerUser(form);
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen eyebrow="Create Player" title="Join Card Gambit">
      <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
        <AuthInput
          label="Username"
          value={form.username}
          onChange={(username) => setForm((current) => ({ ...current, username }))}
        />
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
          className="battle-card-panel mt-2 inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#f5c518]/35 bg-gradient-to-r from-cyan-300 via-[#f5c518] to-violet-400 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-ember disabled:cursor-wait disabled:opacity-70"
          whileHover={!submitting ? { y: -2, scale: 1.02 } : undefined}
          whileTap={!submitting ? { scale: 0.97 } : undefined}
        >
          <UserPlus size={18} />
          {submitting ? 'Creating...' : 'Register'}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-black text-[#f5c518] transition hover:text-amber-200">
          Login
        </Link>
      </p>
    </AuthScreen>
  );
}
