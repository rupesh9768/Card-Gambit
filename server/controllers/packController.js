import { openStandardPack } from '../services/gameService.js';

export async function openPack(request, response, next) {
  try {
    const { userId } = request.body ?? {};
    const result = await openStandardPack({ userId });
    return response.json(result);
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({ message: error.message });
    }

    next(error);
  }
}
