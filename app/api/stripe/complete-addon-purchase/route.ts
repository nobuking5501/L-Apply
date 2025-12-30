import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { STRIPE_ADDONS } from '@/lib/stripe-config';

// Import Firebase client SDK instead of Admin SDK
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase Client SDK if not already initialized
if (getApps().length === 0) {
  initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

const db = getFirestore();

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

    // Return session data to client for updating Firestore
    // Client-side has proper permissions to update Firestore
    return NextResponse.json({
      success: true,
      organizationId,
      addonId,
      addonName: addonConfig.name,
      stripePaymentIntentId: session.payment_intent,
      amountPaid: session.amount_total ? session.amount_total / 100 : addonConfig.price,
    });
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
