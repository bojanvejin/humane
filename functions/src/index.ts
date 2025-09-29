import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Export all functions
export { reportPlayBatch } from './plays/reportPlayBatch';
export { calculateUCPSPayouts } from './payouts/calculateUCPSPayouts';
export { handleStripeWebhook } from './stripe/webhooks';
export { createStripeConnectAccount } from './stripe/connect';
export { processTrackUpload } from './tracks/processTrackUpload';

// Scheduled functions
export const scheduledUCPSCalculation = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .timeZone('UTC')
  .onRun(async (context) => {
    await calculateUCPSPayouts();
  });