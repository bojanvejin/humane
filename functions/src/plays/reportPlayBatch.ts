import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import * as cors from 'cors'; // Corrected to import * as cors
import { hashIpAddress } from '../utils/security';
import { FraudReason } from '../types';

const corsHandler = cors({ origin: true });

// IMPORTANT: Replace with a strong, secret key from environment variables
// For local development, you can set this in your .env file or Firebase functions config.
const IP_HASH_SALT = process.env.IP_HASH_SALT || 'super-secret-ip-hash-salt-replace-me';

// Validation schema for a single play event
const PlayEventSchema = z.object({
  eventId: z.string().uuid(), // Client-generated UUID for this specific event
  trackId: z.string(),
  sessionId: z.string().uuid(), // Client-generated UUID for session
  duration: z.number().min(0), // Duration of the actual listen in ms
  trackFullDurationMs: z.number().min(1), // Full duration of the track in ms
  completed: z.boolean(),
  deviceInfo: z.object({
    userAgent: z.string(),
    // ipAddress will be determined server-side
    country: z.string().optional(),
  }),
  timestamp: z.string().datetime(),
});

// Validation schema for the entire batch payload
const PlayBatchPayloadSchema = z.object({
  plays: z.array(PlayEventSchema).max(1000), // Limit batch size
});

export const reportPlayBatch = onRequest(async (req, res) => {
  // Initialize services inside the function to ensure admin.initializeApp() has run
  const db = admin.firestore();
  const auth = admin.auth();
  const appCheck = admin.appCheck();

  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    // 1. Verify Firebase ID Token
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      console.warn('reportPlayBatch: No ID token provided.');
      return res.status(401).send('Unauthorized: No ID token.');
    }

    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('reportPlayBatch: Error verifying ID token:', error);
      return res.status(401).send('Unauthorized: Invalid ID token.');
    }
    const authenticatedUserId = decodedToken.uid;

    // 2. Verify App Check Token
    const appCheckToken = req.headers['x-firebase-appcheck'] as string | undefined;
    if (!appCheckToken) {
      console.warn('reportPlayBatch: No App Check token provided.');
      return res.status(401).send('Unauthorized: No App Check token.');
    }
    try {
      await appCheck.verifyToken(appCheckToken);
    } catch (error) {
      console.error('reportPlayBatch: Error verifying App Check token:', error);
      return res.status(401).send('Unauthorized: Invalid App Check token.');
    }

    // 3. Extract and hash client IP
    const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || '0.0.0.0';
    const hashedIp = hashIpAddress(clientIp, IP_HASH_SALT);

    try {
      // Validate input payload
      const validatedData = PlayBatchPayloadSchema.parse(req.body);
      const batch = db.batch();
      const suspiciousPlayIds: string[] = [];

      for (const play of validatedData.plays) {
        const currentTimestamp = new Date(play.timestamp);
        const yyyymm = currentTimestamp.toISOString().substring(0, 7).replace('-', '');
        
        const playRef = db.collection('plays_raw').doc(yyyymm).collection('events').doc(play.eventId);
        
        // Fraud detection rules (initial checks)
        const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay({
          duration: play.duration,
          trackFullDurationMs: play.trackFullDurationMs,
          deviceInfo: {
            userAgent: play.deviceInfo.userAgent,
            ipAddress: hashedIp,
          },
        });

        if (isSuspicious) {
          suspiciousPlayIds.push(play.eventId);
        }

        const playData = {
          ...play,
          userId: authenticatedUserId,
          deviceInfo: {
            ...play.deviceInfo,
            ipAddress: hashedIp,
          },
          suspicious: isSuspicious,
          fraudReasons: reasons.length > 0 ? reasons : admin.firestore.FieldValue.delete(),
          fraudScore: fraudScore,
          processed: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(playRef, playData, { merge: false });
      }

      await batch.commit();

      return res.status(200).send({
        success: true,
        processed: validatedData.plays.length,
        suspicious: suspiciousPlayIds.length,
        suspiciousPlayIds: suspiciousPlayIds,
      });
    } catch (error: any) {
      console.error('reportPlayBatch: Play batch error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).send({
          status: 'error',
          message: 'Invalid play data format.',
          details: error.errors,
        });
      }
      return res.status(500).send({
        status: 'error',
        message: 'Failed to report play batch.',
        details: error.message,
      });
    }
  });
});

interface PlayEventDataForDetection {
  duration: number; // ms played
  trackFullDurationMs: number; // full track duration
  deviceInfo: {
    userAgent: string;
    ipAddress: string; // Hashed IP
  };
}

export function detectSuspiciousPlay(play: PlayEventDataForDetection): { isSuspicious: boolean; reasons: FraudReason[]; fraudScore: number } {
  const reasons: FraudReason[] = [];
  let isSuspicious = false;
  let fraudScore = 0;

  // Rule 1: Minimum 20 seconds (20000ms) or 50% of track duration
  const minListenDurationMs = Math.min(20000, play.trackFullDurationMs * 0.5);
  if (play.duration < minListenDurationMs) {
    reasons.push('insufficient_listen_duration');
    isSuspicious = true;
  }

  // Rule 2: Bot user agent detection
  if (play.deviceInfo.userAgent.toLowerCase().includes('bot')) {
    reasons.push('bot_user_agent');
    isSuspicious = true;
  }

  if (isSuspicious) {
    fraudScore = 1;
  }

  return { isSuspicious, reasons, fraudScore };
}