import { onRequest } from 'firebase-functions/v2/https';
import { pushMessageWithRetry, createTextMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import { getOrganizationConfig } from './config';
import * as stepDelivery from './utils/step-delivery';
import * as firestore from './utils/firestore';

/**
 * ステップ配信を実行する HTTP Function
 * Cloud Schedulerから5分ごとに呼び出され、送信予定のステップ配信を処理
 */
export const deliverSteps = onRequest(
  {
    region: 'asia-northeast1',
    // Allow unauthenticated requests from Cloud Scheduler
    // Cloud Scheduler will use OIDC token authentication
  },
  async (req, res) => {
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

          // Get organization config - organizationId is REQUIRED for multi-tenant support
          if (!delivery.organizationId) {
            console.error(`❌ Step delivery ${delivery.id} is missing organizationId - cannot send. Marking as skipped.`);
            await stepDelivery.markStepDeliveryAsSkipped(db, delivery.id!);
            continue;
          }

          // Get LINE Channel Access Token from organization config
          let accessToken: string;
          try {
            const orgConfig = await getOrganizationConfig(delivery.organizationId);
            accessToken = orgConfig.line.channelAccessToken;

            if (!accessToken) {
              throw new Error('Access token is empty');
            }
          } catch (error) {
            console.error(`❌ Failed to get LINE credentials for organization ${delivery.organizationId}:`, error);
            console.error(`Step delivery ${delivery.id} cannot be sent. Will retry on next run.`);
            // Don't mark as skipped - will retry next time
            continue;
          }

          // Send step delivery message
          await pushMessageWithRetry(
            delivery.userId,
            [createTextMessage(delivery.message)],
            accessToken,
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
      res.status(200).json({ success: true, message: 'Step deliveries processed successfully' });
    } catch (error) {
      console.error('Step delivery function error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);
