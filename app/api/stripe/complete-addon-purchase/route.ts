import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { STRIPE_ADDONS } from '@/lib/stripe-config';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    console.log('[Complete Addon] Starting addon purchase completion:', { sessionId });

    if (!sessionId) {
      console.error('[Complete Addon] Missing sessionId in request');
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Retrieve the Stripe Checkout Session
    console.log('[Complete Addon] Retrieving Stripe session...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      console.error('[Complete Addon] Session not found:', sessionId);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('[Complete Addon] Session retrieved:', {
      id: session.id,
      mode: session.mode,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    });

    // Get organization ID and addon ID from session metadata
    const organizationId = session.metadata?.organizationId || session.client_reference_id;
    const addonId = session.metadata?.addonId;

    if (!organizationId || !addonId) {
      return NextResponse.json(
        { error: 'Missing organizationId or addonId in session' },
        { status: 400 }
      );
    }

    // Get addon configuration
    const addonConfig = STRIPE_ADDONS[addonId];
    if (!addonConfig) {
      return NextResponse.json(
        { error: 'Invalid addon' },
        { status: 400 }
      );
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Update Firestore using Admin SDK (server-side, no auth required)
    try {
      console.log('[Complete Addon] Getting Firebase Admin DB...');
      const db = getAdminDb();
      const orgRef = db.collection('organizations').doc(organizationId);

      console.log('[Complete Addon] Fetching organization document...');
      const orgDoc = await orgRef.get();

      if (!orgDoc.exists) {
        console.error('[Complete Addon] Organization not found:', organizationId);
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      const existingAddons = orgDoc.data()?.addons || {};
      console.log('[Complete Addon] Existing addons:', existingAddons);

      // Prepare addon data
      const addonData = {
        purchased: true,
        purchasedAt: FieldValue.serverTimestamp(),
        stripePaymentIntentId: session.payment_intent,
        amountPaid: session.amount_total ? session.amount_total / 100 : addonConfig.price,
        source: 'client_api',
      };

      console.log('[Complete Addon] Updating organization with addon data:', {
        organizationId,
        addonId,
        addonData,
      });

      // Update organization document with addon purchase
      await orgRef.set({
        addons: {
          ...existingAddons,
          [addonId]: addonData,
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log('[Complete Addon] ✅ Addon purchase completed for organization:', organizationId);
      console.log('[Complete Addon] ✅ Addon name:', addonConfig.name);

      return NextResponse.json({
        success: true,
        organizationId,
        addonId,
        addonName: addonConfig.name,
      });
    } catch (firestoreError) {
      console.error('[Complete Addon] ❌ Firestore update error:', firestoreError);
      console.error('[Complete Addon] ❌ Error details:', {
        message: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
        stack: firestoreError instanceof Error ? firestoreError.stack : undefined,
        organizationId,
        addonId,
      });
      return NextResponse.json(
        {
          error: 'Payment succeeded but failed to update database',
          details: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error completing addon purchase:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete addon purchase',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
