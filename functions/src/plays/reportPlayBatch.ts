import { Request, Response } from 'node-appwrite';
import { databases, APPWRITE_DATABASE_ID, PLAYS_RAW_COLLECTION_ID } from '../appwrite';
import { generateUuid, hashIpAddress } from '../utils/security';
import { detectSuspiciousPlay } from '../utils/fraudDetection';
import { PlayEventPayload, RawPlayDocument } from '../types';
import { ID, Permission, Role } from 'node-appwrite';

// This function will be triggered by an HTTP request from the client.
// It expects a JSON body with a 'plays' array.
export default async ({ req, res }: { req: Request, res: Response }) => {
  // Set CORS headers for preflight requests
  if (req.method === 'OPTIONS') {
    return res.send('', 204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
  }

  // Set CORS headers for actual requests
  res.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  });

  if (req.method !== 'POST') {
    return res.json({ error: 'Method Not Allowed' }, 405);
  }

  const userId = req.headers['x-appwrite-user-id'];
  const userIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
  const userAgent = req.headers['user-agent'];

  if (!userId) {
    return res.json({ error: 'Authentication required. Missing x-appwrite-user-id header.' }, 401);
  }
  if (!userIp) {
    return res.json({ error: 'IP address not found in headers.' }, 400);
  }
  if (!userAgent) {
    return res.json({ error: 'User-Agent header is missing.' }, 400);
  }

  try {
    const { plays } = JSON.parse(req.body);

    if (!Array.isArray(plays) || plays.length === 0) {
      return res.json({ error: 'Body must contain a non-empty "plays" array.' }, 400);
    }

    const ipAddressHash = hashIpAddress(userIp, process.env.IP_HASH_SALT!); // Use a secret salt from environment
    const documentsToCreate: RawPlayDocument[] = [];

    for (const play of plays as PlayEventPayload[]) {
      if (!play.trackId || !play.duration || !play.trackFullDurationMs || !play.sessionId || !play.eventId || !play.timestamp) {
        console.warn('Invalid play event received:', play);
        continue; // Skip invalid play events
      }

      const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay({
        duration: play.duration,
        trackFullDurationMs: play.trackFullDurationMs,
        deviceInfo: {
          userAgent: userAgent,
          ipAddress: ipAddressHash, // Pass hashed IP for detection
        },
      });

      const rawPlayDocument: Omit<RawPlayDocument, '$id' | '$collectionId' | '$databaseId' | '$createdAt' | '$updatedAt' | '$permissions'> = {
        ...play,
        userId: userId as string,
        ipAddressHash: ipAddressHash,
        suspicious: isSuspicious,
        fraudReasons: reasons.length > 0 ? reasons : undefined,
        fraudScore: fraudScore,
        processed: false, // Will be set to true after materialization
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      documentsToCreate.push(rawPlayDocument as RawPlayDocument);
    }

    if (documentsToCreate.length === 0) {
      return res.json({ status: 'ok', message: 'No valid plays to report.' }, 200);
    }

    // Batch create documents in Appwrite
    const createdDocuments = await Promise.all(
      documentsToCreate.map(doc =>
        databases.createDocument(
          APPWRITE_DATABASE_ID,
          PLAYS_RAW_COLLECTION_ID,
          ID.unique(),
          doc,
          [
            Permission.read(Role.user(userId as string)),
            Permission.write(Role.user(userId as string)),
            // Add permissions for the function itself to read/write if needed for materialization trigger
          ]
        )
      )
    );

    return res.json({ status: 'ok', wrote: createdDocuments.length, message: 'Play batch reported successfully.' }, 200);

  } catch (error: any) {
    console.error('Error reporting play batch:', error);
    return res.json({ error: 'Internal Server Error', detail: error.message }, 500);
  }
};