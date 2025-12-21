import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

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
 * POST /api/line/verify-connection
 * Test LINE Messaging API connection with stored credentials
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

    const db = getAdminDb();

    // Fetch LINE credentials from organization_secrets
    const secretsDoc = await db.collection('organization_secrets').doc(userData.organizationId).get();

    if (!secretsDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'credentials_not_found',
        message: 'LINE認証情報が設定されていません。設定を保存してから接続テストを実行してください。',
      });
    }

    const secretsData = secretsDoc.data();
    const channelAccessToken = secretsData?.lineChannelAccessToken;

    if (!channelAccessToken) {
      return NextResponse.json({
        success: false,
        error: 'access_token_not_found',
        message: 'LINE Channel Access Tokenが設定されていません。',
      });
    }

    // Test connection to LINE Messaging API
    try {
      const lineResponse = await fetch('https://api.line.me/v2/bot/info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${channelAccessToken}`,
        },
      });

      if (!lineResponse.ok) {
        const errorData = await lineResponse.json().catch(() => ({}));
        console.error('LINE API error:', errorData);

        return NextResponse.json({
          success: false,
          error: 'line_api_error',
          message: '接続失敗：認証情報が無効です。LINE Channel Access Tokenを確認してください。',
          details: errorData.message || 'Invalid credentials',
        });
      }

      const botInfo = await lineResponse.json();

      return NextResponse.json({
        success: true,
        message: '✅ 接続成功！認証情報は有効です。',
        botInfo: {
          displayName: botInfo.displayName || '',
          userId: botInfo.userId || '',
          basicId: botInfo.basicId || '',
        },
      });
    } catch (lineError) {
      console.error('LINE API connection error:', lineError);

      return NextResponse.json({
        success: false,
        error: 'connection_error',
        message: '接続エラー：LINE APIへの接続に失敗しました。ネットワーク接続を確認してください。',
      });
    }
  } catch (error) {
    console.error('Error verifying LINE connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'internal_error',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
