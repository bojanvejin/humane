import { onRequest, Request, Response } from 'firebase-functions/v2/https';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const ping = onRequest(async (req: Request, res: Response) => {
  return corsHandler(req, res, () => {
    res.status(200).json({ status: 'ok', message: 'Pong from HUMANE Cloud Functions!' });
  });
});