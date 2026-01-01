import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// IMPORTANT: This is a temporary admin endpoint to manually enable support addon
// This should be removed or protected with proper authentication in production

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, adminKey } = body;

    // Simple security check (replace with proper authentication)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    console.log('[Admin] Enabling support addon for:', organizationId);

    ensureAdminInitialized();
    const db = getAdminDb();

    // Check if organization exists
    const orgRef = db.collection('organizations').doc(organizationId);
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    const currentAddons = orgData?.addons || {};
    const currentSupport = currentAddons.support || {};

    // Check if already enabled
    if (currentSupport.purchased) {
      return NextResponse.json({
        success: true,
        message: 'Support addon was already enabled',
        organization: {
          id: organizationId,
          name: orgData?.name,
          addons: orgData?.addons,
        },
      });
    }

    // Enable support addon
    await orgRef.update({
      'addons.support': {
        purchased: true,
        purchasedAt: FieldValue.serverTimestamp(),
        stripePaymentIntentId: 'manual_activation',
        amountPaid: 15000,
        manuallyEnabled: true,
        enabledBy: 'admin_api',
        enabledAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('[Admin] ✅ Support addon enabled for:', organizationId);

    return NextResponse.json({
      success: true,
      message: 'Support addon has been enabled successfully',
      organization: {
        id: organizationId,
        name: orgData?.name,
      },
    });

  } catch (error) {
    console.error('[Admin] Error enabling support addon:', error);
    return NextResponse.json(
      {
        error: 'Failed to enable support addon',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
