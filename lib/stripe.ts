import Stripe from 'stripe';

// Get Stripe secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('[Stripe] STRIPE_SECRET_KEY is not set in environment variables');
  console.error('[Stripe] Available env vars:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe with API version
console.log('[Stripe] Initializing Stripe with key:', stripeSecretKey.substring(0, 7) + '...');
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
