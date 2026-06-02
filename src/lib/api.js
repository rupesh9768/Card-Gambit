async function request(path, options) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
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

export function startGame(mode) {
  return request(`/api/play/${mode}`, {
    method: 'POST',
  });
}

export function startDuel(playerDeck) {
  return request('/api/duel/start', {
    method: 'POST',
    body: JSON.stringify({ playerDeck }),
  });
}

export function playDuelRound(duelId, selectedCardId) {
  return request('/api/duel/play', {
    method: 'POST',
    body: JSON.stringify({ duelId, selectedCardId }),
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

export function openPack(userId) {
  return request('/api/pack/open', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
