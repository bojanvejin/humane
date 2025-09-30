import { onRequest, Request, Response } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { db, FieldValue } from '../firebaseAdmin';
import { z } from 'zod';
import { FraudReason } from '../types';
import { detectSuspiciousPlay } from '../utils/fraudDetection';
import { hashIpAddress } from '../utils/security';

const corsHandler = cors({ origin: true });

// Zod schema for a single play event payload
const PlayEventPayloadSchema = z.object({
  eventId: z.string().uuid(),
  trackId: z.string().min(1),
  sessionId: z.string().uuid(),
  duration: z.number().int().min(0), // ms played
  trackFullDurationMs: z.number().int().min(0), // full duration of the track in ms
  completed: z.boolean(),
  deviceInfo: z.object({
    userAgent: z.string().min(1),
        country: z.string().optional(),
  }),
  timestamp: z.string().datetime(), // ISO string
});

// Zod schema for the entire request body
const ReportPlayBatchRequestBodySchema = z.object({
  plays: z.array(PlayEventPayloadSchema).min(1),
});

export const reportPlayBatch = onRequest(async (req: Request, res: Response) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed', message: 'Only POST requests are accepted.' });
      return;
    }

    // 1. Authenticate user via ID token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized', message: 'No Firebase ID token provided.' });
      return;
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid Firebase ID token.' });
      return;
    }
    const userId = decodedToken.uid;

    // 2. Verify App Check token
    const appCheckToken = req.headers['x-firebase-appcheck'] as string | undefined;
    // Only enforce App Check in production environments
    if (process.env.NODE_ENV === 'production' && !appCheckToken) {
      res.status(401).json({ error: 'Unauthorized', message: 'App Check token missing.' });
      return;
    }
    if (appCheckToken) {
      try {
        await admin.appCheck().verifyToken(appCheckToken);
      } catch (error) {
        console.error('Error verifying App Check token:', error);
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid App Check token.' });
        return;
      }
    }

    // 3. Validate request body using Zod
    const parseResult = ReportPlayBatchRequestBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      console.error('Invalid request body:', parseResult.error.errors);
      res.status(400).json({ error: 'Bad Request', message: parseResult.error.errors });
      return;
    }
    const { plays } = parseResult.data;

    // Get client IP and hash it
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ipHashSalt = process.env.IP_HASH_SALT;

    if (!ipHashSalt) {
      console.error('IP_HASH_SALT environment variable is not set. IP addresses will not be hashed.');
      res.status(500).json({ error: 'Internal Server Error', message: 'IP_HASH_SALT is not configured.' });
      return;
    }
    const hashedIp = hashIpAddress(clientIp.toString(), ipHashSalt);

    const batch = db.batch();
    const yyyymm = new Date().toISOString().substring(0, 7).replace('-', ''); // YYYYMM format

    for (const play of plays) {
      // Augment deviceInfo with the hashed IP
      const augmentedDeviceInfo = {
        ...play.deviceInfo,
        ipAddress: hashedIp,
      };

      // Initial fraud detection (can be refined in materializeRaw)
      const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay({
        duration: play.duration,
        trackFullDurationMs: play.trackFullDurationMs,
        deviceInfo: augmentedDeviceInfo,
      });

      const rawPlayRef = db.collection('plays_raw').doc(yyyymm).collection('events').doc(play.eventId);
      batch.set(rawPlayRef, {
        ...play,
        userId: userId, // Add userId from authenticated user
        deviceInfo: augmentedDeviceInfo, // Store augmented device info
        suspicious: isSuspicious,
        fraudReasons: reasons.length > 0 ? (reasons as FraudReason[]) : FieldValue.delete(),
        fraudScore: fraudScore,
        processed: false, // Mark as not yet processed by materializeRaw
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    res.status(200).json({ status: 'ok', wrote: plays.length });
  });
});