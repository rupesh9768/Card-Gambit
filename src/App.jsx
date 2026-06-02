import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Collection from './pages/Collection.jsx';
import BattleDeck from './pages/BattleDeck.jsx';
import DuelPage from './pages/DuelPage.jsx';
import PacksPage from './pages/PacksPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function protectedPage(page) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
      <Route path="/lobby" element={<Navigate to="/dashboard" replace />} />
      <Route path="/inventory" element={protectedPage(<Collection />)} />
      <Route path="/collection" element={<Navigate to="/inventory" replace />} />
      <Route path="/battle-deck" element={protectedPage(<BattleDeck />)} />
      <Route path="/packs" element={protectedPage(<PacksPage />)} />
      <Route path="/duel" element={protectedPage(<DuelPage />)} />
      <Route path="/battle/ai" element={<Navigate to="/duel" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
