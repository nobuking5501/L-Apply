// Debug new organization data
const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Helper function to mask string (same as API)
function maskString(str) {
  if (!str) return '';
  if (str.length <= 16) {
    return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
  }
  return `${str.substring(0, 8)}...${str.substring(str.length - 8)}`;
}

async function debugNewOrg() {
  const orgId = 'org_FsB2LWJIXhfUyupqmuabrmEFFAO2';

  console.log('🔍 Debugging organization:', orgId);
  console.log('');

  // Get organization data
  const orgDoc = await db.collection('organizations').doc(orgId).get();

  if (!orgDoc.exists) {
    console.log('❌ Organization not found');
    return;
  }

  const orgData = orgDoc.data();
  console.log('📊 Organization data:');
  console.log(JSON.stringify(orgData, null, 2));

  // Get secrets metadata
  let secretsMetadata = {
    hasChannelSecret: false,
    hasChannelAccessToken: false,
    channelSecretMasked: '',
    channelAccessTokenMasked: '',
    channelSecretLength: 0,
    channelAccessTokenLength: 0,
    secretsUpdatedAt: null,
  };

  try {
    const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();

    if (secretsDoc.exists) {
      const secretsData = secretsDoc.data();
      const channelSecret = secretsData?.lineChannelSecret || '';
      const channelAccessToken = secretsData?.lineChannelAccessToken || '';

      secretsMetadata = {
        hasChannelSecret: !!channelSecret,
        hasChannelAccessToken: !!channelAccessToken,
        channelSecretMasked: channelSecret ? maskString(channelSecret) : '',
        channelAccessTokenMasked: channelAccessToken ? maskString(channelAccessToken) : '',
        channelSecretLength: channelSecret ? channelSecret.length : 0,
        channelAccessTokenLength: channelAccessToken ? channelAccessToken.length : 0,
        secretsUpdatedAt: secretsData?.updatedAt || null,
      };

      console.log('');
      console.log('✅ Secrets found');
    } else {
      console.log('');
      console.log('❌ No secrets document found (expected for new accounts)');
    }
  } catch (error) {
    console.error('');
    console.error('❌ Error fetching secrets:', error.message);
  }

  // Simulate API response
  const apiResponse = {
    success: true,
    organization: {
      id: orgDoc.id,
      name: orgData?.name,
      companyName: orgData?.companyName,
      primaryColor: orgData?.primaryColor,
      liffId: orgData?.liffId,
      lineChannelId: orgData?.lineChannelId,
      plan: orgData?.plan,
      addons: orgData?.addons || {},
    },
    secretsMetadata,
  };

  console.log('');
  console.log('📡 Simulated /api/settings Response:');
  console.log(JSON.stringify(apiResponse, null, 2));

  console.log('');
  console.log('=== Analysis ===');
  console.log('Organization has support addon purchased:', !!orgData?.addons?.support?.purchased);
  console.log('secretsMetadata object exists:', !!secretsMetadata);
  console.log('secretsMetadata.hasChannelSecret:', secretsMetadata.hasChannelSecret);
  console.log('secretsMetadata.hasChannelAccessToken:', secretsMetadata.hasChannelAccessToken);

  console.log('');
  console.log('=== Expected UI Behavior ===');
  console.log('Status display should show:');
  console.log('  Channel Secret:', secretsMetadata.hasChannelSecret ? `✅ 設定済み (${secretsMetadata.channelSecretLength}文字)` : '❌ 未設定');
  console.log('  Access Token:', secretsMetadata.hasChannelAccessToken ? `✅ 設定済み (${secretsMetadata.channelAccessTokenLength}文字)` : '❌ 未設定');
}

debugNewOrg()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
