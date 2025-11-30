import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder for admin authentication
// TODO: Implement proper admin authentication
function isAdmin(request: NextRequest): boolean {
  // For now, check for admin secret in header
  const adminSecret = request.headers.get('x-admin-secret');
  return adminSecret === process.env.ADMIN_SECRET;
}

// Helper function to serialize Firestore Timestamp
function serializeTimestamp(data: any): any {
  if (!data) return data;

  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    const serialized: any = {};
    for (const key in data) {
      serialized[key] = serializeTimestamp(data[key]);
    }
    return serialized;
  }

  if (Array.isArray(data)) {
    return data.map(serializeTimestamp);
  }

  return data;
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

    // Import admin functions dynamically to avoid cold start issues
    const { getAllOrganizations } = await import('@/lib/admin-firestore');

    const organizations = await getAllOrganizations();

    // Serialize Timestamp objects to ISO strings
    const serializedOrganizations = serializeTimestamp(organizations);

    return NextResponse.json({
      success: true,
      organizations: serializedOrganizations,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
