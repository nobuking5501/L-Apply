/**
 * Check organization structure for reference account
 * This script reads the Firestore document for org_MMWWMU8RmzWKdvXctUCwKTZfD453
 * to understand the correct data structure
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    console.error('❌ service-account.json not found');
    process.exit(1);
  }
}

const db = getFirestore();

async function checkOrganizationStructure() {
  try {
    const orgId = 'org_MMWWMU8RmzWKdvXctUCwKTZfD453';
    console.log(`📋 Checking organization structure for: ${orgId}\n`);

    // Get organization document
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      console.error('❌ Organization not found');
      return;
    }

    const orgData = orgDoc.data();
    console.log('✅ Organization document:');
    console.log(JSON.stringify(orgData, null, 2));
    console.log('\n');

    // Check if organization_secrets exists
    const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();

    if (secretsDoc.exists) {
      const secretsData = secretsDoc.data();
      console.log('✅ Organization secrets document exists:');
      console.log('Fields:', Object.keys(secretsData || {}));
      console.log('Has lineChannelSecret:', !!secretsData?.lineChannelSecret);
      console.log('Has lineChannelAccessToken:', !!secretsData?.lineChannelAccessToken);
    } else {
      console.log('⚠️  Organization secrets document does not exist');
    }

    console.log('\n');
    console.log('📝 Summary of required fields for new accounts:');
    console.log('Organization fields:', Object.keys(orgData || {}).sort());

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOrganizationStructure();
