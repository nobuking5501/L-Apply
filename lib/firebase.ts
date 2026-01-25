// Firebase Client SDK Configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Load from environment variables for better security and flexibility
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD5R_EwSLznU1TZxPP3w8EHA1iopYDzhZI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "l-apply.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "l-apply",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "l-apply.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1076344687205",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1076344687205:web:313e0215b6defd2b11d48c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-KN8JRX4LN6"
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let analytics: Analytics | undefined;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  // Only initialize analytics in the browser
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }

  auth = getAuth(app);
  db = getFirestore(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, analytics, auth, db };
