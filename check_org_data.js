const admin = require('firebase-admin');

// Check if already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./l-apply-firebase-adminsdk-pz6op-4c3b07c96c.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkData() {
  try {
    const orgId = 'org_MMWWMU8RmzWKdvXctUCwKTZfD453';
    
    // Get organization
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    console.log('\n📋 Organization Data:');
    console.log(JSON.stringify(orgDoc.data(), null, 2));
    
    // Get owner user
    const ownerId = orgDoc.data()?.ownerId;
    if (ownerId) {
      const userDoc = await db.collection('users').doc(ownerId).get();
      console.log('\n👤 Owner User Data:');
      console.log(JSON.stringify(userDoc.data(), null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
