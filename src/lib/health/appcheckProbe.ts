import { getToken, AppCheckTokenResult } from 'firebase/app-check'; // Import AppCheckTokenResult
import { appCheck } from '../firebase'; // Import appCheck instance

export async function appCheckHealth() {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();
  if (!key) return { skipped: true };
  try {
    if (!appCheck) {
      return { ok: false, error: 'App Check is not initialized.' };
    }
    const tokenResult: AppCheckTokenResult = await getToken(appCheck, /* forceRefresh */ false);
    const ttl = tokenResult.expireTimeMillis - Date.now(); // Calculate TTL
    return { ok: true, ttl: ttl };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}