import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getPlanConfig } from '@/lib/stripe-config';

// Import Firebase client SDK instead of Admin SDK
// This allows us to avoid Firebase Admin authentication issues
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';

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

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();

  if (!reader) {
    throw new Error('No body');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await getRawBody(request);
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId || session.client_reference_id;
  const planId = session.metadata?.planId;

  if (!organizationId || !planId) {
    console.error('Missing organizationId or planId in session metadata');
    return;
  }

  const planConfig = getPlanConfig(planId);
  if (!planConfig) {
    console.error('Invalid planId:', planId);
    return;
  }

  try {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      console.error('Organization not found:', organizationId);
      return;
    }

    // Update organization with new subscription info
    await updateDoc(orgRef, {
      'subscription.plan': planId,
      'subscription.status': 'active',
      'subscription.limits': planConfig.limits,
      'subscription.stripeCustomerId': session.customer,
      'subscription.stripeSubscriptionId': session.subscription,
      'subscription.currentPeriodStart': Timestamp.now(),
      'subscription.currentPeriodEnd': Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ),
      updatedAt: Timestamp.now(),
    });

    console.log('Subscription activated for organization:', organizationId);
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.log('No organizationId in subscription metadata');
    return;
  }

  try {
    const orgRef = doc(db, 'organizations', organizationId);

    const status = subscription.status === 'active' ? 'active' :
                   subscription.status === 'past_due' ? 'past_due' :
                   subscription.status === 'canceled' ? 'canceled' : 'trial';

    // Type assertion for period timestamps
    const sub = subscription as any;

    await updateDoc(orgRef, {
      'subscription.status': status,
      'subscription.currentPeriodStart': Timestamp.fromDate(
        new Date(sub.current_period_start * 1000)
      ),
      'subscription.currentPeriodEnd': Timestamp.fromDate(
        new Date(sub.current_period_end * 1000)
      ),
      updatedAt: Timestamp.now(),
    });

    console.log('Subscription updated for organization:', organizationId);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.log('No organizationId in subscription metadata');
    return;
  }

  try {
    const orgRef = doc(db, 'organizations', organizationId);

    // Revert to test plan when subscription is canceled
    await updateDoc(orgRef, {
      'subscription.plan': 'test',
      'subscription.status': 'canceled',
      'subscription.limits': {
        maxEvents: 3,
        maxStepDeliveries: 3,
        maxReminders: 3,
        maxApplicationsPerMonth: 10,
      },
      updatedAt: Timestamp.now(),
    });

    console.log('Subscription canceled for organization:', organizationId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Type assertion for invoice subscription
  const inv = invoice as any;
  const subscription = inv.subscription as string;

  if (!subscription) {
    return;
  }

  console.log('Payment succeeded for subscription:', subscription);
  // Additional logic if needed (e.g., send confirmation email)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Type assertion for invoice subscription
  const inv = invoice as any;
  const subscription = inv.subscription as string;

  if (!subscription) {
    return;
  }

  console.log('Payment failed for subscription:', subscription);
  // Additional logic if needed (e.g., send warning email)
}
