import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler'; // Import onSchedule from v2

admin.initializeApp();

// Export all functions
export { reportPlayBatch } from './plays/reportPlayBatch'; // Now an onRequest function (v2)
export { materializeRaw } from './plays/materializeRaw'; // Now an onDocumentCreated function (v2)
export { calculateUCPSPayouts } from './payouts/calculateUCPSPayouts';
export { handleStripeWebhook } from './stripe/webhooks';
export { createStripeConnectAccount } from './stripe/connect';
export { processTrackUpload } from './tracks/processTrackUpload';

// Scheduled functions (v2)
export const scheduledUCPSCalculation = onSchedule('0 0 * * *', async (event) => { // Converted to v2 onSchedule
    console.log('Running scheduled UCPS calculation (v2).');
    // await calculateUCPSPayouts(); // Uncomment when calculateUCPSPayouts is ready
});