import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getPlanConfig } from '@/lib/stripe-config';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Retrieve the Stripe Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get organization ID from session metadata
    const organizationId = session.metadata?.organizationId || session.client_reference_id;
    const planId = session.metadata?.planId;

    if (!organizationId || !planId) {
      return NextResponse.json(
        { error: 'Missing organizationId or planId in session' },
        { status: 400 }
      );
    }

    // Get plan configuration
    const planConfig = getPlanConfig(planId);
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Verify payment was successful
    if (session.status !== 'complete') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Update Firestore using Admin SDK (server-side, no auth required)
    try {
      const db = getAdminDb();
      const orgRef = db.collection('organizations').doc(organizationId);

      // Calculate subscription period (30 days)
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Update organization document with subscription
      await orgRef.set({
        subscription: {
          plan: planId,
          status: 'active',
          limits: planConfig.limits,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          currentPeriodStart: FieldValue.serverTimestamp(),
          currentPeriodEnd: periodEnd,
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log('✅ Subscription activated for organization:', organizationId);

      return NextResponse.json({
        success: true,
        organizationId,
        planId,
      });
    } catch (firestoreError) {
      console.error('❌ Firestore update error:', firestoreError);
      return NextResponse.json(
        {
          error: 'Payment succeeded but failed to update database',
          details: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error completing subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete subscription',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
