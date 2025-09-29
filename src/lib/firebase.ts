import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined, // Ensure it's undefined if not set
};

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfigKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingConfig.length > 0) {
  const errorMessage = `Firebase initialization failed: Missing environment variables for: ${missingConfig.join(', ')}. Please ensure your .env.local file is correctly configured.`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Cast to FirebaseOptions directly
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  }
}

let appCheckInstance: AppCheck | undefined;

if (typeof window !== 'undefined') {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  console.log('App Check reCAPTCHA Site Key:', recaptchaSiteKey); // Added for debugging
  
  let isValidRecaptchaKey = false;
  if (typeof recaptchaSiteKey === 'string' && recaptchaSiteKey.trim() !== '') {
    isValidRecaptchaKey = true;
  }

  if (!isValidRecaptchaKey) {
    console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set or is empty. Firebase App Check will not be initialized.');
  } else {
    if (process.env.NEXT_PUBLIC_APPCHECK_DEBUG === 'true') {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    try {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey as string), // Use the validated key
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e: any) {
      console.warn('Firebase App Check initialization failed, likely already initialized or an environment issue:', e);
    }
  }
}

export const appCheck = appCheckInstance;

export const analyticsPromise: Promise<Analytics | null> = isSupported().then((ok) => (ok ? getAnalytics(app) : null));

export default app;