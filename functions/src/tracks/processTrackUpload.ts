import * as admin from 'firebase-admin';
import { onObjectFinalized, StorageEvent } from 'firebase-functions/v2/storage';
import { db } from '../firebaseAdmin'; // Import db from firebaseAdmin

// Get the storage bucket name from environment variables
// This environment variable should be set in your Firebase project config or .env for local emulation.
const STORAGE_BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET;

export const processTrackUpload = onObjectFinalized({ bucket: STORAGE_BUCKET_NAME }, async (event: StorageEvent) => {
  if (!STORAGE_BUCKET_NAME) {
    console.error('FIREBASE_STORAGE_BUCKET environment variable is not set.');
    return null;
  }

  const file = event.data;

  if (!file || !file.name) {
    console.error('No file data found in storage event.');
    return null;
  }

  // onObjectFinalized only triggers for new or overwritten objects, so resourceState check is not needed here.
  // If you need to handle deletions, use onObjectDeleted.

  console.log(`Processing uploaded file: ${file.name} in bucket: ${file.bucket}`);

  // Example: masters/{uid}/{fileName}
  const filePath = file.name;
  const pathParts = filePath.split('/');
  if (pathParts.length < 2 || pathParts[0] !== 'masters') {
    console.warn(`File ${filePath} is not in the expected 'masters/{uid}/' path. Skipping.`);
    return null;
  }

  const userId = pathParts[1]; // Assuming the second part is the userId
  const originalFileName = pathParts.slice(2).join('/'); // Get the original file name

  try {
    // TODO: Implement actual HLS transcoding here.
    // This would typically involve:
    // 1. Downloading the file to a temporary location.
    // 2. Using ffmpeg to transcode to HLS (e.g., 96/128/192 kbps AAC).
    // 3. Uploading HLS segments and master playlist to 'hls/{trackId}/index.m3u8'.
    // 4. Generating a unique trackId and updating Firestore.

    console.log(`Placeholder: Transcoding for user ${userId}, file ${originalFileName} would happen here.`);
    console.log(`Placeholder: HLS files would be stored in 'hls/{trackId}/index.m3u8'.`);

    // For now, let's just log and potentially update a placeholder track document
    // In a real scenario, you'd create a new 'track' document in Firestore here
    // with details about the original file and the HLS stream paths.

    // Example: Create a placeholder track document in Firestore
    const trackRef = db.collection('tracks').doc(); // Generate a new ID for the track
    await trackRef.set({
      id: trackRef.id,
      artistId: userId, // Assuming userId is the artistId for now
      title: originalFileName.split('.').slice(0, -1).join('.'), // Title from filename
      duration: 0, // Placeholder, would be determined by ffmpeg
      accessMode: 'public', // Default access mode
      audioFile: {
        original: filePath,
        hls: `hls/${trackRef.id}/index.m3u8`, // Placeholder HLS path
      },
      coverArt: null,
      isExplicit: false,
      isPublished: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Add other necessary fields as per your Track interface
    }, { merge: true });

    console.log(`Placeholder track document created for ${originalFileName} with ID: ${trackRef.id}`);

    return null;
  } catch (error) {
    console.error(`Error processing track upload for ${filePath}:`, error);
    return null;
  }
});