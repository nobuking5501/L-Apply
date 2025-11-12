// Lazy loader for Firestore utilities
// This avoids loading Firestore during deployment analysis

export async function getFirestoreUtils() {
  const firestoreModule = await import('./firestore');
  return firestoreModule;
}
