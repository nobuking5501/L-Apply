import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/check-line-users?userId=xxx
 * Check if user exists in line_users collection (used by Cloud Functions)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    ensureAdminInitialized();
    const db = getAdminDb();

    const result: any = {
      userId,
      lineUserExists: false,
      lineUserData: null,
      usersCollectionData: null,
    };

    // Check line_users collection (used by Cloud Functions webhook)
    const lineUserDoc = await db.collection('line_users').doc(userId).get();

    if (lineUserDoc.exists) {
      result.lineUserExists = true;
      const data = lineUserDoc.data();
      result.lineUserData = {
        userId: data?.userId,
        displayName: data?.displayName,
        consent: data?.consent,
        organizationId: data?.organizationId,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
      };
    }

    // Also check users collection for comparison
    const usersDoc = await db.collection('users').doc(userId).get();

    if (usersDoc.exists) {
      const data = usersDoc.data();
      result.usersCollectionData = {
        userId: data?.userId,
        displayName: data?.displayName,
        organizationId: data?.organizationId,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
      };
    }

    result.summary = {
      existsInLineUsers: result.lineUserExists,
      existsInUsersCollection: usersDoc.exists,
      note: 'Cloud Functions webhook uses line_users collection',
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error checking line users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
