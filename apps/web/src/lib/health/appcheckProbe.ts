import { getToken, AppCheckTokenResult } from 'firebase/app-check';
import { appCheck } from '@humane/lib/firebase';

// Extend the AppCheckTokenResult type to include expireTimeMillis
interface ExtendedAppCheckTokenResult extends AppCheckTokenResult {
  expireTimeMillis: number;
}

export async function appCheckHealth() {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();
  if (!key) return { skipped: true };
  try {
    if (!appCheck) {
      return { ok: false, error: 'App Check is not initialized.' };
    }
    const tokenResult = await getToken(appCheck, /* forceRefresh */ false) as ExtendedAppCheckTokenResult;
    const ttl = tokenResult.expireTimeMillis - Date.now(); // Calculate TTL
    return { ok: true, ttl: ttl };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}