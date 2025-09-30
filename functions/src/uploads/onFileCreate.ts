import { Client, Databases, Storage, Query, ID, Permission, Role } from 'node-appwrite';
import { APPWRITE_DATABASE_ID, TRACKS_COLLECTION_ID, databases } from '../appwrite';
import { TrackDocument } from '../types';

// This function will be triggered by an Appwrite Storage file creation event.
// Event: storage.buckets.[bucketId].files.*.create
export default async ({ req, res }: { req: any, res: any }) => {
  const payload = JSON.parse(req.body);
  const fileId = payload.$id;
  const bucketId = payload.bucketId;
  // Appwrite Storage events don't directly provide userId in the payload.
  // We need to infer it or ensure it's part of the file's permissions or metadata.
  // For now, we'll assume the track document itself holds the userId.

  if (!fileId || !bucketId) {
    console.error('Missing file ID or bucket ID in storage event payload.');
    return res.json({ error: 'Invalid payload.' }, 400);
  }

  console.log(`New file created in bucket ${bucketId}: ${fileId}`);

  try {
    // Find the track document that references this fileId
    // We need to query for tracks where audioFile.original matches the fileId.
    // This assumes a track is created *before* the file is uploaded, or linked immediately after.
    const trackDocs = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      TRACKS_COLLECTION_ID,
      [
        Query.equal('audioFile.original', fileId),
        Query.limit(1), // Expecting only one track per original audio file
      ]
    );

    if (trackDocs.documents.length > 0) {
      const track = trackDocs.documents[0] as unknown as TrackDocument;
      console.log(`Found associated track: ${track.title} (${track.$id}).`);

      // Here you would typically trigger an external transcoding service
      // or another Appwrite Function for HLS conversion.
      // For example:
      // await functions.createExecution('transcodeHLSFunctionId', JSON.stringify({ trackId: track.$id, fileId: fileId }));
      console.log(`Placeholder: Triggering HLS transcoding for track ${track.$id} with file ${fileId}.`);

      // Update the track document to reflect that processing has started
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        TRACKS_COLLECTION_ID,
        track.$id,
        {
          'audioFile.hlsProcessingStatus': 'processing', // Change status to 'processing'
          updatedAt: new Date().toISOString(),
        }
      );
      console.log(`Track ${track.$id} marked for HLS processing.`);
    } else {
      console.warn(`No track document found referencing file ID ${fileId}. This file might be unlinked or an orphan.`);
      // Optionally, you could delete the orphan file or move it to a quarantine bucket.
    }

    return res.json({ status: 'ok', message: `File ${fileId} received for processing.` }, 200);

  } catch (error: any) {
    console.error(`Error processing file ${fileId}:`, error);
    // If an error occurs, we might want to update the track status to 'failed'
    // This would require re-fetching the track or passing its ID if available.
    // For simplicity, we'll just log and return an error for now.
    return res.json({ error: 'Internal Server Error', detail: error.message }, 500);
  }
};