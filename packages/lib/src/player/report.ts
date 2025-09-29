import { getAuth } from 'firebase/auth';
import { app, appCheck } from '@/lib/firebase'; // Corrected named imports for app and appCheck
import { generateUuid } from '@/lib/utils/security';
import { getToken as getAppCheckToken } from 'firebase/app-check'; // Corrected imports

// Define the endpoint for the Cloud Function
const REPORT_PLAY_BATCH_ENDPOINT =
  process.env.NEXT_PUBLIC_REPORT_PLAY_BATCH_URL ??
  (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'
    ? 'http://127.0.0.1:5002/humane-io/us-central1/reportPlayBatch'
    : 'https://us-central1-humane-io.cloudfunctions.net/reportPlayBatch');

interface PlayEventPayload {
  eventId: string; // Client-generated UUID for this specific event
  trackId: string;
  sessionId: string; // Client-generated UUID for session
  duration: number; // ms played
  trackFullDurationMs: number; // full duration of the track in ms
  completed: boolean;
  deviceInfo: {
    userAgent: string;
    country?: string;
  };
  timestamp: string; // ISO string
}

export async function reportPlayBatchToFunction(plays: Omit<PlayEventPayload, 'eventId' | 'sessionId'>[]) {
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('User not authenticated. Cannot report plays.');
    throw new Error('Authentication required to report plays.');
  }

  const idToken = await currentUser.getIdToken();
  
  // Get App Check token from the initialized App Check instance
  let appCheckToken: string | undefined;
  try {
    if (appCheck) { // Use the globally exported appCheck instance
      const tokenResult = await getAppCheckToken(appCheck);
      appCheckToken = tokenResult.token;
    } else {
      console.warn('App Check is not initialized. Proceeding without App Check token.');
    }
  } catch (error) {
    console.error('Error getting App Check token:', error);
    // Depending on your App Check enforcement, you might want to throw here
    // or proceed without the token (if in debug mode or non-critical path).
  }

  // Generate a single sessionId for the entire batch
  const batchSessionId = generateUuid();

  const playsWithIds: PlayEventPayload[] = plays.map(play => ({
    ...play,
    eventId: generateUuid(), // Generate a unique eventId for each play in the batch
    sessionId: batchSessionId, // Assign the generated session ID to all plays in the batch
  }));

  try {
    const response = await fetch(REPORT_PLAY_BATCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'X-Firebase-AppCheck': appCheckToken || '', // Include App Check token
      },
      body: JSON.stringify({ plays: playsWithIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error reporting play batch:', errorData);
      throw new Error(errorData.message || 'Failed to report play batch.');
    }

    const result = await response.json();
    console.log('Play batch reported successfully:', result);
    return result;
  } catch (error) {
    console.error('Error reporting play batch:', error);
    throw error;
  }
}

// Helper to get basic device info (client-side)
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    country: undefined, // Can be determined via IP lookup server-side
  };
}