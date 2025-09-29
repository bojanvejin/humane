import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import { db, FieldValue } from '../firebaseAdmin'; // Import db and FieldValue from our shared admin module

const corsHandler = cors({ origin: true });

export const reportPlayBatch = onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'POST only' });
      return;
    }
    const body = req.body ?? {};
    if (!Array.isArray(body.plays)) {
      res.status(400).json({ error: 'Body must be { plays: [] }' });
      return;
    }

    const batch = db.batch();
    for (let i = 0; i < body.plays.length; i++) {
      const play = body.plays[i];
      if (!play?.trackId) {
        res.status(400).json({ error: `plays[${i}].trackId required` });
        return;
      }
      if (!play?.userId) {
        res.status(400).json({ error: `plays[${i}].userId required` });
        return;
      }

      const ref = db.collection('plays_raw').doc();
      batch.set(ref, {
        trackId: String(play.trackId),
        userId: String(play.userId),
        msPlayed: typeof play.msPlayed === 'number' ? play.msPlayed : null,
        userAgent: req.get('user-agent') ?? null, // Capture user-agent
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    res.status(200).json({ status: 'ok', wrote: body.plays.length });
  });
});