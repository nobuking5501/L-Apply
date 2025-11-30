import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder for admin authentication
function isAdmin(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  return adminSecret === process.env.ADMIN_SECRET;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Import admin functions from lib
    const { initializeOrganizationSubscription, getOrganizationAdmin } =
      await import('@/lib/admin-firestore');

    // Initialize subscription
    await initializeOrganizationSubscription(organizationId);

    // Get updated organization
    const organization = await getOrganizationAdmin(organizationId);

    return NextResponse.json({
      success: true,
      message: 'Subscription initialized successfully',
      organization,
    });
  } catch (error) {
    console.error('Error initializing subscription:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
