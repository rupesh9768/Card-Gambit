import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'card-gambit-dev-secret';
}

export async function authenticate(request, response, next) {
  try {
    const header = request.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return response.status(401).json({ message: 'Authentication required.' });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.userId);

    if (!user) {
      return response.status(401).json({ message: 'User not found.' });
    }

    request.user = user;
    next();
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token.' });
  }
}
