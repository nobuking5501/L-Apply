// Firebase Client SDK Configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5R_EwSLznU1TZxPP3w8EHA1iopYDzhZI",
  authDomain: "l-apply.firebaseapp.com",
  projectId: "l-apply",
  storageBucket: "l-apply.firebasestorage.app",
  messagingSenderId: "1076344687205",
  appId: "1:1076344687205:web:313e0215b6defd2b11d48c",
  measurementId: "G-KN8JRX4LN6"
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let analytics: Analytics | undefined;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (getApps().length > 0) {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, analytics, auth, db };
