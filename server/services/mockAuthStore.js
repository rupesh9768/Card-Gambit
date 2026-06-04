import crypto from 'node:crypto';

const usersById = new Map();
const usersByEmail = new Map();
const usersByUsername = new Map();

export function createMockUser({ username, email, password }) {
  const now = new Date();
  const user = {
    id: crypto.randomUUID(),
    username,
    email,
    password,
    xp: 0,
    level: 1,
    coins: 100,
    cards: [],
    deck: [],
    starterPackOpened: false,
    starterPackOpenedAt: null,
    firstDuelCompleted: false,
    firstDuelCompletedAt: null,
    winStreak: 0,
    bestWinStreak: 0,
    totalDuels: 0,
    totalWins: 0,
    totalLosses: 0,
    totalPacksOpened: 0,
    duelDropPity: 0,
    packPity: { epic: 0, legendary: 0, unknown: 0 },
    dailyQuestDate: '',
    dailyQuests: [],
    achievements: [],
    createdAt: now,
    updatedAt: now,
    async save() {
      this.updatedAt = new Date();
      usersById.set(this.id, this);
      usersByEmail.set(this.email, this);
      usersByUsername.set(this.username, this);
      return this;
    },
    toJSON() {
      const { password: _password, save: _save, toJSON: _toJSON, ...safeUser } = this;
      return safeUser;
    },
  };

  usersById.set(user.id, user);
  usersByEmail.set(user.email, user);
  usersByUsername.set(user.username, user);
  return user;
}

export function findMockUserByEmail(email) {
  return usersByEmail.get(email) ?? null;
}

export function findMockUserById(id) {
  return usersById.get(id) ?? null;
}

export function findMockUserByUsername(username) {
  return usersByUsername.get(username) ?? null;
}
