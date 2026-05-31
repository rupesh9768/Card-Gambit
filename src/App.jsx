import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Collection from './pages/Collection.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
