import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { STRIPE_ADDONS } from '@/lib/stripe-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, addonId } = body;

    if (!organizationId || !addonId) {
      return NextResponse.json(
        { error: 'organizationId and addonId are required' },
        { status: 400 }
      );
    }

    // Get addon configuration
    const addonConfig = STRIPE_ADDONS[addonId];
    if (!addonConfig) {
      return NextResponse.json({ error: 'Invalid addon' }, { status: 400 });
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3001';

    // Create Stripe Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment mode
      payment_method_types: ['card'],
      line_items: [
        {
          price: addonConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/subscription/addon-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/settings?addon_canceled=true`,
      metadata: {
        organizationId,
        addonId,
      },
      client_reference_id: organizationId,
      // Allow customer to enter promotional codes
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating addon checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
