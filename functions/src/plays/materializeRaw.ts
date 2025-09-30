import { Client, Databases, Query, ID, Permission, Role } from 'node-appwrite';
import { APPWRITE_DATABASE_ID, PLAYS_RAW_COLLECTION_ID, TRACKS_COLLECTION_ID, PLAYS_COLLECTION_ID, USER_TRACK_AGG_COLLECTION_ID, databases } from '../appwrite';
import { PlayEventPayload, RawPlayDocument, TrackDocument, PlayDocument, UserTrackAggregateDocument } from '../types';
import { detectSuspiciousPlay } from '../utils/fraudDetection';

// This function will be triggered by a database event (e.g., on document creation in plays_raw)
export default async ({ req, res }: { req: any, res: any }) => {
  // Appwrite Functions receive event data in req.body for database triggers
  const payload = JSON.parse(req.body);
  const rawPlayDocument = payload as RawPlayDocument; // The document that triggered the function

  const eventId = rawPlayDocument.$id;
  const userId = rawPlayDocument.userId;
  const trackId = rawPlayDocument.trackId;

  if (!rawPlayDocument) {
    console.error(`No data found for event ${eventId}.`);
    return res.json({ error: 'No raw play document provided.' }, 400);
  }

  // Prevent re-processing if already marked as processed
  if (rawPlayDocument.processed) {
    console.log(`Raw play ${eventId} already processed. Skipping.`);
    return res.json({ status: 'skipped', message: 'Already processed.' }, 200);
  }

  try {
    // Fetch actual track duration from Appwrite database
    let trackDoc: TrackDocument;
    try {
      trackDoc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        TRACKS_COLLECTION_ID,
        trackId
      ) as TrackDocument;
    } catch (error: any) {
      if (error.code === 404) { // Document not found
        console.warn(`Track ${trackId} not found for raw play ${eventId}. Marking as suspicious.`);
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          PLAYS_RAW_COLLECTION_ID,
          eventId,
          {
            suspicious: true,
            fraudReasons: rawPlayDocument.fraudReasons ? [...rawPlayDocument.fraudReasons, 'track_not_found'] : ['track_not_found'],
            fraudScore: 1,
            processed: true,
            updatedAt: new Date().toISOString(),
          }
        );
        return res.json({ status: 'processed_with_warning', message: 'Track not found.' }, 200);
      }
      throw error; // Re-throw other database errors
    }

    const trackFullDurationMs = trackDoc.duration * 1000; // Convert seconds to milliseconds

    // Re-evaluate suspicious status with actual track duration and hashed IP
    const { isSuspicious: reEvaluatedSuspicious, reasons: reEvaluatedReasons, fraudScore: reEvaluatedFraudScore } = detectSuspiciousPlay({
      duration: rawPlayDocument.duration,
      trackFullDurationMs: trackFullDurationMs,
      deviceInfo: {
        userAgent: rawPlayDocument.deviceInfo.userAgent,
        ipAddress: rawPlayDocument.ipAddressHash, // Use the hashed IP from the raw document
      },
    });

    let finalSuspicious = rawPlayDocument.suspicious || reEvaluatedSuspicious;
    let finalFraudReasons = Array.from(new Set([...(rawPlayDocument.fraudReasons || []), ...reEvaluatedReasons]));
    let finalFraudScore = Math.max(rawPlayDocument.fraudScore || 0, reEvaluatedFraudScore);

    // Deduplication using UserTrackAggregate
    const userTrackAggDocId = `${userId}_${trackId}`;
    let userTrackAgg: UserTrackAggregateDocument | null = null;
    try {
      userTrackAgg = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        USER_TRACK_AGG_COLLECTION_ID,
        userTrackAggDocId
      ) as UserTrackAggregateDocument;
    } catch (error: any) {
      if (error.code !== 404) { // Ignore 404, it means no aggregate exists yet
        throw error;
      }
    }

    const currentPlayTimestamp = new Date(rawPlayDocument.timestamp);

    if (userTrackAgg) {
      // Rule: Dedupe same track repeats within max(30s, duration/4)
      const dedupeWindowMs = Math.max(30000, trackFullDurationMs / 4);
      const windowEndsAt = new Date(userTrackAgg.windowEndsAt);

      if (currentPlayTimestamp.getTime() < windowEndsAt.getTime()) {
        console.log(`Raw play ${eventId} is a duplicate within dedupe window. Marking as suspicious.`);
        finalSuspicious = true;
        finalFraudReasons.push('duplicate_play_within_window');
        finalFraudScore = Math.max(finalFraudScore, 1);
      }
    }

    // Materialize the play
    const materializedPlay: Omit<PlayDocument, '$id' | '$collectionId' | '$databaseId' | '$createdAt' | '$updatedAt' | '$permissions'> = {
      trackId: rawPlayDocument.trackId,
      userId: rawPlayDocument.userId,
      sessionId: rawPlayDocument.sessionId,
      duration: rawPlayDocument.duration / 1000, // Store in seconds
      completed: rawPlayDocument.duration >= (trackFullDurationMs * 0.85), // 85% completion
      suspicious: finalSuspicious,
      fraudReasons: finalFraudReasons.length > 0 ? finalFraudReasons : undefined,
      fraudScore: finalFraudScore,
      deviceInfo: rawPlayDocument.deviceInfo,
      timestamp: rawPlayDocument.timestamp, // ISO string
      createdAt: new Date().toISOString(),
      artistIds: trackDoc.artistIds, // Assuming trackDoc has artistIds
    };

    // Create materialized play document
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      PLAYS_COLLECTION_ID,
      ID.unique(), // Generate a unique ID for the materialized play
      materializedPlay,
      [
        Permission.read(Role.user(userId)),
        // Add other permissions as needed, e.g., for artists to read their plays
      ]
    );

    // Update or create userTrackAgg
    const newWindowEndsAt = new Date(currentPlayTimestamp.getTime() + Math.max(30000, trackFullDurationMs / 4));
    const userTrackAggData: Omit<UserTrackAggregateDocument, '$id' | '$collectionId' | '$databaseId' | '$createdAt' | '$updatedAt' | '$permissions'> = {
      userId: userId,
      trackId: trackId,
      lastPlayAt: currentPlayTimestamp.toISOString(),
      windowEndsAt: newWindowEndsAt.toISOString(),
      playCount: (userTrackAgg?.playCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    if (userTrackAgg) {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        USER_TRACK_AGG_COLLECTION_ID,
        userTrackAggDocId,
        userTrackAggData,
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
        ]
      );
    } else {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        USER_TRACK_AGG_COLLECTION_ID,
        userTrackAggDocId, // Use a predictable ID for easy retrieval
        userTrackAggData,
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
        ]
      );
    }

    // Mark raw play as processed
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      PLAYS_RAW_COLLECTION_ID,
      eventId,
      {
        processed: true,
        suspicious: finalSuspicious,
        fraudReasons: finalFraudReasons.length > 0 ? finalFraudReasons : null, // Use null to remove if empty
        fraudScore: finalFraudScore,
        updatedAt: new Date().toISOString(),
      }
    );

    console.log(`Materialized play ${eventId} successfully.`);
    return res.json({ status: 'ok', message: `Materialized play ${eventId} successfully.` }, 200);

  } catch (error: any) {
    console.error(`Error materializing raw play ${eventId}:`, error);
    // Mark raw play as processed but failed, to avoid re-triggering
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      PLAYS_RAW_COLLECTION_ID,
      eventId,
      {
        processed: true,
        materializationError: error.message,
        updatedAt: new Date().toISOString(),
      }
    );
    return res.json({ error: 'Internal Server Error', detail: error.message }, 500);
  }
};