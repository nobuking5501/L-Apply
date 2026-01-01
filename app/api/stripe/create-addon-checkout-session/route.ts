import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { STRIPE_ADDONS } from '@/lib/stripe-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, addonId } = body;

    console.log('[Addon Checkout] Request:', { organizationId, addonId });

    if (!organizationId || !addonId) {
      return NextResponse.json(
        { error: 'organizationId and addonId are required' },
        { status: 400 }
      );
    }

    // Get addon configuration
    const addonConfig = STRIPE_ADDONS[addonId];
    if (!addonConfig) {
      console.error('[Addon Checkout] Invalid addon:', addonId);
      return NextResponse.json({ error: 'Invalid addon' }, { status: 400 });
    }

    console.log('[Addon Checkout] Addon config:', addonConfig);

    // Get the base URL for redirects - ensure it's always defined
    const vercelUrl = process.env.VERCEL_URL;
    const publicUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const baseUrl = vercelUrl
      ? `https://${vercelUrl}`
      : (publicUrl || 'http://localhost:3001');

    console.log('[Addon Checkout] Base URL:', baseUrl);
    console.log('[Addon Checkout] Environment:', {
      hasVercelUrl: !!vercelUrl,
      hasPublicUrl: !!publicUrl,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    });

    // Validate Stripe price ID
    if (!addonConfig.stripePriceId) {
      console.error('[Addon Checkout] Missing stripePriceId in addon config');
      return NextResponse.json(
        { error: 'Invalid addon configuration: missing price ID' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session for one-time payment
    console.log('[Addon Checkout] Creating Stripe session...');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment mode
      payment_method_types: ['card'],
      line_items: [
        {
          price: addonConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/stripe-success/addon?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/settings?addon_canceled=true`,
      metadata: {
        organizationId,
        addonId,
      },
      client_reference_id: organizationId,
      // Allow customer to enter promotional codes
      allow_promotion_codes: true,
    });

    console.log('[Addon Checkout] Session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Addon Checkout] Error creating checkout session:', error);
    console.error('[Addon Checkout] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
