/**
 * Script to fix incomplete account
 * Usage: npx ts-node scripts/fix-incomplete-account.ts
 */

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

const INCOMPLETE_UID = '25uFTbJ19MQwOTELcTMmxNrSXwA3';

async function fixIncompleteAccount() {
  try {
    console.log(`\n🔍 Checking account: ${INCOMPLETE_UID}\n`);

    // Check if user exists in Authentication
    let authUser;
    try {
      authUser = await admin.auth().getUser(INCOMPLETE_UID);
      console.log(`✅ Found in Authentication:`);
      console.log(`   Email: ${authUser.email}`);
      console.log(`   Display Name: ${authUser.displayName}`);
    } catch (error) {
      console.log(`❌ User not found in Authentication`);
      return;
    }

    // Check if user document exists in Firestore
    const userDoc = await db.collection('users').doc(INCOMPLETE_UID).get();

    if (userDoc.exists) {
      console.log(`✅ User document already exists in Firestore`);
      return;
    }

    console.log(`❌ User document missing in Firestore`);
    console.log(`\n🛠️ Creating missing documents...\n`);

    // Create organization
    const orgId = `org_${INCOMPLETE_UID}`;
    const now = admin.firestore.Timestamp.now();
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await db.collection('organizations').doc(orgId).set({
      name: `${authUser.displayName || authUser.email}の組織`,
      plan: 'test',
      createdAt: now,
      updatedAt: now,
      ownerId: INCOMPLETE_UID,
      lineChannelId: '',
      liffId: '',
      companyName: '',
      primaryColor: '#3B82F6',
      subscription: {
        plan: 'test',
        status: 'trial',
        limits: {
          maxEvents: 1,
          maxStepDeliveries: 0,
          maxReminders: 0,
          maxApplicationsPerMonth: 10,
        },
        trialEndsAt: admin.firestore.Timestamp.fromDate(trialEnd),
        currentPeriodStart: now,
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(trialEnd),
      },
      usage: {
        eventsCount: 0,
        stepDeliveriesCount: 0,
        remindersCount: 0,
        applicationsThisMonth: 0,
        lastResetAt: now,
      },
    });

    console.log(`✅ Created organization: ${orgId}`);

    // Create user document
    await db.collection('users').doc(INCOMPLETE_UID).set({
      uid: INCOMPLETE_UID,
      email: authUser.email,
      displayName: authUser.displayName || authUser.email,
      organizationId: orgId,
      role: 'owner',
      createdAt: now,
    });

    console.log(`✅ Created user document: ${INCOMPLETE_UID}`);
    console.log(`\n✅ Account fixed successfully!`);
    console.log(`   You can now log in with this account.`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixIncompleteAccount()
  .then(() => {
    console.log('\n✅ Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
