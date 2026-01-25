import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/check-liff?liffId=xxx
 * Check organization configuration by LIFF ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const liffId = searchParams.get('liffId');

    if (!liffId) {
      return NextResponse.json(
        { error: 'Missing liffId parameter' },
        { status: 400 }
      );
    }

    ensureAdminInitialized();
    const db = getAdminDb();

    // Find organization by LIFF ID
    const orgSnapshot = await db
      .collection('organizations')
      .where('liffId', '==', liffId)
      .limit(1)
      .get();

    if (orgSnapshot.empty) {
      // Try to find all organizations with LIFF IDs
      const allOrgs = await db.collection('organizations').get();
      const orgsWithLiff = allOrgs.docs
        .map(doc => ({
          id: doc.id,
          liffId: doc.data().liffId,
          name: doc.data().name
        }))
        .filter(org => org.liffId);

      return NextResponse.json({
        found: false,
        searchedLiffId: liffId,
        message: 'No organization found with this LIFF ID',
        availableOrganizations: orgsWithLiff
      });
    }

    const orgDoc = orgSnapshot.docs[0];
    const orgData = orgDoc.data();
    const organizationId = orgDoc.id;

    // Check secrets
    const secretsDoc = await db.collection('organization_secrets').doc(organizationId).get();
    const secretsData = secretsDoc.exists ? secretsDoc.data() : null;

    // Check active events
    const eventsSnapshot = await db
      .collection('events')
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true)
      .get();

    const events = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        location: data.location,
        slots: data.slots || []
      };
    });

    // Check subscription
    const subsSnapshot = await db
      .collection('subscriptions')
      .where('organizationId', '==', organizationId)
      .limit(1)
      .get();

    const subscription = subsSnapshot.empty ? null : subsSnapshot.docs[0].data();

    // Check recent applications
    const appsSnapshot = await db
      .collection('applications')
      .where('organizationId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recentApplications = appsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        slotAt: data.slotAt?.toDate().toISOString(),
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString()
      };
    });

    // Identify issues
    const issues = [];

    if (!secretsData?.lineChannelAccessToken) {
      issues.push({
        type: 'MISSING_ACCESS_TOKEN',
        message: 'LINE Channel Access Token is not set',
        impact: 'Will cause "Invalid ID token" error (401)'
      });
    }

    if (eventsSnapshot.empty) {
      issues.push({
        type: 'NO_ACTIVE_EVENTS',
        message: 'No active events found',
        impact: 'Will cause "現在公開中のイベントがありません" error'
      });
    } else {
      let hasAvailableSlot = false;
      events.forEach(event => {
        event.slots.forEach((slot: any) => {
          const current = slot.currentCapacity || 0;
          const max = slot.maxCapacity || 0;
          if (current < max) {
            hasAvailableSlot = true;
          }
        });
      });

      if (!hasAvailableSlot) {
        issues.push({
          type: 'ALL_SLOTS_FULL',
          message: 'All event slots are full',
          impact: 'Will cause "選択された日時は満席です" error (409)'
        });
      }
    }

    if (subscription) {
      const current = subscription.currentApplicationCount || 0;
      const limit = subscription.applicationLimit || 0;
      if (current >= limit) {
        issues.push({
          type: 'LIMIT_REACHED',
          message: `Application limit reached (${current}/${limit})`,
          impact: 'Will cause "今月の申込上限に達しています" error (403)'
        });
      }
    }

    return NextResponse.json({
      found: true,
      organization: {
        id: organizationId,
        name: orgData.name,
        liffId: orgData.liffId,
        lineChannelId: orgData.lineChannelId
      },
      secrets: {
        hasAccessToken: !!secretsData?.lineChannelAccessToken,
        hasChannelSecret: !!secretsData?.lineChannelSecret
      },
      events,
      subscription: subscription ? {
        tier: subscription.tier,
        status: subscription.status,
        applicationLimit: subscription.applicationLimit,
        currentApplicationCount: subscription.currentApplicationCount || 0
      } : null,
      recentApplications,
      issues,
      status: issues.length === 0 ? 'OK' : 'HAS_ISSUES'
    });

  } catch (error) {
    console.error('Error checking LIFF:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
