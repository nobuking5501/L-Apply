// Check user's organization ID
import * as admin from 'firebase-admin';

const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUserOrg() {
  const userId = 'ZVZ23si4LQThpYl1vicvuab25oH2'; // From settings page log

  console.log('🔍 Checking user:', userId);

  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    console.log('❌ User not found');
    return;
  }

  const userData = userDoc.data();
  console.log('✅ User data:', {
    uid: userId,
    organizationId: userData?.organizationId,
    role: userData?.role,
    email: userData?.email,
  });

  const orgId = userData?.organizationId;
  if (orgId) {
    console.log('\n🏢 Checking organization:', orgId);
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (orgDoc.exists) {
      const orgData = orgDoc.data();
      console.log('✅ Organization data:', {
        id: orgDoc.id,
        name: orgData?.name,
        addons: orgData?.addons,
      });
    } else {
      console.log('❌ Organization not found');
    }
  }

  // Check the other org too
  const otherOrgId = 'org_EwMPe6oVd5WA1nLP5L6NaVTGmYp1';
  console.log('\n🔍 Checking other organization:', otherOrgId);
  const otherOrgDoc = await db.collection('organizations').doc(otherOrgId).get();

  if (otherOrgDoc.exists) {
    const otherOrgData = otherOrgDoc.data();
    console.log('✅ Other organization data:', {
      id: otherOrgDoc.id,
      name: otherOrgData?.name,
      addons: otherOrgData?.addons,
    });
  } else {
    console.log('❌ Other organization not found');
  }
}

checkUserOrg()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
