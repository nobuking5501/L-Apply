import { onRequest } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { pushMessageWithRetry, createTextMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import { getOrganizationConfig } from './config';
import * as firestore from './utils/firestore';
import * as timezone from './utils/timezone';

export const remind = onRequest(
  {
    region: 'asia-northeast1',
    // Allow unauthenticated requests from Cloud Scheduler
    // Cloud Scheduler will use OIDC token authentication
  },
  async (req, res) => {
    console.log('Reminder function triggered at:', new Date().toISOString());

    try {
      // Initialize Firebase
      ensureFirebaseInitialized();

      const now = timezone.getNowJST();

      // Get pending reminders
      const reminders = await firestore.getPendingReminders(now);

      console.log(`Found ${reminders.length} pending reminders`);

      for (const reminder of reminders) {
        try {
          // IMPORTANT: Mark as "sending" FIRST to prevent duplicate sends
          await firestore.markReminderAsSending(reminder.id!, now);

          // Check if application is canceled
          const application = await firestore.getApplication(reminder.applicationId);

          if (!application || application.status === 'canceled') {
            console.log(
              `Skipping reminder ${reminder.id} - application is canceled`
            );
            await firestore.markReminderAsSkipped(reminder.id!);
            continue;
          }

          // Check user consent
          const user = await firestore.getLineUser(reminder.userId);

          if (!user || !user.consent) {
            console.log(`Skipping reminder ${reminder.id} - user consent is false`);
            // Mark as skipped to avoid retrying
            await firestore.markReminderAsSkipped(reminder.id!);
            continue;
          }

          // Get organization config - organizationId is REQUIRED for multi-tenant support
          if (!reminder.organizationId) {
            console.error(`❌ Reminder ${reminder.id} is missing organizationId - cannot send. Marking as sent to prevent retries.`);
            await firestore.markReminderAsSent(reminder.id!);
            continue;
          }

          // Get LINE Channel Access Token from organization config
          let accessToken: string;
          try {
            const orgConfig = await getOrganizationConfig(reminder.organizationId);
            accessToken = orgConfig.line.channelAccessToken;

            if (!accessToken) {
              throw new Error('Access token is empty');
            }
          } catch (error) {
            console.error(`❌ Failed to get LINE credentials for organization ${reminder.organizationId}:`, error);
            console.error(`Reminder ${reminder.id} cannot be sent. Will retry on next run.`);
            // Don't mark as sent - will retry next time
            continue;
          }

          // Check if reminder feature is still enabled for this organization
          const db = firestore.getDb();
          const orgDoc = await db.collection('organizations').doc(reminder.organizationId).get();
          const orgData = orgDoc.data();
          // Default to true for backward compatibility
          const reminderEnabled = orgData?.features?.reminderEnabled !== false;

          if (!reminderEnabled) {
            console.log(`Skipping reminder ${reminder.id} - reminder is disabled for organization ${reminder.organizationId}`);
            await firestore.markReminderAsSkipped(reminder.id!);
            continue;
          }

          // Send reminder
          await pushMessageWithRetry(reminder.userId, [createTextMessage(reminder.message)], accessToken, 3);

          // Mark as sent
          await firestore.markReminderAsSent(reminder.id!);

          console.log(`Successfully sent reminder ${reminder.id} to user ${reminder.userId}`);
        } catch (error) {
          console.error(`Failed to send reminder ${reminder.id}:`, error);
          // Don't mark as sent if it fails - will retry on next run
          // But log the error for monitoring
        }
      }

      console.log('Reminder function completed successfully');
      res.status(200).json({ success: true, message: 'Reminders processed successfully' });
    } catch (error) {
      console.error('Reminder function error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);
