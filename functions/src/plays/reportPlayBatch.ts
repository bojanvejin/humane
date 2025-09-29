import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// Validation schema for play batch
const PlayBatchSchema = z.object({
  token: z.string(), // Placeholder for signed token
  plays: z.array(z.object({
    trackId: z.string(),
    userId: z.string(), // This should ideally come from context.auth.uid for security
    sessionId: z.string(),
    duration: z.number().min(0), // Duration of the actual listen in ms
    trackFullDurationMs: z.number().min(1), // Full duration of the track in ms
    completed: z.boolean(),
    deviceInfo: z.object({
      userAgent: z.string(),
      ipAddress: z.string(),
      country: z.string().optional(),
    }),
    timestamp: z.string().datetime(),
  })).max(1000), // Limit batch size for security
});

export const reportPlayBatch = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  // Placeholder for signed token validation
  // In a real scenario, 'data.token' would be a JWT signed by the client
  // and verified here to ensure play events haven't been tampered with.
  // For MVP, we'll just check if it's present.
  if (!data.token || data.token.length < 10) { // Basic check for token presence
    throw new functions.https.HttpsError('unauthenticated', 'Invalid or missing play token.');
  }

  // Ensure the userId in the play events matches the authenticated user's UID
  // This prevents users from reporting plays for other users.
  const authenticatedUserId = context.auth.uid;

  try {
    // Validate input
    const validatedData = PlayBatchSchema.parse(data);
    const batch = db.batch();
    const suspiciousPlays: string[] = [];

    for (const play of validatedData.plays) {
      if (play.userId !== authenticatedUserId) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot report plays for another user.');
      }

      const playId = `${play.sessionId}_${play.trackId}_${new Date(play.timestamp).getTime()}`;
      const playRef = db.collection('plays_raw').doc(playId);
      
      // Fraud detection rules
      const { isSuspicious, reasons } = detectSuspiciousPlay(play);

      if (isSuspicious) {
        suspiciousPlays.push(playId);
      }

      const playData = {
        ...play,
        id: playId,
        suspicious: isSuspicious,
        fraudReasons: reasons,
        processed: false, // Will be set to true by materializeRaw
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(playRef, playData);
    }

    await batch.commit();

    return {
      success: true,
      processed: validatedData.plays.length,
      suspicious: suspiciousPlays.length,
      suspiciousPlayIds: suspiciousPlays,
    };
  } catch (error: any) {
    console.error('Play batch error:', error);
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid play data format.', error.errors);
    }
    if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
      throw error; // Re-throw specific HttpsErrors
    }
    throw new functions.https.HttpsError('internal', 'Failed to report play batch.', error.message);
  }
});

interface PlayEventData {
  duration: number; // ms played
  trackFullDurationMs: number; // full track duration
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
  };
}

export function detectSuspiciousPlay(play: PlayEventData): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let isSuspicious = false;

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

  // Rule 3: Local IP address detection
  if (play.deviceInfo.ipAddress === '127.0.0.1' || play.deviceInfo.ipAddress === '::1') {
    reasons.push('local_ip_address');
    isSuspicious = true;
  }
  
  // TODO: Implement session-based frequency checks and other heuristics in materializeRaw
  // For now, reportPlayBatch does basic checks. More complex fraud detection
  // will happen in materializeRaw after fetching full track data and user history.

  return { isSuspicious, reasons };
}