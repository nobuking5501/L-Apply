import Stripe from 'stripe';

// Get Stripe secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('[Stripe] STRIPE_SECRET_KEY is not set in environment variables');
  console.error('[Stripe] Available env vars:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Clean the key - remove any potential whitespace or newlines
const cleanedKey = stripeSecretKey.trim();

// Debug info
console.log('[Stripe] Original key length:', stripeSecretKey.length);
console.log('[Stripe] Cleaned key length:', cleanedKey.length);
console.log('[Stripe] Key has whitespace:', stripeSecretKey !== cleanedKey);
console.log('[Stripe] Initializing Stripe with key:', cleanedKey.substring(0, 20) + '...');

// Initialize Stripe (using default API version from SDK)
export const stripe = new Stripe(cleanedKey, {
  typescript: true,
  timeout: 20000, // 20 second timeout
  maxNetworkRetries: 2,
});
