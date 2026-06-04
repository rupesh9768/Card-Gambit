const tokenKey = 'card-gambit-token';

export function getStoredToken() {
  return localStorage.getItem(tokenKey);
}

export function setStoredToken(token) {
  localStorage.setItem(tokenKey, token);
}

export function clearStoredToken() {
  localStorage.removeItem(tokenKey);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const error = await response.json();
      message = error.message ?? message;
    } catch {
      // Keep the status-based message when the response has no JSON body.
    }

    const requestError = new Error(message);
    requestError.status = response.status;
    throw requestError;
  }

  return response.json();
}

export function registerUser({ username, email, password }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export function loginUser({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return request('/api/auth/me');
}

export function getDashboard() {
  return request('/api/dashboard');
}

export function getCards() {
  return request('/api/cards');
}

export function getInventory() {
  return request('/api/inventory');
}

export function getBattleDeck() {
  return request('/api/deck');
}

export function saveBattleDeck(deck) {
  return request('/api/deck', {
    method: 'PUT',
    body: JSON.stringify({ deck }),
  });
}

export function startGame(mode) {
  return request(`/api/play/${mode}`, {
    method: 'POST',
  });
}

export function startDuel(playerDeck, difficulty = 'medium') {
  return request('/api/duel/start', {
    method: 'POST',
    body: JSON.stringify({ playerDeck, difficulty }),
  });
}

export function playDuelRound(duelId, selectedCardId, stance = 'attack') {
  return request('/api/duel/play', {
    method: 'POST',
    body: JSON.stringify({ duelId, selectedCardId, stance }),
  });
}

export function getDuelResult(duelId) {
  return request(`/api/duel/result?duelId=${encodeURIComponent(duelId)}`);
}

export function applyDuelReward({ userId, result }) {
  return request('/api/duel/reward', {
    method: 'POST',
    body: JSON.stringify({ userId, result }),
  });
}

export function openPack(userId, packType = 'standard') {
  return request('/api/pack/open', {
    method: 'POST',
    body: JSON.stringify({ userId, packType }),
  });
}

export function openStarterPack() {
  return request('/api/pack/starter', {
    method: 'POST',
  });
}
