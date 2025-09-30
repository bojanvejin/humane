import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics'; // Added getAnalytics and isSupported

// Helper function to get environment variables with a check
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}. Please check your .env.local file.`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID'),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // Optional, so no strict check
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Added measurementId
};

const app =
  getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

// ── App Check (browser only) ───────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __appCheckInit: boolean | undefined;
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}

let appCheckInstance: AppCheck | undefined; // Declare appCheckInstance here

if (typeof window !== 'undefined' && !globalThis.__appCheckInit) {
  try {
    const rawKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const finalRecaptchaSiteKey =
      typeof rawKey === 'string' && rawKey.trim().length > 0 ? rawKey.trim() : null;

    // Optional: easy local debug
    if (process.env.NEXT_PUBLIC_APPCHECK_DEBUG === 'true') {
      globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    if (finalRecaptchaSiteKey) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(finalRecaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      globalThis.__appCheckInit = true;
    } else {
      // If you *require* App Check in prod, surface a loud error there:
      const mustHaveKey =
        process.env.NODE_ENV === 'production' &&
        process.env.NEXT_PUBLIC_USE_EMULATORS !== 'true';

      const msg =
        'AppCheck: NEXT_PUBLIC_RECAPTCHA_SITE_KEY missing/empty; skipping initializeAppCheck.';
      if (mustHaveKey) throw new Error(msg);
      if (process.env.NODE_ENV !== 'test') console.warn(msg);
    }
  } catch (err) {
    // Don’t crash the app—log once and continue (Auth/DB still work).
    if (process.env.NODE_ENV !== 'test') {
      console.error('AppCheck init failed:', err);
    }
  }
}

// ── Analytics (browser only) ───────────────────────────────────────────────────
export const analyticsPromise = typeof window !== 'undefined' && isSupported()
  ? getAnalytics(app)
  : Promise.resolve(null);

// ── Exports ───────────────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app }; // Explicitly export the app instance
export const appCheck = appCheckInstance; // Export appCheckInstance as appCheck