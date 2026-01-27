import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/compare-organizations?orgId1=xxx&orgId2=xxx
 * Compare settings between two organizations to find differences
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId1 = searchParams.get('orgId1'); // Working org
    const orgId2 = searchParams.get('orgId2'); // Broken org

    if (!orgId1 || !orgId2) {
      return NextResponse.json(
        { error: 'Missing orgId1 or orgId2 parameter' },
        { status: 400 }
      );
    }

    ensureAdminInitialized();
    const db = getAdminDb();

    const result: any = {
      orgId1: orgId1,
      orgId2: orgId2,
      org1: null,
      org2: null,
      org1Secrets: null,
      org2Secrets: null,
      differences: [],
    };

    // Get organization 1 data
    const org1Doc = await db.collection('organizations').doc(orgId1).get();
    if (org1Doc.exists) {
      const data = org1Doc.data();
      result.org1 = {
        id: org1Doc.id,
        name: data?.name || null,
        email: data?.email || null,
        liffId: data?.liffId || null,
        plan: data?.subscription?.plan || null,
        status: data?.subscription?.status || null,
        hasLineChannelSecret: !!data?.lineChannelSecret,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
      };
    }

    // Get organization 2 data
    const org2Doc = await db.collection('organizations').doc(orgId2).get();
    if (org2Doc.exists) {
      const data = org2Doc.data();
      result.org2 = {
        id: org2Doc.id,
        name: data?.name || null,
        email: data?.email || null,
        liffId: data?.liffId || null,
        plan: data?.subscription?.plan || null,
        status: data?.subscription?.status || null,
        hasLineChannelSecret: !!data?.lineChannelSecret,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
      };
    }

    // Get organization_secrets for org1
    const org1SecretsDoc = await db.collection('organization_secrets').doc(orgId1).get();
    if (org1SecretsDoc.exists) {
      const data = org1SecretsDoc.data();
      result.org1Secrets = {
        hasLineChannelSecret: !!data?.lineChannelSecret,
        hasLineChannelAccessToken: !!data?.lineChannelAccessToken,
        channelSecretLength: data?.lineChannelSecret?.length || 0,
        accessTokenLength: data?.lineChannelAccessToken?.length || 0,
      };
    }

    // Get organization_secrets for org2
    const org2SecretsDoc = await db.collection('organization_secrets').doc(orgId2).get();
    if (org2SecretsDoc.exists) {
      const data = org2SecretsDoc.data();
      result.org2Secrets = {
        hasLineChannelSecret: !!data?.lineChannelSecret,
        hasLineChannelAccessToken: !!data?.lineChannelAccessToken,
        channelSecretLength: data?.lineChannelSecret?.length || 0,
        accessTokenLength: data?.lineChannelAccessToken?.length || 0,
      };
    }

    // Find differences
    if (result.org1 && result.org2) {
      if (result.org1.plan !== result.org2.plan) {
        result.differences.push({
          field: 'plan',
          org1Value: result.org1.plan,
          org2Value: result.org2.plan,
        });
      }

      if (result.org1.status !== result.org2.status) {
        result.differences.push({
          field: 'subscription status',
          org1Value: result.org1.status,
          org2Value: result.org2.status,
        });
      }

      if (!result.org1.liffId || !result.org2.liffId) {
        result.differences.push({
          field: 'liffId',
          org1Value: result.org1.liffId || 'MISSING',
          org2Value: result.org2.liffId || 'MISSING',
        });
      }

      if (result.org1Secrets && result.org2Secrets) {
        if (!result.org1Secrets.hasLineChannelSecret || !result.org2Secrets.hasLineChannelSecret) {
          result.differences.push({
            field: 'lineChannelSecret',
            org1Value: result.org1Secrets.hasLineChannelSecret ? 'EXISTS' : 'MISSING',
            org2Value: result.org2Secrets.hasLineChannelSecret ? 'EXISTS' : 'MISSING',
          });
        }

        if (!result.org1Secrets.hasLineChannelAccessToken || !result.org2Secrets.hasLineChannelAccessToken) {
          result.differences.push({
            field: 'lineChannelAccessToken',
            org1Value: result.org1Secrets.hasLineChannelAccessToken ? 'EXISTS' : 'MISSING',
            org2Value: result.org2Secrets.hasLineChannelAccessToken ? 'EXISTS' : 'MISSING',
          });
        }
      }
    }

    result.summary = {
      org1Name: result.org1?.name || 'Not found',
      org2Name: result.org2?.name || 'Not found',
      differencesFound: result.differences.length,
      org1SecretsExists: !!result.org1Secrets,
      org2SecretsExists: !!result.org2Secrets,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error comparing organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
