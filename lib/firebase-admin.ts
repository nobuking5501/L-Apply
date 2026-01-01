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
    console.log('🔧 [Firebase Admin] Initializing...');
    console.log('[Firebase Admin] Environment check:', {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      serviceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
      hasGoogleCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
    });

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('[Firebase Admin] ✅ FIREBASE_SERVICE_ACCOUNT found');
      try {
        // Parse service account JSON from environment variable
        console.log('[Firebase Admin] Parsing service account JSON...');
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('[Firebase Admin] Service account parsed successfully:', {
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          hasPrivateKey: !!serviceAccount.private_key,
          privateKeyLength: serviceAccount.private_key?.length || 0,
        });

        console.log('[Firebase Admin] Initializing with service account...');
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
        console.log('[Firebase Admin] ✅ Initialized successfully with service account');
      } catch (parseError) {
        console.error('[Firebase Admin] ❌ Failed to parse service account JSON:', parseError);
        if (parseError instanceof Error) {
          console.error('[Firebase Admin] Parse error message:', parseError.message);
          console.error('[Firebase Admin] Parse error stack:', parseError.stack);
        }
        throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('[Firebase Admin] ⚠️ Using GOOGLE_APPLICATION_CREDENTIALS (not recommended for Vercel)');
      // Use credentials file path
      adminApp = initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      });
      console.log('[Firebase Admin] ✅ Initialized with GOOGLE_APPLICATION_CREDENTIALS');
    } else {
      console.error('[Firebase Admin] ❌ NO CREDENTIALS FOUND!');
      console.error('[Firebase Admin] ❌ FIREBASE_SERVICE_ACCOUNT is required for Vercel deployment');
      console.error('[Firebase Admin] ❌ Please set it in Vercel Dashboard -> Settings -> Environment Variables');
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required but not found');
    }
  } catch (error) {
    console.error('[Firebase Admin] ❌ Failed to initialize:', error);
    if (error instanceof Error) {
      console.error('[Firebase Admin] Error name:', error.name);
      console.error('[Firebase Admin] Error message:', error.message);
      console.error('[Firebase Admin] Error stack:', error.stack);
    }
    throw error;
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!firestoreInstance) {
    console.log('[Firebase Admin] Getting Firestore instance...');
    ensureAdminInitialized();
    firestoreInstance = getFirestore();
    console.log('[Firebase Admin] ✅ Firestore instance obtained');
  }
  return firestoreInstance;
}
