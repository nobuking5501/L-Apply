import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getPlanConfig } from '@/lib/stripe-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, planId, usePopup } = body;

    console.log('[Subscription Checkout] 🎯 Request:', { organizationId, planId, usePopup });

    if (!organizationId || !planId) {
      return NextResponse.json(
        { error: 'organizationId and planId are required' },
        { status: 400 }
      );
    }

    // Get plan configuration
    const planConfig = getPlanConfig(planId);
    if (!planConfig) {
      console.error('[Subscription Checkout] Invalid plan:', planId);
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    console.log('[Subscription Checkout] Plan config:', planConfig);

    // Get the base URL for redirects
    const vercelUrl = process.env.VERCEL_URL;
    const publicUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const baseUrl = vercelUrl
      ? `https://${vercelUrl}`
      : (publicUrl || 'http://localhost:3001');

    console.log('[Subscription Checkout] Base URL:', baseUrl);

    // ポップアップモードの場合は success_url にパラメータを追加
    const successUrl = usePopup
      ? `${baseUrl}/payment-success/subscription?session_id={CHECKOUT_SESSION_ID}&popup=true`
      : `${baseUrl}/payment-success/subscription?session_id={CHECKOUT_SESSION_ID}`;

    console.log('[Subscription Checkout] Success URL:', successUrl);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: `${baseUrl}/dashboard/subscription?canceled=true`,
      metadata: {
        organizationId,
        planId,
      },
      client_reference_id: organizationId,
      // Allow customer to enter promotional codes
      allow_promotion_codes: true,
    });

    console.log('[Subscription Checkout] 🎯 Session created:', session.id);
    console.log('[Subscription Checkout] 🎯 Session metadata:', session.metadata);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
