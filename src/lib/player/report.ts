import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Assuming firebase.ts exports 'app'

const functions = getFunctions(app);
const reportPlayBatchCallable = httpsCallable(functions, 'reportPlayBatch');

interface PlayEvent {
  trackId: string;
  userId: string;
  sessionId: string;
  duration: number; // ms played
  trackFullDurationMs: number; // full duration of the track in ms
  completed: boolean;
  deviceInfo: {
    userAgent: string;
    ipAddress: string; // This should ideally be determined server-side or from a trusted source
    country?: string;
  };
  timestamp: string; // ISO string
}

export async function reportPlayBatchToFunction(plays: PlayEvent[]) {
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('User not authenticated. Cannot report plays.');
    throw new Error('Authentication required to report plays.');
  }

  // For MVP, a simple token derived from UID. In production, this would be a securely signed JWT.
  const token = `HUMANE_PLAY_TOKEN_${currentUser.uid}`; 

  try {
    const result = await reportPlayBatchCallable({ token, plays });
    console.log('Play batch reported successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error reporting play batch:', error);
    throw error;
  }
}

// Helper to get basic device info (client-side)
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    // WARNING: IP address from client-side is unreliable and can be spoofed.
    // For robust fraud detection, IP should be determined server-side.
    // For MVP, we'll send a placeholder or a public IP if available.
    ipAddress: '0.0.0.0', // Placeholder, replace with actual IP if available or fetch server-side
    country: undefined, // Can be determined via IP lookup server-side
  };
}