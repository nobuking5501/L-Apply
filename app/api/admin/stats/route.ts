import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder for admin authentication
// TODO: Implement proper admin authentication
function isAdmin(request: NextRequest): boolean {
  // For now, check for admin secret in header
  const adminSecret = request.headers.get('x-admin-secret');
  return adminSecret === process.env.ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Import admin functions dynamically
    const { getAdminStats } = await import('@/functions/src/utils/admin-firestore');

    const stats = await getAdminStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
