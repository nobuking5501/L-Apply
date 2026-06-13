import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';
import { validateApiKey } from '@/lib/external-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    ensureAdminInitialized();
    const db = getAdminDb();
    const now = new Date();

    const [eventsSnapshot, applicationsSnapshot] = await Promise.all([
      db
        .collection('events')
        .where('organizationId', '==', ctx.organizationId)
        .where('isActive', '==', true)
        .get(),
      db
        .collection('applications')
        .where('organizationId', '==', ctx.organizationId)
        .get(),
    ]);

    // Count active applications per slotId
    const slotCounts = new Map<string, number>();
    for (const appDoc of applicationsSnapshot.docs) {
      const data = appDoc.data();
      const isActive =
        data.status === 'applied' ||
        data.status === 'confirmed' ||
        data.status === 'pending';
      if (isActive && data.slotId) {
        slotCounts.set(data.slotId, (slotCounts.get(data.slotId) || 0) + 1);
      }
    }

    const events = eventsSnapshot.docs.map((doc) => {
      const data = doc.data();

      const slots = (data.slots || []).map((slot: any) => {
        const count = slotCounts.get(slot.id) || 0;
        const capacity = slot.maxCapacity || 0;
        const available = Math.max(0, capacity - count);

        // Build ISO datetime from date + time fields
        let startAt: string | null = null;
        try {
          if (slot.date && slot.time) {
            startAt = new Date(`${slot.date}T${slot.time}:00+09:00`).toISOString();
          }
        } catch {
          // leave null if parsing fails
        }

        return {
          id: slot.id,
          date: slot.date ?? null,
          time: slot.time ?? null,
          startAt,
          capacity,
          applicationCount: count,
          availableCount: available,
          isAvailable: available > 0,
          isFuture: startAt ? new Date(startAt) > now : false,
        };
      });

      const nextAvailableSlot =
        slots.find((s: any) => s.isAvailable && s.isFuture) ?? null;

      return {
        id: doc.id,
        title: data.title ?? '',
        description: data.description ?? '',
        location: data.location ?? '',
        slots,
        nextAvailableSlot,
      };
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('[External API /events] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
