/**
 * Check organization structure for reference account
 */
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    console.error('❌ service-account.json not found');
    process.exit(1);
  }
}

const db = getFirestore();

async function checkOrganizationStructure() {
  try {
    const orgId = 'org_MMWWMU8RmzWKdvXctUCwKTZfD453';
    console.log(`\n📋 Checking organization structure for: ${orgId}\n`);
    console.log('='.repeat(80));

    // Get organization document
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      console.error('❌ Organization not found');
      return;
    }

    const orgData = orgDoc.data();
    console.log('\n✅ Organization document:');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(orgData, null, 2));
    console.log('-'.repeat(80));

    // Check if organization_secrets exists
    const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();

    console.log('\n📦 Organization Secrets:');
    console.log('-'.repeat(80));
    if (secretsDoc.exists) {
      const secretsData = secretsDoc.data();
      console.log('✅ Organization secrets document exists');
      console.log('Fields:', Object.keys(secretsData || {}));
      console.log('Has lineChannelSecret:', !!secretsData?.lineChannelSecret);
      console.log('Has lineChannelAccessToken:', !!secretsData?.lineChannelAccessToken);

      if (secretsData?.lineChannelSecret) {
        console.log('lineChannelSecret length:', secretsData.lineChannelSecret.length);
      }
      if (secretsData?.lineChannelAccessToken) {
        console.log('lineChannelAccessToken length:', secretsData.lineChannelAccessToken.length);
      }
      if (secretsData?.updatedAt) {
        console.log('updatedAt:', secretsData.updatedAt);
      }
    } else {
      console.log('⚠️  Organization secrets document does not exist');
    }
    console.log('-'.repeat(80));

    console.log('\n📊 Summary:');
    console.log('-'.repeat(80));
    console.log('Organization fields:', Object.keys(orgData || {}).sort().join(', '));
    console.log('Has addons field:', 'addons' in orgData);
    console.log('Has subscription field:', 'subscription' in orgData);
    console.log('Has usage field:', 'usage' in orgData);
    console.log('Plan:', orgData.plan);
    console.log('LINE Channel ID:', orgData.lineChannelId || '(not set)');
    console.log('LIFF ID:', orgData.liffId || '(not set)');
    console.log('Company Name:', orgData.companyName || '(not set)');
    console.log('-'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOrganizationStructure()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
