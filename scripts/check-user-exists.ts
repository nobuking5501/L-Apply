import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!serviceAccount) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is required');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

async function checkUser(email: string) {
  try {
    console.log(`\n🔍 Checking user: ${email}\n`);

    const userRecord = await auth.getUserByEmail(email);

    console.log('✅ User found in Firebase Auth:');
    console.log('   UID:', userRecord.uid);
    console.log('   Email:', userRecord.email);
    console.log('   Email Verified:', userRecord.emailVerified);
    console.log('   Disabled:', userRecord.disabled);
    console.log('   Created:', new Date(userRecord.metadata.creationTime));
    console.log('   Last Sign In:', userRecord.metadata.lastSignInTime
      ? new Date(userRecord.metadata.lastSignInTime)
      : 'Never');

    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ User NOT found in Firebase Auth');
      console.error('   This email address is not registered.');
    } else {
      console.error('❌ Error checking user:', error.message);
    }
    return null;
  }
}

// Check the user
checkUser('admin@example.com')
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
