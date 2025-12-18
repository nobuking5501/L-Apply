import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let firestoreInstance: Firestore | undefined;

export function ensureAdminInitialized(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Initialize with service account or default credentials
  try {
    console.log('🔧 Initializing Firebase Admin...');
    console.log('Environment check:', {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      hasGoogleCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      nodeEnv: process.env.NODE_ENV,
    });

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('✅ Using FIREBASE_SERVICE_ACCOUNT');
      // Parse service account JSON from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized successfully with service account');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('⚠️ Using GOOGLE_APPLICATION_CREDENTIALS (not recommended for Vercel)');
      // Use credentials file path
      adminApp = initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      });
    } else {
      console.error('❌ NO CREDENTIALS FOUND - This will fail on Vercel!');
      console.error('❌ Please set FIREBASE_SERVICE_ACCOUNT environment variable in Vercel Dashboard');
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!firestoreInstance) {
    ensureAdminInitialized();
    firestoreInstance = getFirestore();
  }
  return firestoreInstance;
}
