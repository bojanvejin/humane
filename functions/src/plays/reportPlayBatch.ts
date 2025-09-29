import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// Validation schema for play batch
const PlayBatchSchema = z.object({
  plays: z.array(z.object({
    trackId: z.string(),
    userId: z.string(),
    sessionId: z.string(),
    duration: z.number().min(0),
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

  try {
    // Validate input
    const validatedData = PlayBatchSchema.parse(data);
    const batch = db.batch();
    const suspiciousPlays: string[] = [];

    for (const play of validatedData.plays) {
      const playId = `${play.sessionId}_${play.trackId}_${new Date(play.timestamp).getTime()}`;
      const playRef = db.collection('plays_raw').doc(playId);
      
      // Fraud detection rules
      const isSuspicious = detectSuspiciousPlay(play);
      const fraudReasons = isSuspicious ? checkFraudReasons(play) : [];

      if (isSuspicious) {
        suspiciousPlays.push(playId);
      }

      const playData = {
        ...play,
        id: playId,
        suspicious: isSuspicious,
        fraudReasons,
        processed: false,
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
  } catch (error) {
    console.error('Play batch error:', error);
    throw new functions.https.HttpsError('invalid-argument', 'Invalid play data');
  }
});

function detectSuspiciousPlay(play: any): boolean {
  // Minimum 20 seconds or 50% of track duration rule
  const trackDuration = 180; // TODO: Fetch actual track duration from Firestore
  const minDuration = Math.min(20, trackDuration * 0.5);
  
  if (play.duration < minDuration) {
    return true;
  }

  // Additional fraud signals
  if (play.deviceInfo.userAgent.includes('bot')) return true;
  if (play.deviceInfo.ipAddress === '127.0.0.1') return true;
  
  // High frequency detection (would need session tracking)
  // TODO: Implement session-based frequency checks

  return false;
}

function checkFraudReasons(play: any): string[] {
  const reasons: string[] = [];
  const trackDuration = 180; // TODO: Fetch actual track duration
  
  if (play.duration < Math.min(20, trackDuration * 0.5)) {
    reasons.push('insufficient_listen_duration');
  }
  
  if (play.deviceInfo.userAgent.includes('bot')) {
    reasons.push('bot_user_agent');
  }
  
  if (play.deviceInfo.ipAddress === '127.0.0.1') {
    reasons.push('local_ip_address');
  }

  return reasons;
}