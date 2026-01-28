import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/complete-cancel?applicationId=xxx
 * Complete remaining cancel operations when status is already 'canceled'
 * This handles: canceledAt, reminders, step deliveries, and event capacity
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
    const results: any = {
      applicationId,
      operations: [],
    };

    // 1. Add canceledAt if not exists
    if (!appData?.canceledAt) {
      await db.collection('applications').doc(applicationId).update({
        canceledAt: new Date(),
      });
      results.operations.push('Added canceledAt field');
    } else {
      results.operations.push('canceledAt already exists');
    }

    // 2. Cancel reminders
    const remindersSnapshot = await db
      .collection('reminders')
      .where('applicationId', '==', applicationId)
      .where('canceled', '==', false)
      .get();

    if (!remindersSnapshot.empty) {
      const batch = db.batch();
      remindersSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { canceled: true });
      });
      await batch.commit();
      results.operations.push(`Canceled ${remindersSnapshot.size} reminders`);
    } else {
      results.operations.push('No reminders to cancel');
    }

    // 3. Cancel step deliveries
    const stepDeliveriesSnapshot = await db
      .collection('step_deliveries')
      .where('applicationId', '==', applicationId)
      .where('status', '==', 'pending')
      .get();

    if (!stepDeliveriesSnapshot.empty) {
      const stepBatch = db.batch();
      stepDeliveriesSnapshot.docs.forEach((doc) => {
        stepBatch.update(doc.ref, { status: 'skipped' });
      });
      await stepBatch.commit();
      results.operations.push(`Skipped ${stepDeliveriesSnapshot.size} step deliveries`);
    } else {
      results.operations.push('No step deliveries to skip');
    }

    // 4. Decrement slot capacity if eventId and slotId exist
    if (appData?.eventId && appData?.slotId) {
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
            results.operations.push(`Updated event capacity: ${currentCapacity} → ${currentCapacity - 1}`);
          } else {
            results.operations.push('Event capacity already 0');
          }
        } else {
          results.operations.push('Slot not found in event');
        }
      } else {
        results.operations.push('Event not found');
      }
    } else {
      results.operations.push('No event info (capacity update skipped)');
    }

    return NextResponse.json({
      success: true,
      message: 'Remaining cancel operations completed',
      ...results,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error completing cancel operations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
