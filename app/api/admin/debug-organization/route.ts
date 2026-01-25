import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/debug-organization?orgId=xxx
 * Debug organization configuration for apply form errors
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

    const issues: string[] = [];

    // 1. Check organization
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found', issues: ['組織が見つかりません'] },
        { status: 404 }
      );
    }

    const orgData = orgDoc.data();

    // Check LIFF ID
    if (!orgData?.liffId) {
      issues.push('LIFF IDが設定されていません');
    } else if (orgData.liffId !== orgData.liffId.trim()) {
      issues.push('LIFF IDに余分な空白が含まれています');
    }

    // 2. Check organization secrets
    const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();
    const secretsData = secretsDoc.exists ? secretsDoc.data() : null;

    if (!secretsDoc.exists) {
      issues.push('organization_secretsが設定されていません');
    } else {
      if (!secretsData?.lineChannelAccessToken) {
        issues.push('LINE Channel Access Tokenが設定されていません');
      }
      if (!secretsData?.lineChannelSecret) {
        issues.push('LINE Channel Secretが設定されていません');
      }
    }

    // 3. Check active events
    const eventsSnapshot = await db
      .collection('events')
      .where('organizationId', '==', orgId)
      .where('isActive', '==', true)
      .get();

    if (eventsSnapshot.empty) {
      issues.push('アクティブなイベントがありません（isActive: trueのイベントが必要です）');
    }

    const activeEvents = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        location: data.location,
        slots: data.slots || [],
      };
    });

    // Check if all slots are full
    let allSlotsFull = true;
    activeEvents.forEach(event => {
      event.slots.forEach((slot: any) => {
        const current = slot.currentCapacity || 0;
        const max = slot.maxCapacity || 0;
        if (current < max) {
          allSlotsFull = false;
        }
      });
    });

    if (allSlotsFull && activeEvents.length > 0) {
      issues.push('全ての予約枠が満席です');
    }

    // 4. Check subscription
    const subsSnapshot = await db
      .collection('subscriptions')
      .where('organizationId', '==', orgId)
      .limit(1)
      .get();

    let subscriptionData = null;
    if (!subsSnapshot.empty) {
      subscriptionData = subsSnapshot.docs[0].data();

      // Check application limit
      const currentCount = subscriptionData.currentApplicationCount || 0;
      const limit = subscriptionData.applicationLimit || 0;

      if (currentCount >= limit) {
        issues.push(`申込上限に達しています (${currentCount}/${limit})`);
      }
    }

    // Return debug results
    return NextResponse.json({
      organization: {
        id: orgId,
        name: orgData?.name,
        companyName: orgData?.companyName,
        liffId: orgData?.liffId,
        lineChannelId: orgData?.lineChannelId,
      },
      secrets: secretsData ? {
        hasAccessToken: !!secretsData.lineChannelAccessToken,
        hasChannelSecret: !!secretsData.lineChannelSecret,
      } : null,
      activeEvents,
      subscription: subscriptionData ? {
        tier: subscriptionData.tier,
        status: subscriptionData.status,
        applicationLimit: subscriptionData.applicationLimit,
        currentApplicationCount: subscriptionData.currentApplicationCount || 0,
      } : null,
      issues,
    });

  } catch (error) {
    console.error('Error debugging organization:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
