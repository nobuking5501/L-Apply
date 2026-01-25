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

async function checkSettingsAPI() {
  const orgId = 'MMWWMU8RmzWKdvXctUCwKTZfD453';

  console.log('🔍 Simulating /api/settings GET for:', orgId);
  console.log('');

  // Get organization data
  const orgDoc = await db.collection('organizations').doc(orgId).get();

  if (!orgDoc.exists) {
    console.log('❌ Organization not found');
    return;
  }

  const orgData = orgDoc.data();

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

      console.log('✅ Secrets found');
    } else {
      console.log('❌ No secrets document found');
    }
  } catch (error) {
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
  console.log('📡 Simulated API Response:');
  console.log(JSON.stringify(apiResponse, null, 2));

  console.log('');
  console.log('=== Analysis ===');
  console.log('Organization has LINE Channel ID:', !!orgData?.lineChannelId);
  console.log('Organization has LIFF ID:', !!orgData?.liffId);
  console.log('Secrets metadata has Channel Secret:', secretsMetadata.hasChannelSecret);
  console.log('Secrets metadata has Access Token:', secretsMetadata.hasChannelAccessToken);
  console.log('Channel Secret masked value:', secretsMetadata.channelSecretMasked || 'EMPTY');
  console.log('Channel Secret length:', secretsMetadata.channelSecretLength);
  console.log('Access Token masked value:', secretsMetadata.channelAccessTokenMasked || 'EMPTY');
  console.log('Access Token length:', secretsMetadata.channelAccessTokenLength);

  if (secretsMetadata.secretsUpdatedAt) {
    console.log('Last updated:', secretsMetadata.secretsUpdatedAt.toDate());
  }
}

checkSettingsAPI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
