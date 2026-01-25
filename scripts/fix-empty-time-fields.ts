import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

async function fixEmptyTimeFields() {
  console.log('🔍 Searching for events with empty time fields...\n');

  try {
    // Get all events
    const eventsSnapshot = await db.collection('events').get();

    let fixedCount = 0;
    let totalEvents = 0;

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
        continue;
      }

      // Check each slot for empty time field
      let needsUpdate = false;
      const updatedSlots = eventData.slots.map((slot: any, index: number) => {
        if (slot.time === '' || slot.time === null || slot.time === undefined) {
          console.log(`   🔴 Slot ${index + 1} has empty time field`);
          console.log(`      Date: ${slot.date}`);
          console.log(`      Fixing with default time: 14:00`);
          needsUpdate = true;
          return {
            ...slot,
            time: '14:00' // Set default time to 2:00 PM
          };
        }
        return slot;
      });

      // Update the document if needed
      if (needsUpdate) {
        await db.collection('events').doc(eventId).update({
          slots: updatedSlots,
          updatedAt: new Date()
        });
        fixedCount++;
        console.log(`   ✅ Event updated successfully`);
      } else {
        console.log('   ✓  No issues found');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total events checked: ${totalEvents}`);
    console.log(`   Events fixed: ${fixedCount}`);
    console.log(`   Events with no issues: ${totalEvents - fixedCount}`);
    console.log('\n✅ Script completed successfully\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Run the script
fixEmptyTimeFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
