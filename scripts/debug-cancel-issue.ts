/**
 * Debug script to investigate cancel command issue for organization
 * org_XOVcuVO7o6Op6idItDHsqiBgdBD3
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const TARGET_ORG_ID = 'org_XOVcuVO7o6Op6idItDHsqiBgdBD3';

async function debugCancelIssue() {
  console.log('\n=== Debugging Cancel Command Issue ===\n');
  console.log(`Target Organization: ${TARGET_ORG_ID}\n`);

  try {
    // 1. Check organization configuration
    console.log('1. Checking organization configuration...');
    const orgDoc = await db.collection('organizations').doc(TARGET_ORG_ID).get();

    if (!orgDoc.exists) {
      console.error('❌ Organization not found!');
      return;
    }

    const orgData = orgDoc.data();
    console.log('✅ Organization found:');
    console.log(`   Name: ${orgData?.name}`);
    console.log(`   LIFF ID: ${orgData?.liffId}`);
    console.log(`   Has lineChannelSecret in org doc: ${!!orgData?.lineChannelSecret}`);
    console.log(`   Settings structure: ${JSON.stringify(Object.keys(orgData?.settings || {}))}`);

    // 2. Check organization_secrets
    console.log('\n2. Checking organization_secrets...');
    const secretsDoc = await db.collection('organization_secrets').doc(TARGET_ORG_ID).get();

    if (!secretsDoc.exists) {
      console.warn('⚠️  organization_secrets document not found!');
      console.log('   Checking for secrets in organization doc...');
      if (orgData?.settings?.branding?.lineChannelSecret) {
        console.log('   ✅ Found lineChannelSecret in settings.branding');
      } else if (orgData?.lineChannelSecret) {
        console.log('   ✅ Found lineChannelSecret in root');
      } else {
        console.error('   ❌ No lineChannelSecret found anywhere!');
      }
    } else {
      const secretsData = secretsDoc.data();
      console.log('✅ organization_secrets found:');
      console.log(`   Has lineChannelSecret: ${!!secretsData?.lineChannelSecret}`);
      console.log(`   Has lineChannelAccessToken: ${!!secretsData?.lineChannelAccessToken}`);
      console.log(`   lineChannelSecret length: ${secretsData?.lineChannelSecret?.length || 0}`);
      console.log(`   lineChannelAccessToken length: ${secretsData?.lineChannelAccessToken?.length || 0}`);
    }

    // 3. Check active applications for this organization
    console.log('\n3. Checking active applications...');
    const applicationsSnapshot = await db
      .collection('applications')
      .where('organizationId', '==', TARGET_ORG_ID)
      .where('status', '==', 'applied')
      .orderBy('slotAt', 'desc')
      .limit(10)
      .get();

    if (applicationsSnapshot.empty) {
      console.warn('⚠️  No active applications found for this organization!');
    } else {
      console.log(`✅ Found ${applicationsSnapshot.size} active application(s):`);
      applicationsSnapshot.docs.forEach((doc, index) => {
        const app = doc.data();
        console.log(`   [${index + 1}] Application ID: ${doc.id}`);
        console.log(`       User ID: ${app.userId}`);
        console.log(`       Slot At: ${app.slotAt?.toDate?.()?.toISOString?.() || app.slotAt}`);
        console.log(`       Plan: ${app.plan}`);
        console.log(`       Has eventId: ${!!app.eventId}`);
        console.log(`       Has slotId: ${!!app.slotId}`);
        console.log(`       organizationId field: ${app.organizationId || '(missing!)'}`);
      });
    }

    // 4. Get a sample user to test getLatestApplication
    if (!applicationsSnapshot.empty) {
      const sampleApp = applicationsSnapshot.docs[0].data();
      const sampleUserId = sampleApp.userId;

      console.log(`\n4. Testing getLatestApplication for user: ${sampleUserId}...`);

      // Test WITHOUT organizationId filter
      console.log('   Testing WITHOUT organizationId filter:');
      const appWithoutFilter = await db
        .collection('applications')
        .where('userId', '==', sampleUserId)
        .where('status', '==', 'applied')
        .orderBy('slotAt', 'asc')
        .limit(1)
        .get();

      if (appWithoutFilter.empty) {
        console.log('   ❌ No application found (without filter)');
      } else {
        const app = appWithoutFilter.docs[0].data();
        console.log(`   ✅ Found application (without filter):`);
        console.log(`       Application ID: ${appWithoutFilter.docs[0].id}`);
        console.log(`       organizationId: ${app.organizationId}`);
      }

      // Test WITH organizationId filter
      console.log('\n   Testing WITH organizationId filter:');
      const appWithFilter = await db
        .collection('applications')
        .where('userId', '==', sampleUserId)
        .where('status', '==', 'applied')
        .where('organizationId', '==', TARGET_ORG_ID)
        .orderBy('slotAt', 'asc')
        .limit(1)
        .get();

      if (appWithFilter.empty) {
        console.error('   ❌ No application found (with filter)');
        console.log('   🔍 This is likely the issue! The organizationId filter is not matching.');
      } else {
        const app = appWithFilter.docs[0].data();
        console.log(`   ✅ Found application (with filter):`);
        console.log(`       Application ID: ${appWithFilter.docs[0].id}`);
        console.log(`       organizationId: ${app.organizationId}`);
      }
    }

    // 5. Check line_users
    console.log('\n5. Checking line_users for this organization...');
    const lineUsersSnapshot = await db
      .collection('line_users')
      .where('organizationId', '==', TARGET_ORG_ID)
      .limit(5)
      .get();

    if (lineUsersSnapshot.empty) {
      console.warn('⚠️  No line_users found for this organization!');
    } else {
      console.log(`✅ Found ${lineUsersSnapshot.size} line_user(s):`);
      lineUsersSnapshot.docs.forEach((doc, index) => {
        const user = doc.data();
        console.log(`   [${index + 1}] User ID: ${doc.id}`);
        console.log(`       Display Name: ${user.displayName}`);
        console.log(`       Consent: ${user.consent}`);
        console.log(`       organizationId: ${user.organizationId}`);
      });
    }

    // 6. Check if there are applications without organizationId
    console.log('\n6. Checking for applications without organizationId...');
    const appsWithoutOrgId = await db
      .collection('applications')
      .where('status', '==', 'applied')
      .limit(100)
      .get();

    const missingOrgId = appsWithoutOrgId.docs.filter(doc => {
      const app = doc.data();
      return !app.organizationId;
    });

    if (missingOrgId.length > 0) {
      console.warn(`⚠️  Found ${missingOrgId.length} applications without organizationId!`);
      console.log('   These applications cannot be found by cancel command with organizationId filter.');
    } else {
      console.log('✅ All checked applications have organizationId field.');
    }

    console.log('\n=== Investigation Complete ===\n');

    // Summary
    console.log('SUMMARY:');
    console.log('--------');
    if (!secretsDoc.exists && !orgData?.lineChannelSecret) {
      console.log('❌ CRITICAL: No LINE credentials found for this organization!');
    }
    if (applicationsSnapshot.empty) {
      console.log('⚠️  WARNING: No active applications found!');
    }
    if (missingOrgId.length > 0) {
      console.log('⚠️  WARNING: Some applications missing organizationId field!');
    }

  } catch (error) {
    console.error('Error during investigation:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the debug script
debugCancelIssue()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
