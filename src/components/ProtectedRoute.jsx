import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="lobby-screen grid place-items-center px-4 text-center">
        <div className="lobby-glass rounded-3xl p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/80">Card Gambit</p>
          <p className="lobby-title-glow mt-2 font-display text-3xl font-black text-white">Loading Session</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
