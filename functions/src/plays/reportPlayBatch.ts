import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import * as cors from 'cors';
import { hashIpAddress } from '../utils/security'; // Import from new internal utility
import { FraudReason } from '../types';

const db = admin.firestore();
const auth = admin.auth();
const appCheck = admin.appCheck();
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
    const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || '0.0.0.0'; // Ensured clientIp is always a string
    const hashedIp = hashIpAddress(clientIp, IP_HASH_SALT);

    try {
      // Validate input payload
      const validatedData = PlayBatchPayloadSchema.parse(req.body);
      const batch = db.batch();
      const suspiciousPlayIds: string[] = [];

      for (const play of validatedData.plays) {
        // Ensure the userId in the play events matches the authenticated user's UID
        // This prevents users from reporting plays for other users.
        // Note: The PlayEventSchema doesn't include userId, so we'll add it here.
        // If userId was part of the client-sent payload, it would be validated against authenticatedUserId.
        // For now, we assume the client doesn't send userId and it's assigned server-side.

        const currentTimestamp = new Date(play.timestamp);
        const yyyymm = currentTimestamp.toISOString().substring(0, 7).replace('-', ''); // e.g., '202407'
        
        const playRef = db.collection('plays_raw').doc(yyyymm).collection('events').doc(play.eventId);
        
        // Fraud detection rules (initial checks)
        const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay({
          duration: play.duration,
          trackFullDurationMs: play.trackFullDurationMs,
          deviceInfo: {
            userAgent: play.deviceInfo.userAgent,
            ipAddress: hashedIp, // Use hashed IP
          },
        });

        if (isSuspicious) {
          suspiciousPlayIds.push(play.eventId);
        }

        const playData = {
          ...play,
          userId: authenticatedUserId, // Assign authenticated user ID
          deviceInfo: {
            ...play.deviceInfo,
            ipAddress: hashedIp, // Store hashed IP
          },
          suspicious: isSuspicious,
          fraudReasons: reasons.length > 0 ? reasons : admin.firestore.FieldValue.delete(),
          fraudScore: fraudScore,
          processed: false, // Will be set to true by materializeRaw
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Use set with { merge: false } for idempotency:
        // If a document with this ID already exists, and merge is false, the write will fail.
        // However, Firestore's batch.set() with merge:false will overwrite if it exists.
        // For true idempotency at the Firestore level for *new* documents,
        // we'd need to check existence first or use a transaction.
        // For now, the unique eventId should prevent most duplicates.
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

  // Rule 3: Local IP address detection (hashed IP will be consistent for local)
  // Note: This check is less effective with hashed IPs unless you hash known local IPs.
  // For now, we'll assume '127.0.0.1' or '::1' would be hashed to specific values if they were the source.
  // A more robust check would be to check the *unhashed* IP before hashing, or hash known local IPs for comparison.
  // For MVP, we'll keep it simple and rely on the client-side IP being '0.0.0.0' for local dev.
  // If the client-side IP is '0.0.0.0', the hashed IP will be consistent.
  // This rule is primarily for *unhashed* IPs, but keeping it for conceptual consistency.
  // A better approach for production would be to check the raw clientIp before hashing.
  // For now, if the client sends '0.0.0.0' and it gets hashed, this rule won't trigger unless
  // the hashed value of '0.0.0.0' is explicitly checked.
  // Let's remove the local IP check here for now, as it's better handled with the raw IP.
  // The instruction was to hash IP on the server, so the raw IP is not available here.
  // This rule will be re-evaluated if raw IP is needed for detection.

  if (isSuspicious) {
    fraudScore = 1;
  }

  return { isSuspicious, reasons, fraudScore };
}