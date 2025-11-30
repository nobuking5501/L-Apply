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
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Parse service account JSON from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use credentials file path
      adminApp = initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      });
    } else {
      // Use default credentials (for local development or Cloud Functions)
      adminApp = initializeApp();
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
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
