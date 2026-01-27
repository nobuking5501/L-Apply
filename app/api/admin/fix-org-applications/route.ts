import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/fix-org-applications?orgId=xxx
 * Fix missing organizationId in applications for a specific organization
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing orgId parameter' },
        { status: 400 }
      );
    }

    ensureAdminInitialized();
    const db = getAdminDb();

    const result: any = {
      success: false,
      orgId,
      organization: null,
      users: [],
      fixedCount: 0,
      alreadyFixedCount: 0,
      totalCount: 0,
      fixedApplications: [],
    };

    // 組織情報を取得
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = orgDoc.data();
    result.organization = {
      id: orgDoc.id,
      name: orgData?.name,
    };

    // この組織に紐づくユーザーを取得
    const usersSnapshot = await db
      .collection('users')
      .where('organizationId', '==', orgId)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'No users found for this organization' },
        { status: 404 }
      );
    }

    const userIds: string[] = [];
    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      result.users.push({
        userId: doc.id,
        displayName: userData.displayName || null,
      });
      userIds.push(doc.id);
    });

    // 各ユーザーの申込をチェックして修正
    for (const userId of userIds) {
      const applicationsSnapshot = await db
        .collection('applications')
        .where('userId', '==', userId)
        .get();

      if (applicationsSnapshot.empty) {
        continue;
      }

      for (const doc of applicationsSnapshot.docs) {
        const data = doc.data();
        result.totalCount++;

        if (!data.organizationId) {
          // organizationIdを設定
          await db.collection('applications').doc(doc.id).update({
            organizationId: orgId,
          });

          result.fixedCount++;
          result.fixedApplications.push({
            applicationId: doc.id,
            userId: data.userId,
            status: data.status,
            slotAt: data.slotAt?.toDate?.()?.toISOString() || null,
          });
        } else {
          result.alreadyFixedCount++;
        }
      }
    }

    result.success = true;

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error fixing org applications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
