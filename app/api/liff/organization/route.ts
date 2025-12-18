import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/liff/organization?liffId=xxx
 * Get organization info and active event by LIFF ID (public endpoint for LIFF)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const liffId = searchParams.get('liffId');

    if (!liffId) {
      return NextResponse.json(
        { error: 'Missing liffId parameter' },
        { status: 400 }
      );
    }

    console.log('Looking for liffId:', liffId);

    ensureAdminInitialized();
    const db = getAdminDb();

    // Find organization by liffId (try both with and without trimming)
    let orgsSnapshot = await db
      .collection('organizations')
      .where('liffId', '==', liffId)
      .limit(1)
      .get();

    // If not found, try with trimmed version (in case of leading/trailing spaces in DB)
    if (orgsSnapshot.empty) {
      console.log('Not found with exact match, trying with space variations...');
      orgsSnapshot = await db
        .collection('organizations')
        .where('liffId', '==', ` ${liffId}`)
        .limit(1)
        .get();
    }

    // If still not found, try trimming from DB side by getting all and filtering
    if (orgsSnapshot.empty) {
      console.log('Trying to fetch all organizations and filter manually...');
      const allOrgs = await db.collection('organizations').get();
      const matchingOrg = allOrgs.docs.find(doc => {
        const data = doc.data();
        const dbLiffId = (data.liffId || '').trim();
        return dbLiffId === liffId;
      });

      if (matchingOrg) {
        orgsSnapshot = { docs: [matchingOrg], empty: false } as any;
      }
    }

    if (orgsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgDoc = orgsSnapshot.docs[0];
    const orgData = orgDoc.data();
    const organizationId = orgDoc.id;

    // Support both old structure (settings.branding) and new structure (root level)
    const settings = orgData.settings || {};
    const branding = settings.branding || {};

    // Get active event for this organization
    const eventsSnapshot = await db
      .collection('events')
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    let activeEvent = null;
    if (!eventsSnapshot.empty) {
      const eventDoc = eventsSnapshot.docs[0];
      const eventData = eventDoc.data();
      activeEvent = {
        id: eventDoc.id,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        slots: eventData.slots || [],
      };
    }

    // Return public organization info and active event
    return NextResponse.json({
      success: true,
      organization: {
        id: organizationId,
        name: orgData.name,
        companyName: orgData.companyName || branding.companyName,
        primaryColor: orgData.primaryColor || branding.primaryColor || '#3B82F6',
      },
      activeEvent,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
