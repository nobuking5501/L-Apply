import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cancel-by-link?applicationId=xxx
 * Cancel application by direct link (for clients who can't use LINE cancel command)
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Missing applicationId parameter' },
        { status: 400 }
      );
    }

    ensureAdminInitialized();
    const db = getAdminDb();

    // Get application
    const appDoc = await db.collection('applications').doc(applicationId).get();

    if (!appDoc.exists) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const appData = appDoc.data();

    if (appData?.status !== 'applied') {
      return NextResponse.json(
        { error: 'Application is not in applied status', currentStatus: appData?.status },
        { status: 400 }
      );
    }

    // Cancel the application
    await db.collection('applications').doc(applicationId).update({
      status: 'canceled',
      canceledAt: new Date(),
    });

    // Cancel reminders
    const remindersSnapshot = await db
      .collection('reminders')
      .where('applicationId', '==', applicationId)
      .where('canceled', '==', false)
      .get();

    const batch = db.batch();
    remindersSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { canceled: true });
    });
    await batch.commit();

    // Cancel step deliveries
    const stepDeliveriesSnapshot = await db
      .collection('step_deliveries')
      .where('applicationId', '==', applicationId)
      .where('status', '==', 'pending')
      .get();

    const stepBatch = db.batch();
    stepDeliveriesSnapshot.docs.forEach((doc) => {
      stepBatch.update(doc.ref, { status: 'skipped' });
    });
    await stepBatch.commit();

    // Decrement slot capacity if eventId and slotId exist
    if (appData.eventId && appData.slotId) {
      const eventRef = db.collection('events').doc(appData.eventId);
      const eventDoc = await eventRef.get();

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        const slots = eventData?.slots || [];
        const slotIndex = slots.findIndex((s: any) => s.id === appData.slotId);

        if (slotIndex !== -1) {
          const currentCapacity = slots[slotIndex].currentCapacity || 0;
          if (currentCapacity > 0) {
            slots[slotIndex].currentCapacity = currentCapacity - 1;
            await eventRef.update({ slots });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application canceled successfully',
      applicationId,
      slotAt: appData.slotAt?.toDate?.()?.toISOString() || null,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error canceling application:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cancel-by-link?userId=xxx&orgId=xxx
 * Get user's active applications for cancellation
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Missing userId or orgId parameter' },
        { status: 400 }
      );
    }

    ensureAdminInitialized();
    const db = getAdminDb();

    // Get active applications
    const now = new Date();
    const applicationsSnapshot = await db
      .collection('applications')
      .where('userId', '==', userId)
      .where('organizationId', '==', orgId)
      .where('status', '==', 'applied')
      .get();

    const applications = applicationsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          slotAt: data.slotAt?.toDate?.()?.toISOString() || null,
          plan: data.plan || null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          isFuture: data.slotAt?.toDate?.() > now,
        };
      })
      .filter((app) => app.isFuture);  // Only return future applications

    return NextResponse.json({
      userId,
      orgId,
      applications,
      count: applications.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error getting applications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
