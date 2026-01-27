import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId parameter is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const result: any = {
      orgId,
      organization: null,
      users: [],
      applications: [],
      problematicApplications: [],
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
      name: orgData?.name || null,
      email: orgData?.email || null,
      plan: orgData?.subscription?.plan || null,
      status: orgData?.subscription?.status || null,
      liffId: orgData?.liffId || null,
    };

    // この組織に紐づくユーザーを確認
    const usersSnapshot = await db
      .collection('users')
      .where('organizationId', '==', orgId)
      .get();

    const userIds: string[] = [];
    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      result.users.push({
        userId: doc.id,
        displayName: userData.displayName || null,
        organizationId: userData.organizationId,
      });
      userIds.push(doc.id);
    });

    // 各ユーザーの申込を確認
    if (userIds.length > 0) {
      for (const userId of userIds) {
        const applicationsSnapshot = await db
          .collection('applications')
          .where('userId', '==', userId)
          .where('status', '==', 'applied')
          .get();

        applicationsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const appData = {
            applicationId: doc.id,
            userId: data.userId,
            organizationId: data.organizationId || null,
            status: data.status,
            slotAt: data.slotAt?.toDate?.()?.toISOString() || null,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            hasOrganizationId: !!data.organizationId,
          };

          result.applications.push(appData);

          // organizationIdが設定されていない申込を記録
          if (!data.organizationId) {
            result.problematicApplications.push(appData);
          }
        });
      }
    }

    result.summary = {
      totalUsers: result.users.length,
      totalApplications: result.applications.length,
      problematicApplicationsCount: result.problematicApplications.length,
      canCancel: result.problematicApplications.length === 0,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error checking organization:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
