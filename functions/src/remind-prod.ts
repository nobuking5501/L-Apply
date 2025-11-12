import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Timestamp } from 'firebase-admin/firestore';
import { pushMessageWithRetry, createTextMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import * as firestore from './utils/firestore';
import * as timezone from './utils/timezone';

export const remind = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
  },
  async (event) => {
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
          // Check user consent
          const user = await firestore.getLineUser(reminder.userId);

          if (!user || !user.consent) {
            console.log(`Skipping reminder ${reminder.id} - user consent is false`);
            // Mark as sent even if consent is false to avoid retrying
            await firestore.markReminderAsSent(reminder.id!);
            continue;
          }

          // Send reminder
          await pushMessageWithRetry(reminder.userId, [createTextMessage(reminder.message)], undefined, 3);

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
    } catch (error) {
      console.error('Reminder function error:', error);
      throw error;
    }
  }
);
