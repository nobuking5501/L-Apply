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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { getOrganizationAdmin } = await import('@/lib/admin-firestore');

    const organization = await getOrganizationAdmin(params.id);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Serialize Timestamp objects to ISO strings
    const serializedOrganization = serializeTimestamp(organization);

    return NextResponse.json({
      success: true,
      organization: serializedOrganization,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, status } = body;

    const {
      updateOrganizationPlan,
      updateOrganizationStatus,
      getOrganizationAdmin,
    } = await import('@/lib/admin-firestore');

    // Update plan if provided
    if (plan) {
      await updateOrganizationPlan(params.id, plan);
    }

    // Update status if provided
    if (status) {
      await updateOrganizationStatus(params.id, status);
    }

    // Get updated organization
    const organization = await getOrganizationAdmin(params.id);

    // Serialize Timestamp objects to ISO strings
    const serializedOrganization = serializeTimestamp(organization);

    return NextResponse.json({
      success: true,
      organization: serializedOrganization,
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
