const admin = require('firebase-admin');
const serviceAccount = require('./l-apply-firebase-adminsdk-pz6op-4c3b07c96c.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateToUnlimited() {
  try {
    const orgId = 'org_MMWWMU8RmzWKdvXctUCwKTZfD453';
    
    await db.collection('organizations').doc(orgId).update({
      subscription: {
        plan: 'unlimited',
        status: 'active',
        limits: {
          maxEvents: 999999,
          maxStepDeliveries: 999999,
          maxReminders: 999999,
          maxApplicationsPerMonth: 999999
        }
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Organization updated to unlimited plan');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateToUnlimited();
