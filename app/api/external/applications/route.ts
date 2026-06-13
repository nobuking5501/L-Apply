import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';
import { validateApiKey } from '@/lib/external-api-auth';

export const dynamic = 'force-dynamic';

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

    // Verify event belongs to this organization
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists || eventDoc.data()?.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data()!;
    const slot = (eventData.slots || []).find((s: any) => s.id === slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Check remaining capacity
    const existingSnapshot = await db
      .collection('applications')
      .where('organizationId', '==', ctx.organizationId)
      .where('slotId', '==', slotId)
      .get();

    const activeCount = existingSnapshot.docs.filter((d) => {
      const s = d.data().status;
      return s === 'applied' || s === 'confirmed' || s === 'pending';
    }).length;

    const capacity = slot.maxCapacity || 0;
    if (capacity > 0 && activeCount >= capacity) {
      return NextResponse.json(
        {
          error: 'この日程は満席です',
          availableCount: 0,
          capacity,
          applicationCount: activeCount,
        },
        { status: 409 }
      );
    }

    // Internal identifier for phone applicants (no LINE account)
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

    const docRef = await db.collection('applications').add(applicationData);

    return NextResponse.json(
      {
        success: true,
        applicationId: docRef.id,
        message: '申込みを受け付けました',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[External API /applications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
