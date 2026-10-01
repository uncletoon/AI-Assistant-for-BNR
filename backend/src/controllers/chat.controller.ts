import { Request, Response, NextFunction } from 'express';
import { aiDataRetrieverService } from '../services/ai.service.js';

export async function handleChatMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'A message string is required in the request body.',
      });
      return;
    }

    const result = await aiDataRetrieverService.processQuery(message, context);

    res.json({
      status: 'success',
      reply: result.reply,
      source: result.source,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
}
