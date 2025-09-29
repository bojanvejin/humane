import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { db, FieldValue } from '../firebaseAdmin'; // Import db and FieldValue from our shared admin module
import { Play, Subscription, Payout } from '../types';

// Helper to sum an array of numbers
const sum = (arr: number[]): number => arr.reduce((acc, val) => acc + val, 0);

export const calculateUCPSPayouts = onSchedule({
  schedule: '0 3 2 * *', // Runs at 03:00 on the 2nd of every month
  timeZone: 'America/Los_Angeles', // Specify a timezone, e.g., 'America/Los_Angeles'
}, async (event) => {
  console.log('Running monthly UCPS payout calculation for period:', event.scheduleTime);
  
  // Derive the period (YYYY-MM) for which payouts are being calculated
  const date = new Date(event.scheduleTime);
  date.setMonth(date.getMonth() - 1); // Go back one month to calculate for the *previous* month
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const period = `${year}-${month}`;

  console.log(`Calculating UCPS for period: ${period}`);

  try {
    // 1) Get all active subscriptions for the period
    // For simplicity, we'll fetch all subscriptions and filter by status and period end.
    // In a real system, you might have a more robust way to track subscriptions per period.
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '>=', new Date(`${period}-01T00:00:00Z`)) // Started before or in the period
      .get();

    const activeSubscriptions: Subscription[] = [];
    subscriptionsSnapshot.forEach(doc => {
      const sub = doc.data() as Subscription;
      // Ensure the subscription was active for at least part of the target month
      // This is a simplified check; a more robust system would check billing cycles.
      if (sub.currentPeriodEnd.toDate() >= new Date(`${period}-01T00:00:00Z`)) {
        activeSubscriptions.push({ ...sub, id: doc.id });
      }
    });

    const artistPayouts = new Map<string, number>(); // Map to store total earnings per artist (in cents)

    for (const sub of activeSubscriptions) {
      // For now, let's assume a fixed netMonthly for each subscription.
      // In a real scenario, this would come from Stripe or a subscription plan.
      // For this example, let's use a placeholder value (e.g., $7.65 net distributed from $9 sub)
      const netAllocatableRevenue = sub.netMonthly || 765; // Default to 765 cents ($7.65) if not set

      // Get all qualified (non-suspicious) plays for this user during the period
      const playsSnapshot = await db.collection('plays')
        .where('userId', '==', sub.userId)
        .where('suspicious', '==', false)
        .where('timestamp', '>=', new Date(`${period}-01T00:00:00Z`))
        .where('timestamp', '<', new Date(year, date.getMonth() + 1, 1)) // Plays within the month
        .get();

      const qualifiedPlays: Play[] = [];
      playsSnapshot.forEach(doc => {
        const play = doc.data() as Play;
        // Ensure play has artistIds and duration
        if (play.trackId && play.duration > 0) {
          qualifiedPlays.push({ ...play, id: doc.id });
        }
      });

      if (qualifiedPlays.length === 0) {
        console.log(`User ${sub.userId} had no qualified plays for period ${period}.`);
        continue;
      }

      // Calculate total weighted listen time for this user
      const totalWeightedListenTime = sum(qualifiedPlays.map(p => (p.weight || 1) * (p.duration * 1000))); // duration is in seconds, convert to ms

      if (totalWeightedListenTime === 0) {
        console.log(`User ${sub.userId} had zero total weighted listen time for period ${period}.`);
        continue;
      }

      // Distribute revenue based on listen time
      for (const play of qualifiedPlays) {
        const playWeightedListenTime = (play.weight || 1) * (play.duration * 1000);
        const share = playWeightedListenTime / totalWeightedListenTime;
        const allocatedAmount = netAllocatableRevenue * share;

        // Assuming each play has an associated artistId (or multiple artistIds)
        // For simplicity, we'll assume a single artistId per track for now, or distribute evenly if multiple.
        // The `Track` interface has `artistId` and `collaborators`. The `Play` interface has `artistIds[]`.
        // Let's use `play.artistIds` and distribute evenly among them.
        if (play.artistIds && play.artistIds.length > 0) {
          const amountPerArtist = allocatedAmount / play.artistIds.length;
          for (const artistId of play.artistIds) {
            artistPayouts.set(artistId, (artistPayouts.get(artistId) || 0) + amountPerArtist);
          }
        } else {
          // Fallback if artistIds is missing in play (should ideally not happen)
          console.warn(`Play ${play.id} has no artistIds. Skipping revenue allocation for this play.`);
        }
      }
    }

    // 4) Write payouts to Firestore
    const batch = db.batch();
    for (const [artistId, amount] of artistPayouts.entries()) {
      const payoutRef = db.collection('payouts').doc(`${artistId}_${period}`);
      const payout: Payout = {
        id: `${artistId}_${period}`,
        artistId: artistId,
        period: period,
        totalEarnings: Math.round(amount), // Store in cents, rounded
        breakdown: {
          subscriptions: Math.round(amount), // For now, all from subscriptions
          tips: 0,
          streams: 0,
          directSales: 0,
        },
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      };
      batch.set(payoutRef, payout, { merge: true });
    }
    await batch.commit();

    console.log(`UCPS calculation for period ${period} completed. ${artistPayouts.size} artist payouts generated.`);
    return null;
  } catch (error) {
    console.error(`Error during UCPS calculation for period ${period}:`, error);
    return null;
  }
});