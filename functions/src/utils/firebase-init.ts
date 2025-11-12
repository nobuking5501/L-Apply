import { initializeApp, getApps } from 'firebase-admin/app';

let initialized = false;

export function ensureFirebaseInitialized() {
  if (!initialized) {
    const apps = getApps();
    if (apps.length === 0) {
      initializeApp();
    }
    initialized = true;
  }
}
