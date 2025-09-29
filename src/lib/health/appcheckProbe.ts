import { getToken } from 'firebase/app-check';
import { app } from '../firebase';

export async function appCheckHealth() {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();
  if (!key) return { skipped: true };
  try {
    // The 'app' object is typed as FirebaseApp, which is compatible with getToken.
    // No need for 'as any' if FirebaseApp type is correctly inferred.
    const token = await getToken(app, /* forceRefresh */ false);
    return { ok: true, ttl: token.ttlMillis };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}