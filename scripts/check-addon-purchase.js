// Check if support addon was purchased for a specific organization
const admin = require('firebase-admin');
const serviceAccount = require('../l-apply-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkAddonPurchase(orgId) {
  console.log('\n🔍 Checking addon purchase for organization:', orgId);
  console.log('='.repeat(60));

  try {
    // Check organization document
    const orgRef = db.collection('organizations').doc(orgId);
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      console.log('❌ Organization not found');
      return;
    }

    const orgData = orgSnap.data();
    console.log('\n📄 Organization data:');
    console.log('  - Name:', orgData?.name);
    console.log('  - Plan:', orgData?.plan);
    console.log('  - Addons:', JSON.stringify(orgData?.addons, null, 2));

    // Check if support addon is purchased
    const supportAddon = orgData?.addons?.support;
    console.log('\n🎯 Support Addon Status:');
    if (supportAddon) {
      console.log('  ✅ Support addon data exists');
      console.log('  - Purchased:', supportAddon.purchased);
      console.log('  - Purchased at:', supportAddon.purchasedAt?.toDate?.() || supportAddon.purchasedAt);
      console.log('  - Stripe Payment Intent:', supportAddon.stripePaymentIntentId);
      console.log('  - Amount Paid:', supportAddon.amountPaid);
    } else {
      console.log('  ❌ No support addon data found');
    }

    // Check user count
    const usersSnap = await db.collection('users')
      .where('organizationId', '==', orgId)
      .get();
    console.log('\n👥 Users in organization:', usersSnap.size);

    usersSnap.forEach(doc => {
      const userData = doc.data();
      console.log('  - User:', userData.email, '| Role:', userData.role);
    });

  } catch (error) {
    console.error('❌ Error checking addon purchase:', error);
  }
}

// Get orgId from command line argument
const orgId = process.argv[2] || 'org_FBJtNjU9xpdfgkinWm9Ut5C0nUc2';
checkAddonPurchase(orgId).then(() => process.exit(0));
