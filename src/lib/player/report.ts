import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Assuming firebase.ts exports 'app'
import { generateUuid } from '@/lib/utils/security'; // Import generateUuid

// Define the endpoint for the Cloud Function
const REPORT_PLAY_BATCH_ENDPOINT = 'http://localhost:5001/humane-io/us-central1/reportPlayBatch'; // Adjust for production

interface PlayEvent {
  trackId: string;
  sessionId: string; // Client-generated UUID
  duration: number; // ms played
  trackFullDurationMs: number; // full duration of the track in ms
  completed: boolean;
  deviceInfo: {
    userAgent: string;
    // ipAddress is determined server-side
    country?: string;
  };
  timestamp: string; // ISO string
}

export async function reportPlayBatchToFunction(plays: Omit<PlayEvent, 'sessionId'>[]) {
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('User not authenticated. Cannot report plays.');
    throw new Error('Authentication required to report plays.');
  }

  const idToken = await currentUser.getIdToken();
  const appCheckToken = await getAppCheckToken(); // Get App Check token

  // Generate a single sessionId for the entire batch if not already present in individual plays
  const batchSessionId = generateUuid();

  const playsWithSessionId: PlayEvent[] = plays.map(play => ({
    ...play,
    sessionId: batchSessionId, // Assign the generated session ID
  }));

  try {
    const response = await fetch(REPORT_PLAY_BATCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'X-Firebase-AppCheck': appCheckToken || '', // Include App Check token
      },
      body: JSON.stringify({ plays: playsWithSessionId }),
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

// Placeholder for App Check token retrieval
// This will be properly implemented with Firebase App Check SDK
async function getAppCheckToken(): Promise<string | undefined> {
  // TODO: Implement actual App Check token retrieval using firebase/app-check
  // For now, return a placeholder or undefined
  console.warn('App Check token retrieval not fully implemented. Returning placeholder.');
  return 'fake-app-check-token'; 
}