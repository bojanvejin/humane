import { account, functions } from '../appwrite'; // Corrected named imports for app and appCheck
import { generateUuid } from '../utils/security';
import { ID } from 'appwrite'; // Import Appwrite ID

// Define the endpoint for the Appwrite Function
// This will be the Function ID you get from your Appwrite console
const APPWRITE_REPORT_PLAY_FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REPORT_PLAY_FUNCTION_ID!;

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
  const currentUser = await account.get();

  if (!currentUser) {
    console.error('User not authenticated. Cannot report plays.');
    throw new Error('Authentication required to report plays.');
  }

  // Generate a single sessionId for the entire batch
  const batchSessionId = generateUuid();

  const playsWithIds: PlayEventPayload[] = plays.map(play => ({
    ...play,
    eventId: generateUuid(), // Generate a unique eventId for each play in the batch
    sessionId: batchSessionId, // Assign the generated session ID to all plays in the batch
  }));

  try {
    if (!APPWRITE_REPORT_PLAY_FUNCTION_ID) {
      console.error('Appwrite Report Play Function ID is not configured.');
      throw new Error('Appwrite Report Play Function ID is not configured.');
    }

    // Execute the Appwrite Function
    const response = await functions.createExecution(
      APPWRITE_REPORT_PLAY_FUNCTION_ID,
      JSON.stringify({ plays: playsWithIds }),
      false, // async
      '/report-play-batch', // path
      'POST' // method
    );

    // Appwrite function execution response contains stdout, stderr, and status
    if (response.status !== 200) {
      console.error('Error reporting play batch:', response.stderr || response.stdout);
      throw new Error(`Failed to report play batch: ${response.stderr || response.stdout}`);
    }

    const result = JSON.parse(response.stdout);
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