import { openStandardPack, openStarterPack } from '../services/gameService.js';

export async function openPack(request, response, next) {
  try {
    const { userId, packType } = request.body ?? {};
    const result = await openStandardPack({ user: request.user, userId, packType });
    return response.json(result);
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({ message: error.message });
    }

    next(error);
  }
}

export async function openStarter(request, response, next) {
  try {
    const result = await openStarterPack({ user: request.user });
    return response.json(result);
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({ message: error.message });
    }

    next(error);
  }
}
