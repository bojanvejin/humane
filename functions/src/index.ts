import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();

// Export all functions
export { reportPlayBatch } from './plays/reportPlayBatch'; // Now an onRequest function (v2)
export { materializeRaw } from './plays/materializeRaw'; // Now an onDocumentCreated function (v2)
export { calculateUCPSPayouts } from './payouts/calculateUCPSPayouts';
export { handleStripeWebhook } from './stripe/webhooks';
export { createStripeConnectAccount } from './stripe/connect';
export { processTrackUpload } from './tracks/processTrackUpload';

// Scheduled functions (example, assuming v1 for now or needs v2 conversion)
// For v2 scheduled functions, you'd use `onSchedule` from `firebase-functions/v2/scheduler`
export const scheduledUCPSCalculation = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .timeZone('UTC')
  .onRun(async (context) => {
    // This is a v1 function. If converting to v2, it would look like:
    // import { onSchedule } from 'firebase-functions/v2/scheduler';
    // export const scheduledUCPSCalculation = onSchedule('0 0 * * *', async (event) => { ... });
    console.log('Running scheduled UCPS calculation (v1).');
    // await calculateUCPSPayouts(); // Uncomment when calculateUCPSPayouts is ready
  });