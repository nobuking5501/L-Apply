import { onSchedule } from 'firebase-functions/v2/scheduler';
import { pushMessageWithRetry, createTextMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import * as stepDelivery from './utils/step-delivery';
import * as firestore from './utils/firestore';

/**
 * ステップ配信を実行する Scheduled Function
 * 5分ごとに実行され、送信予定のステップ配信を処理
 */
export const deliverSteps = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
  },
  async (event) => {
    console.log('Step delivery function triggered at:', new Date().toISOString());

    try {
      // Initialize Firebase
      ensureFirebaseInitialized();

      // Get Firestore instance
      const db = firestore.getDb();

      // Get pending step deliveries
      const deliveries = await stepDelivery.getPendingStepDeliveries(db);

      console.log(`Found ${deliveries.length} pending step deliveries`);

      for (const delivery of deliveries) {
        try {
          // Check user consent
          const user = await firestore.getLineUser(delivery.userId);

          if (!user || !user.consent) {
            console.log(
              `Skipping step delivery ${delivery.id} - user consent is false`
            );
            // Skip this delivery
            await stepDelivery.markStepDeliveryAsSkipped(db, delivery.id!);
            continue;
          }

          // Send step delivery message
          await pushMessageWithRetry(
            delivery.userId,
            [createTextMessage(delivery.message)],
            undefined, // Use default access token (legacy mode)
            3 // Retry up to 3 times
          );

          // Mark as sent
          await stepDelivery.markStepDeliveryAsSent(db, delivery.id!);

          console.log(
            `Successfully sent step delivery ${delivery.id} (Step ${delivery.stepNumber}) to user ${delivery.userId}`
          );
        } catch (error) {
          console.error(`Failed to send step delivery ${delivery.id}:`, error);
          // Don't mark as sent if it fails - will retry on next run
          // But log the error for monitoring
        }
      }

      console.log('Step delivery function completed successfully');
    } catch (error) {
      console.error('Step delivery function error:', error);
      throw error;
    }
  }
);
