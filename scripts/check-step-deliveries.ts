import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkStepDeliveries() {
  try {
    console.log('🔍 Checking step_deliveries collection...\n');

    // Get all step deliveries
    const snapshot = await db
      .collection('step_deliveries')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    console.log(`Found ${snapshot.size} step deliveries (most recent 50)\n`);

    // Group by applicationId to find duplicates
    const byApplication = new Map<string, any[]>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const key = data.applicationId;

      if (!byApplication.has(key)) {
        byApplication.set(key, []);
      }

      byApplication.get(key)!.push({
        id: doc.id,
        ...data,
      });
    });

    // Find applications with duplicate steps
    console.log('📊 Checking for duplicate step deliveries...\n');

    let duplicatesFound = false;

    for (const [applicationId, deliveries] of byApplication.entries()) {
      // Group by stepNumber
      const stepGroups = new Map<number, any[]>();

      deliveries.forEach((delivery) => {
        const stepNum = delivery.stepNumber;
        if (!stepGroups.has(stepNum)) {
          stepGroups.set(stepNum, []);
        }
        stepGroups.get(stepNum)!.push(delivery);
      });

      // Check for duplicates
      for (const [stepNumber, steps] of stepGroups.entries()) {
        if (steps.length > 1) {
          duplicatesFound = true;
          console.log(`⚠️  DUPLICATE FOUND for application ${applicationId}, step ${stepNumber}:`);
          console.log(`   ${steps.length} copies found:\n`);

          steps.forEach((step, index) => {
            console.log(`   Copy ${index + 1}:`);
            console.log(`     ID: ${step.id}`);
            console.log(`     Status: ${step.status}`);
            console.log(`     SentAt: ${step.sentAt ? new Date(step.sentAt._seconds * 1000).toISOString() : 'null'}`);
            console.log(`     ScheduledAt: ${new Date(step.scheduledAt._seconds * 1000).toISOString()}`);
            console.log(`     CreatedAt: ${new Date(step.createdAt._seconds * 1000).toISOString()}`);
            console.log(`     Message preview: ${step.message.substring(0, 50)}...`);
            console.log('');
          });
        }
      }
    }

    if (!duplicatesFound) {
      console.log('✅ No duplicates found!\n');
    }

    // Show recent deliveries for debugging
    console.log('\n📝 Recent step deliveries:\n');

    snapshot.docs.slice(0, 10).forEach((doc) => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  Application: ${data.applicationId}`);
      console.log(`  User: ${data.userId}`);
      console.log(`  Step: ${data.stepNumber}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  SentAt: ${data.sentAt ? new Date(data.sentAt._seconds * 1000).toISOString() : 'null'}`);
      console.log(`  ScheduledAt: ${new Date(data.scheduledAt._seconds * 1000).toISOString()}`);
      console.log(`  Message: ${data.message.substring(0, 80)}...`);
      console.log('');
    });

    // Check the query used by getPendingStepDeliveries
    console.log('\n🔍 Testing getPendingStepDeliveries query...\n');

    const now = admin.firestore.Timestamp.now();
    const pendingSnapshot = await db
      .collection('step_deliveries')
      .where('scheduledAt', '<=', now)
      .where('sentAt', '==', null)
      .where('status', '==', 'pending')
      .limit(100)
      .get();

    console.log(`Found ${pendingSnapshot.size} pending deliveries\n`);

    pendingSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`Pending delivery: ${doc.id}`);
      console.log(`  Step: ${data.stepNumber}`);
      console.log(`  Application: ${data.applicationId}`);
      console.log(`  Scheduled: ${new Date(data.scheduledAt._seconds * 1000).toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkStepDeliveries();
