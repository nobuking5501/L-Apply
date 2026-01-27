import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/test-cancel?userId=xxx&orgId=xxx
 * Test the getLatestApplication query directly
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

    const result: any = {
      userId,
      orgId,
      now: new Date().toISOString(),
      query: {
        userId,
        status: 'applied',
        slotAt: '> now',
        organizationId: orgId,
      },
      foundApplication: null,
      allUserApplications: [],
    };

    // Test the exact query that getLatestApplication uses
    const now = Timestamp.now();

    let query = db
      .collection('applications')
      .where('userId', '==', userId)
      .where('status', '==', 'applied')
      .where('slotAt', '>', now);

    // Add organizationId filter (multi-tenant support)
    query = query.where('organizationId', '==', orgId);

    const snapshot = await query
      .orderBy('slotAt', 'asc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      result.foundApplication = {
        id: doc.id,
        userId: data.userId,
        organizationId: data.organizationId,
        status: data.status,
        slotAt: data.slotAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    }

    // Get all applications for this user (for debugging)
    const allAppsSnapshot = await db
      .collection('applications')
      .where('userId', '==', userId)
      .get();

    allAppsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      result.allUserApplications.push({
        id: doc.id,
        userId: data.userId,
        organizationId: data.organizationId || null,
        status: data.status,
        slotAt: data.slotAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        isPast: data.slotAt?.toDate?.() < new Date(),
      });
    });

    result.summary = {
      foundLatestApplication: result.foundApplication !== null,
      totalUserApplications: result.allUserApplications.length,
      futureApplications: result.allUserApplications.filter((a: any) => !a.isPast).length,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error testing cancel:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
