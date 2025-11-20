import { onRequest } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyIdToken, pushMessage, createTextMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import * as firestore from './utils/firestore';
import * as timezone from './utils/timezone';
import * as messages from './utils/messages';
import * as stepDelivery from './utils/step-delivery';
import { getOrganizationConfig } from './config';

interface ApplyRequestBody {
  idToken: string;
  liffId: string; // Added for multi-tenant support
  plan: string;
  slotAt: string;
  notes?: string;
  consent: boolean;
}

export const apply = onRequest(
  {
    cors: true,
    region: 'asia-northeast1',
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const body: ApplyRequestBody = req.body;

      // Validate request body
      if (!body.idToken || !body.liffId || !body.plan || !body.slotAt || body.consent === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Verify ID token and get user info
      let userId: string;
      let displayName: string;

      try {
        const userInfo = await verifyIdToken(body.idToken);
        userId = userInfo.userId;
        displayName = userInfo.displayName;
      } catch (error) {
        console.error('ID token verification failed:', error);
        res.status(401).json({ error: 'Invalid ID token' });
        return;
      }

      // Initialize Firebase
      ensureFirebaseInitialized();

      // Get organizationId from LIFF ID
      const organizationId = await firestore.getOrganizationIdByLiffId(body.liffId);
      if (!organizationId) {
        res.status(400).json({ error: 'Invalid LIFF ID - organization not found' });
        return;
      }

      // Get organization config
      const orgConfig = await getOrganizationConfig(organizationId);

      // Parse slot time
      let slotAt: Timestamp;
      try {
        slotAt = timezone.parseISOToTimestamp(body.slotAt);
      } catch (error) {
        res.status(400).json({ error: 'Invalid slotAt format' });
        return;
      }

      // Check if application already exists
      const exists = await firestore.applicationExists(userId, slotAt);
      if (exists) {
        res.status(409).json({ error: 'Application already exists for this slot' });
        return;
      }

      // Check subscription limits
      try {
        const { canAcceptApplication, incrementApplicationCount } = await import('./utils/admin-firestore');
        const canAccept = await canAcceptApplication(orgConfig.organizationId);

        if (!canAccept) {
          res.status(403).json({
            error: 'Application limit reached',
            message: '今月の申込上限に達しています。プランのアップグレードをご検討ください。',
          });
          return;
        }
      } catch (error) {
        // Gracefully handle if subscription info doesn't exist yet
        console.warn('Subscription check failed, continuing anyway:', error);
      }

      // Upsert line_user
      await firestore.upsertLineUser(userId, displayName, body.consent, orgConfig.organizationId);

      // Get user to check consent
      const user = await firestore.getLineUser(userId);
      if (!user) {
        throw new Error('Failed to create/get user');
      }

      // Create application
      const applicationId = await firestore.createApplication({
        userId,
        slotAt,
        plan: body.plan,
        notes: body.notes,
        status: 'applied',
        organizationId: orgConfig.organizationId,
        createdAt: Timestamp.now(),
      });

      // Increment application count for subscription tracking
      try {
        const { incrementApplicationCount } = await import('./utils/admin-firestore');
        await incrementApplicationCount(orgConfig.organizationId);
      } catch (error) {
        console.warn('Failed to increment application count:', error);
      }

      // Create reminders if consent is true
      if (user.consent) {
        // Check if organization can create reminders
        let canCreateReminders = true;
        try {
          const { canCreateReminder, incrementReminderCount } = await import('./utils/admin-firestore');

          // We create 2 reminders per application (T-24h and day-of)
          // Check if we have room for both
          const canCreate = await canCreateReminder(orgConfig.organizationId);

          if (!canCreate) {
            console.warn(`Reminder limit reached for organization: ${orgConfig.organizationId}`);
            canCreateReminders = false;
          }
        } catch (error) {
          console.warn('Reminder limit check failed, skipping reminders:', error);
          canCreateReminders = false;
        }

        if (canCreateReminders) {
          const t24hTime = timezone.calculateT24hReminder(slotAt);
          const dayOfTime = timezone.calculateDayOfReminder(slotAt);

          // T-24h reminder
          await firestore.createReminder({
            applicationId,
            userId,
            scheduledAt: t24hTime,
            type: 'T-24h',
            sentAt: null,
            canceled: false,
            message: messages.generateT24hReminderMessage(body.plan, slotAt),
            organizationId: orgConfig.organizationId,
          });

          // Day-of reminder (8 AM)
          await firestore.createReminder({
            applicationId,
            userId,
            scheduledAt: dayOfTime,
            type: 'day-of',
            sentAt: null,
            canceled: false,
            message: messages.generateDayOfReminderMessage(body.plan, slotAt),
            organizationId: orgConfig.organizationId,
          });

          // Increment reminder count (we created 2 reminders)
          try {
            const { incrementReminderCount } = await import('./utils/admin-firestore');
            await incrementReminderCount(orgConfig.organizationId);
            await incrementReminderCount(orgConfig.organizationId);
          } catch (error) {
            console.warn('Failed to increment reminder count:', error);
          }
        }
      }

      // Create step delivery schedule (after seminar date)
      const stepDeliveries = stepDelivery.createStepDeliverySchedule(
        applicationId,
        userId,
        slotAt,
        orgConfig.organizationId
      );

      // Check subscription limits for step deliveries
      let allowedStepDeliveriesCount = stepDeliveries.length;
      try {
        const { canCreateStepDelivery, incrementStepDeliveryCount } = await import('./utils/admin-firestore');

        // Check how many step deliveries we can create
        allowedStepDeliveriesCount = 0;
        for (let i = 0; i < stepDeliveries.length; i++) {
          const canCreate = await canCreateStepDelivery(orgConfig.organizationId);
          if (!canCreate) {
            console.warn(`Step delivery limit reached for organization: ${orgConfig.organizationId}. Created ${allowedStepDeliveriesCount}/${stepDeliveries.length} step deliveries.`);
            break;
          }
          allowedStepDeliveriesCount++;
        }
      } catch (error) {
        console.warn('Step delivery limit check failed, creating all step deliveries:', error);
      }

      // Save step deliveries to Firestore (only allowed count)
      const db = firestore.getDb();
      const batch = db.batch();

      for (let i = 0; i < allowedStepDeliveriesCount; i++) {
        const docRef = db.collection('step_deliveries').doc();
        batch.set(docRef, stepDeliveries[i]);
      }

      await batch.commit();

      // Increment step delivery count for subscription tracking
      if (allowedStepDeliveriesCount > 0) {
        try {
          const { incrementStepDeliveryCount } = await import('./utils/admin-firestore');
          for (let i = 0; i < allowedStepDeliveriesCount; i++) {
            await incrementStepDeliveryCount(orgConfig.organizationId);
          }
        } catch (error) {
          console.warn('Failed to increment step delivery count:', error);
        }
      }

      // Send completion message
      const template = await firestore.getCompletionMessageTemplate(orgConfig.organizationId);
      const completionMessage = messages.generateCompletionMessage(body.plan, slotAt, template);
      await pushMessage(userId, [createTextMessage(completionMessage)], orgConfig.line.channelAccessToken);

      // Return success
      res.status(200).json({
        success: true,
        applicationId,
      });
    } catch (error) {
      console.error('Apply function error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
