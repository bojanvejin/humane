import { onRequest, Request, Response } from 'firebase-functions/v2/https';
import cors from 'cors';
import Stripe from 'stripe';
const corsHandler = cors({ origin: true });
const stripe = new Stripe(process.env.STRIPE_SECRET as string, { apiVersion: '2024-06-20' });

export const createStripeConnectAccount = onRequest(async (req: Request, res: Response) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'POST only' });
      return;
    }

    // TODO: verify caller is the artist (e.g., using Firebase Auth ID token)
    // For now, we'll assume the request is authorized.
    console.log('Creating Stripe Connect Express account...');
    const account = await stripe.accounts.create({ type: 'express' });
    
    // Replace with your actual app URLs
    const refreshUrl = 'http://localhost:3000/artist/stripe/refresh'; // Example for local dev
    const returnUrl = 'http://localhost:3000/artist/stripe/return'; // Example for local dev

    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    console.log('Stripe Connect account created:', account.id);
    res.json({ onboardingUrl: link.url, accountId: account.id });
  });
});