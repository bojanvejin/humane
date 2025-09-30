import { Client, Databases, Storage, Query, ID, Permission, Role } from 'node-appwrite';
import { APPWRITE_DATABASE_ID, TRACKS_COLLECTION_ID, databases } from '../appwrite';
import { TrackDocument } from '../types';

// This function will be triggered by an Appwrite Storage file creation event.
// Event: storage.buckets.[bucketId].files.*.create
export default async ({ req, res }: { req: any, res: any }) => {
  const payload = JSON.parse(req.body);
  const fileId = payload.$id;
  const bucketId = payload.bucketId;
  const userId = payload.userId; // Assuming userId is available in file metadata or permissions

  if (!fileId || !bucketId || !userId) {
    console.error('Missing file ID, bucket ID, or user ID in storage event payload.');
    return res.json({ error: 'Invalid payload.' }, 400);
  }

  console.log(`New file created in bucket ${bucketId} by user ${userId}: ${fileId}`);

  try {
    // In a real scenario, you would fetch the associated Track document
    // and then initiate the HLS transcoding process.
    // For now, this serves as a placeholder for that logic.

    // Example: Find the track document that references this fileId
    const trackDocs = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      TRACKS_COLLECTION_ID,
      [
        Query.equal('audioFile.original', fileId),
        Query.equal('userId', userId), // Assuming userId is stored on the track document
      ]
    );

    if (trackDocs.documents.length > 0) {
      const track = trackDocs.documents[0] as unknown as TrackDocument;
      console.log(`Found associated track: ${track.title} (${track.$id}).`);
      // Here you would typically trigger an external transcoding service
      // or another Appwrite Function for HLS conversion.
      // For example:
      // await functions.createExecution('transcodeHLSFunctionId', JSON.stringify({ trackId: track.$id, fileId: fileId }));

      // Update the track document to reflect that processing has started
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        TRACKS_COLLECTION_ID,
        track.$id,
        {
          'audioFile.hlsProcessingStatus': 'pending',
          updatedAt: new Date().toISOString(),
        }
      );
      console.log(`Track ${track.$id} marked for HLS processing.`);
    } else {
      console.warn(`No track document found referencing file ID ${fileId} for user ${userId}.`);
    }

    return res.json({ status: 'ok', message: `File ${fileId} received for processing.` }, 200);

  } catch (error: any) {
    console.error(`Error processing file ${fileId}:`, error);
    return res.json({ error: 'Internal Server Error', detail: error.message }, 500);
  }
};