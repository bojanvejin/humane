import { initializeApp, getApps } from 'firebase/app'; // Removed getAppCheck from here
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider, getAppCheck } from '@firebase/app-check'; // Corrected import for getAppCheck

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app, ensuring it's only initialized once
export const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize App Check in the browser only (and only once)
declare global {
  // allow dev debug token usage
  interface Window { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string }
}

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  if (process.env.NEXT_PUBLIC_APPCHECK_DEBUG === 'true') {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  // Initialize App Check if not already initialized for this app instance
  if (!getApps().some(app => app.name === 'DEFAULT' && getAppCheck(app, false))) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

// Initialize Analytics only if supported (client-side)
export const analyticsPromise = isSupported().then((ok) => ok ? getAnalytics(app) : null);

export default app;