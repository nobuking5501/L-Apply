import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting fix for events with empty time fields...');

    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);

    let fixedCount = 0;
    let totalEvents = 0;
    const results: Array<{
      eventId: string;
      title: string;
      organizationId: string;
      fixed: boolean;
      slotsFixed: number;
    }> = [];

    for (const eventDoc of eventsSnapshot.docs) {
      totalEvents++;
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;

      console.log(`\n📄 Checking event: ${eventId}`);
      console.log(`   Organization: ${eventData.organizationId}`);
      console.log(`   Title: ${eventData.title}`);

      // Check if slots array exists
      if (!eventData.slots || !Array.isArray(eventData.slots)) {
        console.log('   ⚠️  No slots array found, skipping...');
        results.push({
          eventId,
          title: eventData.title || 'Untitled',
          organizationId: eventData.organizationId || 'Unknown',
          fixed: false,
          slotsFixed: 0,
        });
        continue;
      }

      // Check each slot for empty time field
      let needsUpdate = false;
      let slotsFixedCount = 0;
      const updatedSlots = eventData.slots.map((slot: any, index: number) => {
        if (slot.time === '' || slot.time === null || slot.time === undefined) {
          console.log(`   🔴 Slot ${index + 1} has empty time field`);
          console.log(`      Date: ${slot.date}`);
          console.log(`      Fixing with default time: 14:00`);
          needsUpdate = true;
          slotsFixedCount++;
          return {
            ...slot,
            time: '14:00', // Set default time to 2:00 PM
          };
        }
        return slot;
      });

      // Update the document if needed
      if (needsUpdate) {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
          slots: updatedSlots,
          updatedAt: new Date(),
        });
        fixedCount++;
        console.log(`   ✅ Event updated successfully`);

        results.push({
          eventId,
          title: eventData.title || 'Untitled',
          organizationId: eventData.organizationId || 'Unknown',
          fixed: true,
          slotsFixed: slotsFixedCount,
        });
      } else {
        console.log('   ✓  No issues found');
        results.push({
          eventId,
          title: eventData.title || 'Untitled',
          organizationId: eventData.organizationId || 'Unknown',
          fixed: false,
          slotsFixed: 0,
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total events checked: ${totalEvents}`);
    console.log(`   Events fixed: ${fixedCount}`);
    console.log(`   Events with no issues: ${totalEvents - fixedCount}`);
    console.log('\n✅ Script completed successfully\n');

    return NextResponse.json({
      success: true,
      summary: {
        totalEvents,
        eventsFixed: fixedCount,
        eventsWithNoIssues: totalEvents - fixedCount,
      },
      results,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
