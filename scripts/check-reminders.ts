import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkReminders() {
  console.log('\n🔍 Checking reminders collection...\n');

  // Get recent reminders
  const remindersSnapshot = await db
    .collection('reminders')
    .orderBy('scheduledAt', 'desc')
    .limit(10)
    .get();

  if (remindersSnapshot.empty) {
    console.log('❌ No reminders found in the database');
    return;
  }

  console.log(`Found ${remindersSnapshot.size} recent reminders:\n`);

  remindersSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`Reminder ID: ${doc.id}`);
    console.log(`  userId: ${data.userId}`);
    console.log(`  organizationId: ${data.organizationId || '❌ MISSING'}`);
    console.log(`  scheduledAt: ${data.scheduledAt?.toDate()}`);
    console.log(`  sentAt: ${data.sentAt ? data.sentAt.toDate() : 'Not sent yet'}`);
    console.log(`  type: ${data.type}`);
    console.log(`  message: ${data.message?.substring(0, 50)}...`);
    console.log('');
  });

  // Check for reminders without organizationId
  const noOrgIdSnapshot = await db
    .collection('reminders')
    .where('organizationId', '==', null)
    .limit(5)
    .get();

  if (!noOrgIdSnapshot.empty) {
    console.log(`\n⚠️  WARNING: Found ${noOrgIdSnapshot.size} reminders without organizationId`);
  }

  // Check step_deliveries
  console.log('\n\n🔍 Checking step_deliveries collection...\n');

  const deliveriesSnapshot = await db
    .collection('step_deliveries')
    .orderBy('scheduledAt', 'desc')
    .limit(10)
    .get();

  if (deliveriesSnapshot.empty) {
    console.log('❌ No step deliveries found in the database');
    return;
  }

  console.log(`Found ${deliveriesSnapshot.size} recent step deliveries:\n`);

  deliveriesSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`Step Delivery ID: ${doc.id}`);
    console.log(`  userId: ${data.userId}`);
    console.log(`  organizationId: ${data.organizationId || '❌ MISSING'}`);
    console.log(`  scheduledAt: ${data.scheduledAt?.toDate()}`);
    console.log(`  sentAt: ${data.sentAt ? data.sentAt.toDate() : 'Not sent yet'}`);
    console.log(`  stepNumber: ${data.stepNumber}`);
    console.log(`  status: ${data.status}`);
    console.log('');
  });

  // Check for step deliveries without organizationId
  const noOrgIdDeliveriesSnapshot = await db
    .collection('step_deliveries')
    .where('organizationId', '==', null)
    .limit(5)
    .get();

  if (!noOrgIdDeliveriesSnapshot.empty) {
    console.log(`\n⚠️  WARNING: Found ${noOrgIdDeliveriesSnapshot.size} step deliveries without organizationId`);
  }
}

checkReminders()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
