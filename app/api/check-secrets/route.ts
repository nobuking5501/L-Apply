import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/check-secrets?orgId=xxx
 * Check if organization_secrets are properly configured (admin only)
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

    // Check organization exists
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = orgDoc.data();

    // Check organization_secrets
    const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();

    if (!secretsDoc.exists) {
      return NextResponse.json({
        organizationId: orgId,
        organizationName: orgData?.name,
        secretsExist: false,
        hasAccessToken: false,
        hasChannelSecret: false,
        issue: 'organization_secrets document does not exist',
        recommendation: 'Set LINE credentials in /dashboard/settings'
      });
    }

    const secretsData = secretsDoc.data();
    const hasAccessToken = !!secretsData?.lineChannelAccessToken;
    const hasChannelSecret = !!secretsData?.lineChannelSecret;

    // Check token format (should start with appropriate prefix)
    let accessTokenValid = false;
    if (hasAccessToken) {
      const token = secretsData.lineChannelAccessToken;
      accessTokenValid = token.length > 100; // LINE tokens are typically long
    }

    return NextResponse.json({
      organizationId: orgId,
      organizationName: orgData?.name,
      liffId: orgData?.liffId,
      secretsExist: true,
      hasAccessToken,
      hasChannelSecret,
      accessTokenValid,
      accessTokenLength: hasAccessToken ? secretsData.lineChannelAccessToken.length : 0,
      issue: !hasAccessToken ? 'LINE Channel Access Token is missing' :
             !hasChannelSecret ? 'LINE Channel Secret is missing' :
             !accessTokenValid ? 'Access Token format may be invalid' :
             null,
      recommendation: !hasAccessToken || !hasChannelSecret ?
        'Go to /dashboard/settings and enter LINE credentials' : null
    });

  } catch (error) {
    console.error('Error checking secrets:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
