import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Collection from './pages/Collection.jsx';
import BattleDeck from './pages/BattleDeck.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inventory" element={<Collection />} />
      <Route path="/collection" element={<Navigate to="/inventory" replace />} />
      <Route path="/battle-deck" element={<BattleDeck />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
