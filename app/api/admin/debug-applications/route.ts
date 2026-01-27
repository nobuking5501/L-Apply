import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/debug-applications?orgId=xxx
 * Debug all applications to find the issue
 */
export async function GET(request: NextRequest) {
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
      orgId,
      usersInOrg: [],
      allApplications: [],
      applicationsWithStatus: [],
    };

    // 1. Get users in this organization
    const usersSnapshot = await db
      .collection('users')
      .where('organizationId', '==', orgId)
      .get();

    console.log(`Found ${usersSnapshot.size} users in organization ${orgId}`);

    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      result.usersInOrg.push({
        userId: doc.id,
        displayName: userData.displayName,
        organizationId: userData.organizationId,
      });
      console.log(`  User: ${doc.id} (${userData.displayName})`);
    });

    // 2. Get ALL applications (no filters) to see what exists
    const allAppsSnapshot = await db.collection('applications').limit(100).get();

    console.log(`Total applications in database: ${allAppsSnapshot.size}`);

    allAppsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      result.allApplications.push({
        applicationId: doc.id,
        userId: data.userId,
        organizationId: data.organizationId || null,
        status: data.status,
        slotAt: data.slotAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      });
    });

    // 3. Get applications with status = 'applied'
    const appliedAppsSnapshot = await db
      .collection('applications')
      .where('status', '==', 'applied')
      .limit(50)
      .get();

    console.log(`Applications with status='applied': ${appliedAppsSnapshot.size}`);

    appliedAppsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      result.applicationsWithStatus.push({
        applicationId: doc.id,
        userId: data.userId,
        organizationId: data.organizationId || null,
        status: data.status,
        slotAt: data.slotAt?.toDate?.()?.toISOString() || null,
      });
    });

    // 4. Check if user IDs match
    const userIds = result.usersInOrg.map((u: any) => u.userId);
    const matchingApps = result.allApplications.filter((app: any) =>
      userIds.includes(app.userId)
    );

    result.summary = {
      usersInOrgCount: result.usersInOrg.length,
      totalApplicationsInDb: result.allApplications.length,
      applicationsWithStatusApplied: result.applicationsWithStatus.length,
      applicationsMatchingOrgUsers: matchingApps.length,
    };

    result.matchingApplications = matchingApps;

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error debugging applications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
