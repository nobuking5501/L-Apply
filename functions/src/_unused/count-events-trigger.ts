import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { ensureFirebaseInitialized } from './utils/firebase-init';

/**
 * Trigger when an event is created - increment event count
 */
export const onEventCreated = onDocumentCreated(
  {
    document: 'events/{eventId}',
    region: 'asia-northeast1',
  },
  async (event) => {
    ensureFirebaseInitialized();

    const eventData = event.data?.data();
    const organizationId = eventData?.organizationId;

    if (!organizationId) {
      console.warn('Event created without organizationId:', event.params.eventId);
      return;
    }

    try {
      const { incrementEventCount } = await import('./utils/admin-firestore');
      await incrementEventCount(organizationId);
      console.log(`Incremented event count for organization: ${organizationId}`);
    } catch (error) {
      console.error('Failed to increment event count:', error);
    }
  }
);

/**
 * Trigger when an event is deleted - decrement event count
 */
export const onEventDeleted = onDocumentDeleted(
  {
    document: 'events/{eventId}',
    region: 'asia-northeast1',
  },
  async (event) => {
    ensureFirebaseInitialized();

    const eventData = event.data?.data();
    const organizationId = eventData?.organizationId;

    if (!organizationId) {
      console.warn('Event deleted without organizationId:', event.params.eventId);
      return;
    }

    try {
      // Decrement event count
      const { getDb } = await import('./utils/firestore');
      const { Timestamp } = await import('firebase-admin/firestore');

      const db = getDb();
      const doc = await db.collection('organizations').doc(organizationId).get();
      const data = doc.data();
      const currentCount = data?.usage?.eventsCount || 0;

      if (currentCount > 0) {
        await db.collection('organizations').doc(organizationId).update({
          'usage.eventsCount': currentCount - 1,
          updatedAt: Timestamp.now(),
        });
        console.log(`Decremented event count for organization: ${organizationId}`);
      }
    } catch (error) {
      console.error('Failed to decrement event count:', error);
    }
  }
);
