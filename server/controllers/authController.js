import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { getXpToNextLevel } from '../services/gameService.js';

const tokenExpiry = '7d';

function signToken(user) {
  return jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: tokenExpiry });
}

function serializeAuthUser(user) {
  const hasOwnedCards = (user.cards ?? []).some((card) => Number(card.quantity ?? 0) > 0);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    level: Number(user.level ?? 1),
    xp: Number(user.xp ?? 0),
    xpToNextLevel: getXpToNextLevel(Number(user.level ?? 1)),
    coins: Number(user.coins ?? 0),
    starterPackOpened: Boolean(user.starterPackOpened),
    needsStarterPack: !user.starterPackOpened && !hasOwnedCards,
    firstDuelCompleted: Boolean(user.firstDuelCompleted),
  };
}

export async function register(request, response, next) {
  try {
    const username = request.body?.username?.trim();
    const email = request.body?.email?.trim().toLowerCase();
    const password = request.body?.password;

    if (!username || !email || !password) {
      return response.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
      return response.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });

    if (existing) {
      return response.status(409).json({ message: 'Username or email is already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      cards: [],
      deck: [],
    });

    return response.status(201).json({
      message: 'Account created.',
      token: signToken(user),
      user: serializeAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const email = request.body?.email?.trim().toLowerCase();
    const password = request.body?.password;

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return response.status(401).json({ message: 'Invalid email or password.' });
    }

    const matches = await bcrypt.compare(password, user.password);

    if (!matches) {
      return response.status(401).json({ message: 'Invalid email or password.' });
    }

    return response.json({
      token: signToken(user),
      user: serializeAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export function me(request, response) {
  return response.json({
    user: serializeAuthUser(request.user),
  });
}
