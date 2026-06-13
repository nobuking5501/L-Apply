import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';
import { validateApiKey } from '@/lib/external-api-auth';

export const dynamic = 'force-dynamic';

// Error codes thrown inside transactions to signal business-logic failures
const ERR_SLOT_FULL = 'SLOT_FULL';
const ERR_EVENT_NOT_FOUND = 'EVENT_NOT_FOUND';
const ERR_SLOT_NOT_FOUND = 'SLOT_NOT_FOUND';

export async function POST(request: NextRequest) {
  const ctx = await validateApiKey(request);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { eventId, slotId, slotAt, applicantName, applicantPhone, notes } = body;

  if (!eventId || !slotId || !slotAt || !applicantName) {
    return NextResponse.json(
      { error: 'Missing required fields: eventId, slotId, slotAt, applicantName' },
      { status: 400 }
    );
  }

  const slotAtDate = new Date(slotAt);
  if (isNaN(slotAtDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid slotAt format. Use ISO 8601 (e.g. 2026-07-10T10:00:00+09:00)' },
      { status: 400 }
    );
  }

  try {
    ensureAdminInitialized();
    const db = getAdminDb();

    // ── Phase 1: Pre-transaction reads (non-atomic, used for validation + bootstrap) ──

    const [eventDoc, existingAppsSnapshot] = await Promise.all([
      db.collection('events').doc(eventId).get(),
      // Bootstrap query: count existing active applications for this slot.
      // This is only used when the counter document doesn't exist yet.
      // The transaction itself is the source of truth once the counter is created.
      db.collection('applications')
        .where('organizationId', '==', ctx.organizationId)
        .where('slotId', '==', slotId)
        .get(),
    ]);

    if (!eventDoc.exists || eventDoc.data()?.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data()!;
    const slot = (eventData.slots || []).find((s: any) => s.id === slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const capacity: number = slot.maxCapacity || 0;

    // Bootstrap count: active applications already in DB (pre-transaction snapshot)
    const bootstrapCount = existingAppsSnapshot.docs.filter((d) => {
      const s = d.data().status;
      return s === 'applied' || s === 'confirmed' || s === 'pending';
    }).length;

    // ── Phase 2: Atomic transaction ──
    //
    // Counter document tracks the number of active applications per slot.
    // All concurrent requests serialize through this document, preventing
    // over-booking even under simultaneous load.
    //
    // Bootstrap: if the counter does not yet exist, we initialize it from the
    // pre-query above. If two concurrent requests both find no counter and both
    // try to create it, Firestore's MVCC retries the loser, which will then read
    // the winner's newly created counter on the second attempt.

    const counterRef = db
      .collection('slot_application_counts')
      .doc(`${ctx.organizationId}_${slotId}`);

    const appRef = db.collection('applications').doc();

    const phoneUserId = `phone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const applicationData: Record<string, any> = {
      userId: phoneUserId,
      organizationId: ctx.organizationId,
      eventId,
      slotId,
      slotAt: slotAtDate,
      plan: 'phone',
      status: 'applied',
      source: 'phone',
      name: String(applicantName).trim(),
      phone: applicantPhone ? String(applicantPhone).trim() : null,
      notes: notes ? String(notes).trim() : null,
      reminderStatus: 'none',
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.runTransaction(async (tx) => {
      const counterDoc = await tx.get(counterRef);

      let currentCount: number;

      if (!counterDoc.exists) {
        // First time this slot is accessed through the external API.
        // Use the bootstrap count from the pre-transaction query.
        currentCount = bootstrapCount;
      } else {
        currentCount = counterDoc.data()?.count ?? 0;
      }

      if (capacity > 0 && currentCount >= capacity) {
        const err = new Error(ERR_SLOT_FULL) as any;
        err.capacity = capacity;
        err.currentCount = currentCount;
        throw err;
      }

      // Write the application document
      tx.set(appRef, applicationData);

      // Update (or create) the counter atomically
      if (!counterDoc.exists) {
        tx.set(counterRef, {
          count: bootstrapCount + 1,
          organizationId: ctx.organizationId,
          slotId,
          eventId,
          capacity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.update(counterRef, {
          count: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: appRef.id,
        message: '申込みを受け付けました',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === ERR_SLOT_FULL) {
      return NextResponse.json(
        {
          error: 'この日程は満席です',
          availableCount: 0,
          capacity: error.capacity,
          applicationCount: error.currentCount,
        },
        { status: 409 }
      );
    }

    console.error('[External API /applications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
