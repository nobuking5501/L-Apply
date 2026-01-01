import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Verify Firebase ID token and get user data
 */
async function verifyAuthToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    ensureAdminInitialized();
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get user data from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data() as {
      organizationId: string;
      role: string;
      email: string;
      [key: string]: any;
    };

    return {
      uid: decodedToken.uid,
      ...userData,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Helper function to mask sensitive strings
 * Shows first 8 and last 8 characters, masks the middle
 */
function maskString(str: string): string {
  if (!str) return '';
  if (str.length <= 16) {
    // For short strings, show first 4 and last 4
    return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
  }
  return `${str.substring(0, 8)}...${str.substring(str.length - 8)}`;
}

/**
 * GET /api/settings
 * Fetch organization settings (public info only)
 */
export async function GET(request: NextRequest) {
  try {
    const userData = await verifyAuthToken(request);

    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Settings GET] 🔍 User authenticated:', userData.uid);
    console.log('[Settings GET] 🔍 Organization ID:', userData.organizationId);

    const db = getAdminDb();
    const orgDoc = await db.collection('organizations').doc(userData.organizationId).get();

    console.log('[Settings GET] 🔍 Organization document exists:', orgDoc.exists);

    if (!orgDoc.exists) {
      console.error('[Settings GET] ❌ Organization not found:', userData.organizationId);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = orgDoc.data();
    console.log('[Settings GET] 🔍 Raw orgData keys:', Object.keys(orgData || {}));
    console.log('[Settings GET] 🔍 orgData.addons:', orgData?.addons);
    console.log('[Settings GET] 🔍 orgData.addons type:', typeof orgData?.addons);
    console.log('[Settings GET] 🔍 Full orgData (stringified):', JSON.stringify(orgData, null, 2));

    // Fetch secrets metadata (NOT the actual secrets, just metadata)
    let secretsMetadata = {
      hasChannelSecret: false,
      hasChannelAccessToken: false,
      channelSecretMasked: '',
      channelAccessTokenMasked: '',
      channelSecretLength: 0,
      channelAccessTokenLength: 0,
      secretsUpdatedAt: null,
    };

    try {
      const secretsDoc = await db.collection('organization_secrets').doc(userData.organizationId).get();

      if (secretsDoc.exists) {
        const secretsData = secretsDoc.data();
        const channelSecret = secretsData?.lineChannelSecret || '';
        const channelAccessToken = secretsData?.lineChannelAccessToken || '';

        secretsMetadata = {
          hasChannelSecret: !!channelSecret,
          hasChannelAccessToken: !!channelAccessToken,
          channelSecretMasked: channelSecret ? maskString(channelSecret) : '',
          channelAccessTokenMasked: channelAccessToken ? maskString(channelAccessToken) : '',
          channelSecretLength: channelSecret ? channelSecret.length : 0,
          channelAccessTokenLength: channelAccessToken ? channelAccessToken.length : 0,
          secretsUpdatedAt: secretsData?.updatedAt || null,
        };
      }
    } catch (error) {
      // If organization_secrets doesn't exist or can't be read, continue with empty metadata
      console.warn(`Could not fetch secrets metadata for org ${userData.organizationId}:`, error);
    }

    // Return public organization info (excluding actual secrets)
    const responseData = {
      success: true,
      organization: {
        id: orgDoc.id,
        name: orgData?.name,
        companyName: orgData?.companyName,
        primaryColor: orgData?.primaryColor,
        liffId: orgData?.liffId,
        lineChannelId: orgData?.lineChannelId,
        plan: orgData?.plan,
        addons: orgData?.addons || {}, // Add addons field
      },
      secretsMetadata, // Add secrets metadata (masked, not actual secrets)
    };

    console.log('[Settings GET] 📤 Response addons field:', responseData.organization.addons);
    console.log('[Settings GET] 📤 Response addons stringified:', JSON.stringify(responseData.organization.addons));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Update organization settings (requires owner or admin role)
 */
export async function POST(request: NextRequest) {
  try {
    const userData = await verifyAuthToken(request);

    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is owner or admin
    if (userData.role !== 'owner' && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Owner or Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      companyName,
      primaryColor,
      liffId,
      lineChannelId,
      lineChannelSecret,
      lineChannelAccessToken,
    } = body;

    const db = getAdminDb();

    // Check for liffId uniqueness if liffId is being updated
    if (liffId !== undefined) {
      const trimmedLiffId = String(liffId).trim();

      if (trimmedLiffId) {
        // Check if another organization is using this liffId
        const existingOrgsSnapshot = await db
          .collection('organizations')
          .where('liffId', '==', trimmedLiffId)
          .limit(2) // Get up to 2 to check for duplicates
          .get();

        // Filter out the current organization
        const otherOrgs = existingOrgsSnapshot.docs.filter(
          (doc) => doc.id !== userData.organizationId
        );

        if (otherOrgs.length > 0) {
          return NextResponse.json(
            {
              error: 'このLIFF IDは既に他の組織で使用されています。別のLIFF IDを指定してください。',
              code: 'LIFF_ID_DUPLICATE'
            },
            { status: 409 }
          );
        }
      }
    }

    // Update public organization info
    const orgRef = db.collection('organizations').doc(userData.organizationId);
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Trim string values to prevent issues with spaces
    if (name !== undefined) updateData.name = String(name).trim();
    if (companyName !== undefined) updateData.companyName = String(companyName).trim();
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (liffId !== undefined) updateData.liffId = String(liffId).trim();
    if (lineChannelId !== undefined) updateData.lineChannelId = String(lineChannelId).trim();

    await orgRef.update(updateData);

    // Update sensitive LINE credentials in separate collection
    if (lineChannelSecret !== undefined || lineChannelAccessToken !== undefined) {
      const secretsRef = db.collection('organization_secrets').doc(userData.organizationId);
      const secretsData: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (lineChannelSecret !== undefined) {
        secretsData.lineChannelSecret = lineChannelSecret;
      }
      if (lineChannelAccessToken !== undefined) {
        secretsData.lineChannelAccessToken = lineChannelAccessToken;
      }

      // Use set with merge to create or update
      await secretsRef.set(secretsData, { merge: true });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
