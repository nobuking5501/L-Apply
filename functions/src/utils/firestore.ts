import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { ensureFirebaseInitialized } from './firebase-init';
import { LineUser, Application, Reminder } from '../types';

// Collections
const LINE_USERS = 'line_users';
const APPLICATIONS = 'applications';
const REMINDERS = 'reminders';
const STEP_MESSAGE_TEMPLATES = 'step_message_templates';

// Lazy initialization of Firestore
let dbInstance: FirebaseFirestore.Firestore | null = null;

export function getDb(): FirebaseFirestore.Firestore {
  if (!dbInstance) {
    ensureFirebaseInitialized();
    dbInstance = getFirestore();
  }
  return dbInstance;
}

/**
 * Upsert line_user document
 */
export async function upsertLineUser(userId: string, displayName: string, consent: boolean, organizationId: string): Promise<void> {
  const userRef = getDb().collection(LINE_USERS).doc(userId);
  const now = Timestamp.now();

  const userDoc = await userRef.get();

  if (userDoc.exists) {
    // Update existing user
    await userRef.update({
      displayName,
      consent,
      organizationId,
      updatedAt: now,
    });
  } else {
    // Create new user
    const userData: LineUser = {
      userId,
      displayName,
      consent,
      organizationId,
      createdAt: now,
      updatedAt: now,
    };
    await userRef.set(userData);
  }
}

/**
 * Get line_user by userId
 */
export async function getLineUser(userId: string): Promise<LineUser | null> {
  const userDoc = await getDb().collection(LINE_USERS).doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data() as LineUser;
}

/**
 * Update line_user consent status
 */
export async function updateUserConsent(userId: string, consent: boolean): Promise<void> {
  await getDb().collection(LINE_USERS).doc(userId).update({
    consent,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Create application document
 */
export async function createApplication(application: Omit<Application, 'id'>): Promise<string> {
  const appRef = await getDb().collection(APPLICATIONS).add(application);
  return appRef.id;
}

/**
 * Check if application exists for the same user and slot
 */
export async function applicationExists(userId: string, slotAt: Timestamp): Promise<boolean> {
  const snapshot = await getDb()
    .collection(APPLICATIONS)
    .where('userId', '==', userId)
    .where('slotAt', '==', slotAt)
    .where('status', '==', 'applied')
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Get latest application for user
 */
export async function getLatestApplication(userId: string): Promise<Application | null> {
  const snapshot = await getDb()
    .collection(APPLICATIONS)
    .where('userId', '==', userId)
    .where('status', '==', 'applied')
    .orderBy('slotAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Application;
}

/**
 * Cancel application
 */
export async function cancelApplication(applicationId: string): Promise<void> {
  await getDb().collection(APPLICATIONS).doc(applicationId).update({
    status: 'canceled',
  });
}

/**
 * Create reminder document
 */
export async function createReminder(reminder: Omit<Reminder, 'id'>): Promise<string> {
  const reminderRef = await getDb().collection(REMINDERS).add(reminder);
  return reminderRef.id;
}

/**
 * Get pending reminders (scheduledAt <= now, sentAt is null, not canceled)
 */
export async function getPendingReminders(now: Timestamp): Promise<Reminder[]> {
  const snapshot = await getDb()
    .collection(REMINDERS)
    .where('scheduledAt', '<=', now)
    .where('sentAt', '==', null)
    .where('canceled', '==', false)
    .orderBy('scheduledAt', 'asc')
    .limit(100)
    .get();

  return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
  })) as Reminder[];
}

/**
 * Mark reminder as sent
 */
export async function markReminderAsSent(reminderId: string): Promise<void> {
  await getDb().collection(REMINDERS).doc(reminderId).update({
    sentAt: Timestamp.now(),
  });
}

/**
 * Cancel reminders for application
 */
export async function cancelRemindersForApplication(applicationId: string): Promise<void> {
  const snapshot = await getDb()
    .collection(REMINDERS)
    .where('applicationId', '==', applicationId)
    .where('canceled', '==', false)
    .get();

  const batch = getDb().batch();
  snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    batch.update(doc.ref, { canceled: true });
  });

  await batch.commit();
}

/**
 * Get application by ID
 */
