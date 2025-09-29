import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import Stripe from 'stripe';
import { db } from '../firebaseAdmin'; // Import db from our shared admin module

const corsHandler = cors({ origin: true });
const stripe = new Stripe(process.env.STRIPE_SECRET as string, { apiVersion: '2024-06-20' });

export const stripeWebhooks = onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    const sig = req.headers['stripe-signature'] as string;
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`); return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        // TODO: write subscription/tip receipt to Firestore
        console.log('Stripe Webhook: checkout.session.completed', event.data.object);
        break;
      case 'payment_intent.succeeded':
        // TODO: mark payment success
        console.log('Stripe Webhook: payment_intent.succeeded', event.data.object);
        break;
      // Add other Stripe event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
  });
});