// Manually enable support addon for an organization
// This is a temporary fix to unblock users who have paid but cannot access settings

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Try to find service account key
const possiblePaths = [
  path.join(__dirname, '../l-apply-firebase-adminsdk.json'),
  path.join(__dirname, '../serviceAccountKey.json'),
  path.join(__dirname, '../firebase-adminsdk.json'),
];

let serviceAccount = null;
for (const keyPath of possiblePaths) {
  if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
    console.log('✅ Found service account key at:', keyPath);
    break;
  }
}

if (!serviceAccount) {
  console.error('❌ No Firebase service account key found.');
  console.error('Please download your service account key from Firebase Console');
  console.error('and save it as l-apply-firebase-adminsdk.json in the project root');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function enableSupportAddon(orgId) {
  console.log('\n🔧 Enabling support addon for organization:', orgId);
  console.log('='.repeat(60));

  try {
    // Check if organization exists
    const orgRef = db.collection('organizations').doc(orgId);
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      console.log('❌ Organization not found:', orgId);
      return;
    }

    const orgData = orgSnap.data();
    console.log('\n📄 Organization:', orgData.name);
    console.log('   Plan:', orgData.plan);

    // Check current addon status
    const currentAddons = orgData.addons || {};
    const currentSupport = currentAddons.support || {};

    console.log('\n📦 Current support addon status:');
    console.log('   Purchased:', currentSupport.purchased || false);

    if (currentSupport.purchased) {
      console.log('\n✅ Support addon is already enabled!');
      return;
    }

    // Enable support addon
    console.log('\n🚀 Enabling support addon...');

    await orgRef.update({
      'addons.support': {
        purchased: true,
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        stripePaymentIntentId: 'manual_activation',
        amountPaid: 15000,
        manuallyEnabled: true,
        enabledBy: 'admin_script',
        enabledAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Support addon has been enabled!');
    console.log('\n🎉 The user can now access the settings page.');
    console.log('\n📝 Next steps:');
    console.log('   1. Ask the user to refresh their browser');
    console.log('   2. They should now be able to access /dashboard/settings');
    console.log('   3. Investigate why the automatic purchase flow failed');

  } catch (error) {
    console.error('\n❌ Error enabling support addon:', error);
    console.error('\nError details:', error.message);
  }
}

// Get orgId from command line argument
const orgId = process.argv[2];

if (!orgId) {
  console.error('❌ Please provide an organization ID');
  console.error('Usage: node enable-support-addon.js <organizationId>');
  console.error('Example: node enable-support-addon.js org_FBJtNjU9xpdfgkinWm9Ut5C0nUc2');
  process.exit(1);
}

enableSupportAddon(orgId).then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Script failed:', err);
  process.exit(1);
});
