import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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