export async function getApplication(applicationId: string): Promise<Application | null> {
  const doc = await getDb().collection(APPLICATIONS).doc(applicationId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as Application;
}

/**
 * Get welcome message template for organization
 */
export async function getWelcomeMessageTemplate(organizationId: string): Promise<string | null> {
  const snapshot = await getDb()
    .collection(STEP_MESSAGE_TEMPLATES)
    .where('organizationId', '==', organizationId)
    .where('messageType', '==', 'welcome')
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const template = snapshot.docs[0].data();
  return template.message || null;
}

/**
 * Get completion message template for organization
 */
export async function getCompletionMessageTemplate(organizationId: string): Promise<string | null> {
  const snapshot = await getDb()
    .collection(STEP_MESSAGE_TEMPLATES)
    .where('organizationId', '==', organizationId)
    .where('messageType', '==', 'completion')
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const template = snapshot.docs[0].data();
  return template.message || null;
}

/**
 * Create consultation request
 */
export async function createConsultationRequest(
  userId: string,
  organizationId: string
): Promise<string> {
  const consultationRef = await getDb().collection('consultation_requests').add({
    userId,
    organizationId,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return consultationRef.id;
}

/**
 * Get auto reply message by trigger text
 */
export async function getAutoReplyMessage(
  organizationId: string,
  triggerText: string
): Promise<string | null> {
  const snapshot = await getDb()
    .collection('auto_reply_messages')
    .where('organizationId', '==', organizationId)
    .where('trigger', '==', triggerText)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const reply = snapshot.docs[0].data();
  return reply.message || null;
}

/**
 * Get organizationId by LIFF ID
 * @param liffId LIFF ID
 * @returns organizationId or null if not found
 */
export async function getOrganizationIdByLiffId(liffId: string): Promise<string | null> {
  const snapshot = await getDb()
    .collection('organizations')
    .where('liffId', '==', liffId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

/**
 * Check if event slot has available capacity
 * @param eventId Event document ID
 * @param slotId Slot ID within the event
 * @returns true if slot has capacity, false if full or not found
 */
export async function checkSlotCapacity(eventId: string, slotId: string): Promise<boolean> {
  try {
    const eventDoc = await getDb().collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return false;
    }

    const eventData = eventDoc.data();
    const slots = eventData?.slots || [];
    const slot = slots.find((s: any) => s.id === slotId);

    if (!slot) {
      return false;
    }

    return slot.currentCapacity < slot.maxCapacity;
  } catch (error) {
    console.error('Error checking slot capacity:', error);
    return false;
  }
}

/**
 * Increment event slot current capacity by 1
 * @param eventId Event document ID
 * @param slotId Slot ID within the event
 * @returns true if successfully incremented, false otherwise
 */
export async function incrementSlotCapacity(eventId: string, slotId: string): Promise<boolean> {
  try {
    const eventRef = getDb().collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      console.error(`Event ${eventId} not found`);
      return false;
    }

    const eventData = eventDoc.data();
    const slots = eventData?.slots || [];
    const slotIndex = slots.findIndex((s: any) => s.id === slotId);

    if (slotIndex === -1) {
      console.error(`Slot ${slotId} not found in event ${eventId}`);
      return false;
    }

    // Check capacity before incrementing
    if (slots[slotIndex].currentCapacity >= slots[slotIndex].maxCapacity) {
      console.error(`Slot ${slotId} is already full`);
      return false;
    }

    // Increment current capacity
    slots[slotIndex].currentCapacity = (slots[slotIndex].currentCapacity || 0) + 1;

    // Update the event document
    await eventRef.update({
      slots,
      updatedAt: Timestamp.now(),
    });

    console.log(`Slot ${slotId} capacity incremented to ${slots[slotIndex].currentCapacity}/${slots[slotIndex].maxCapacity}`);
    return true;
  } catch (error) {
    console.error('Error incrementing slot capacity:', error);
    return false;
  }
}

/**
 * Decrement event slot current capacity by 1 (for cancellations)
 * @param eventId Event document ID
 * @param slotId Slot ID within the event
 * @returns true if successfully decremented, false otherwise
 */
export async function decrementSlotCapacity(eventId: string, slotId: string): Promise<boolean> {
  try {
    const eventRef = getDb().collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      console.error(`Event ${eventId} not found`);
      return false;
    }

    const eventData = eventDoc.data();
    const slots = eventData?.slots || [];
    const slotIndex = slots.findIndex((s: any) => s.id === slotId);

    if (slotIndex === -1) {
      console.error(`Slot ${slotId} not found in event ${eventId}`);
      return false;
    }

    // Prevent negative capacity
    if (slots[slotIndex].currentCapacity <= 0) {
      console.warn(`Slot ${slotId} capacity is already 0`);
      return false;
    }

    // Decrement current capacity
    slots[slotIndex].currentCapacity = slots[slotIndex].currentCapacity - 1;

    // Update the event document
    await eventRef.update({
      slots,
      updatedAt: Timestamp.now(),
    });

    console.log(`Slot ${slotId} capacity decremented to ${slots[slotIndex].currentCapacity}/${slots[slotIndex].maxCapacity}`);
    return true;
  } catch (error) {
    console.error('Error decrementing slot capacity:', error);
    return false;
  }
}
