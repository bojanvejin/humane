import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Play, Track } from '../../src/types'; // Assuming types are accessible
import { detectSuspiciousPlay } from './reportPlayBatch'; // Re-use basic detection

const db = admin.firestore();

export const materializeRaw = functions.firestore
  .document('plays_raw/{playId}')
  .onCreate(async (snapshot, context) => {
    const rawPlay = snapshot.data();
    const playId = snapshot.id;

    // Prevent re-processing if already marked as processed (e.g., by another instance)
    if (rawPlay.processed) {
      console.log(`Raw play ${playId} already processed. Skipping.`);
      return null;
    }

    try {
      // Fetch actual track duration from Firestore
      const trackDoc = await db.collection('tracks').doc(rawPlay.trackId).get();
      if (!trackDoc.exists) {
        console.warn(`Track ${rawPlay.trackId} not found for raw play ${playId}. Marking as suspicious.`);
        await snapshot.ref.update({
          suspicious: true,
          fraudReasons: admin.firestore.FieldValue.arrayUnion('track_not_found'),
          processed: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }
      const track = trackDoc.data() as Track;
      const trackFullDurationMs = track.duration * 1000; // Convert seconds to milliseconds

      // Re-evaluate suspicious status with actual track duration
      const { isSuspicious: reEvaluatedSuspicious, reasons: reEvaluatedReasons } = detectSuspiciousPlay({
        duration: rawPlay.duration,
        trackFullDurationMs: trackFullDurationMs,
        deviceInfo: rawPlay.deviceInfo,
      });

      let finalSuspicious = rawPlay.suspicious || reEvaluatedSuspicious;
      let finalFraudReasons = Array.from(new Set([...(rawPlay.fraudReasons || []), ...reEvaluatedReasons]));

      // Rule: Dedupe same track repeats within max(30s, duration/4)
      const dedupeWindowMs = Math.max(30000, trackFullDurationMs / 4);
      const minTimestamp = new Date(new Date(rawPlay.timestamp).getTime() - dedupeWindowMs);

      const recentPlaysQuery = await db.collection('plays')
        .where('userId', '==', rawPlay.userId)
        .where('trackId', '==', rawPlay.trackId)
        .where('timestamp', '>', minTimestamp)
        .limit(1)
        .get();

      if (!recentPlaysQuery.empty) {
        console.log(`Raw play ${playId} is a duplicate within dedupe window. Marking as suspicious.`);
        finalSuspicious = true;
        finalFraudReasons.push('duplicate_play_within_window');
      }

      // Materialize the play
      const materializedPlay: Play = {
        id: playId,
        trackId: rawPlay.trackId,
        userId: rawPlay.userId,
        sessionId: rawPlay.sessionId,
        duration: rawPlay.duration / 1000, // Store in seconds as per Play interface
        completed: rawPlay.duration >= (trackFullDurationMs * 0.85), // 85% completion
        suspicious: finalSuspicious,
        fraudReasons: finalFraudReasons.length > 0 ? finalFraudReasons : undefined,
        deviceInfo: rawPlay.deviceInfo,
        timestamp: new Date(rawPlay.timestamp),
      };

      // Write to /plays collection
      await db.collection('plays').doc(playId).set(materializedPlay);

      // Mark raw play as processed
      await snapshot.ref.update({
        processed: true,
        suspicious: finalSuspicious,
        fraudReasons: finalFraudReasons.length > 0 ? finalFraudReasons : admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Materialized play ${playId} successfully.`);
      return null;
    } catch (error) {
      console.error(`Error materializing raw play ${playId}:`, error);
      // Mark raw play as processed but failed, to avoid re-triggering
      await snapshot.ref.update({
        processed: true,
        materializationError: (error as Error).message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }
  });