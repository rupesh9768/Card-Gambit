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
