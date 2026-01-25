/**
 * Script to check organization data structure
 * Usage: npx ts-node scripts/check-org-structure.ts
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

async function checkOrgStructure() {
  try {
    // Check existing organization
    const existingOrgId = 'org_MMWWMU8RmzWKdvXctUCwKTZfD453';
    console.log(`\n📋 Checking existing organization: ${existingOrgId}\n`);

    const existingOrgDoc = await db.collection('organizations').doc(existingOrgId).get();

    if (!existingOrgDoc.exists) {
      console.error(`❌ Organization ${existingOrgId} not found`);
      return;
    }

    const existingData = existingOrgDoc.data();
    console.log('✅ Existing organization data structure:');
    console.log(JSON.stringify(existingData, null, 2));

    // Check secrets for existing org
    console.log(`\n🔐 Checking organization_secrets for: ${existingOrgId}\n`);
    const existingSecretsDoc = await db.collection('organization_secrets').doc(existingOrgId).get();

    if (existingSecretsDoc.exists) {
      const secretsData = existingSecretsDoc.data();
      console.log('✅ Secrets exist:');
      console.log({
        hasChannelSecret: !!secretsData?.lineChannelSecret,
        hasChannelAccessToken: !!secretsData?.lineChannelAccessToken,
        channelSecretLength: secretsData?.lineChannelSecret?.length || 0,
        channelAccessTokenLength: secretsData?.lineChannelAccessToken?.length || 0,
      });
    } else {
      console.log('❌ No secrets document found');
    }

    // Get a sample newly created org (if any)
    console.log('\n\n📋 Checking newly created organizations:\n');
    const recentOrgs = await db.collection('organizations')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    recentOrgs.forEach((doc) => {
      const data = doc.data();
      console.log(`\n--- Organization: ${doc.id} ---`);
      console.log(`Name: ${data.name}`);
      console.log(`Plan: ${data.plan}`);
      console.log(`Created: ${data.createdAt?.toDate?.()}`);
      console.log('Fields present:', Object.keys(data).sort());
      console.log('Has lineChannelId:', !!data.lineChannelId);
      console.log('Has liffId:', !!data.liffId);
      console.log('Has subscription:', !!data.subscription);
      console.log('Has usage:', !!data.usage);
      console.log('Has settings:', !!data.settings);
    });

    console.log('\n\n✅ Structure check complete');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOrgStructure()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
