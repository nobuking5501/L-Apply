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
          // IMPORTANT: Mark as "sending" FIRST to prevent duplicate sends
          // This prevents race conditions where the same delivery is picked up
          // by another scheduled run before it's marked as sent
          await stepDelivery.markStepDeliveryAsSending(db, delivery.id!);

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
            console.error(`Step delivery ${delivery.id} cannot be sent. Resetting to pending for retry.`);
            // Reset to pending so it can be retried
            await stepDelivery.markStepDeliveryAsPending(db, delivery.id!);
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
          // Reset to pending so it can be retried on next run
          try {
            await stepDelivery.markStepDeliveryAsPending(db, delivery.id!);
          } catch (resetError) {
            console.error(`Failed to reset step delivery ${delivery.id} to pending:`, resetError);
          }
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
