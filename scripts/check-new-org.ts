// Check newly created organization data
import * as admin from 'firebase-admin';

const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkOrg() {
  const orgId = 'org_VC3Kqyb0tCOqXarFPmHaMqT2G9n1';

  console.log('🔍 Checking organization:', orgId);

  const orgDoc = await db.collection('organizations').doc(orgId).get();

  if (!orgDoc.exists) {
    console.log('❌ Organization not found');
    return;
  }

  const orgData = orgDoc.data();
  console.log('\n📊 Organization data:');
  console.log(JSON.stringify(orgData, null, 2));

  // Check secrets
  console.log('\n🔒 Checking organization_secrets...');
  const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();

  if (secretsDoc.exists) {
    const secretsData = secretsDoc.data();
    console.log('✅ Secrets document exists');
    console.log('- hasChannelSecret:', !!secretsData?.lineChannelSecret);
    console.log('- hasChannelAccessToken:', !!secretsData?.lineChannelAccessToken);
    console.log('- channelSecretLength:', secretsData?.lineChannelSecret?.length || 0);
    console.log('- channelAccessTokenLength:', secretsData?.lineChannelAccessToken?.length || 0);
    if (secretsData?.updatedAt) {
      console.log('- updatedAt:', secretsData.updatedAt.toDate());
    }
  } else {
    console.log('❌ No secrets document found (this is normal for new accounts)');
  }
}

checkOrg()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
