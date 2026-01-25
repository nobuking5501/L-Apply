import { onRequest } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyIdToken, pushMessage, createTextMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import * as firestore from './utils/firestore';
import * as timezone from './utils/timezone';
import * as messages from './utils/messages';
import * as stepDelivery from './utils/step-delivery';
import { getOrganizationConfig } from './config';
import { ReminderType } from './types';
import { getReminderTemplates, calculateReminderTime } from './utils/reminder-helper';
import {
  canAcceptApplication,
  incrementApplicationCount,
  canCreateReminder,
  incrementReminderCount,
  canCreateStepDelivery,
  incrementStepDeliveryCount,
} from './utils/admin-firestore';

interface ApplyRequestBody {
  idToken: string;
  liffId: string; // Added for multi-tenant support
  plan: string;
  slotAt: string;
  notes?: string;
  consent: boolean;
  // Event management fields (optional for backward compatibility)
  eventId?: string;
  slotId?: string;
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

      // Initialize Firebase
      ensureFirebaseInitialized();

      // IMPORTANT: Get organization config FIRST for multi-tenant support
      // We need the organization's LINE Channel Access Token to verify the ID token
      const organizationId = await firestore.getOrganizationIdByLiffId(body.liffId);
      if (!organizationId) {
        res.status(400).json({ error: 'Invalid LIFF ID - organization not found' });
        return;
      }

      // Get organization config (includes LINE Channel Access Token)
      const orgConfig = await getOrganizationConfig(organizationId);

      // Verify ID token and get user info
      // Use the organization's access token for multi-tenant support
      let userId: string;
      let displayName: string;

      try {
        const userInfo = await verifyIdToken(body.idToken, orgConfig.line.channelAccessToken);
        userId = userInfo.userId;
        displayName = userInfo.displayName;
      } catch (error) {
        console.error('ID token verification failed:', error);
        res.status(401).json({ error: 'Invalid ID token' });
        return;
      }

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

      // Check event slot capacity (if eventId and slotId are provided)
      if (body.eventId && body.slotId) {
        const hasCapacity = await firestore.checkSlotCapacity(body.eventId, body.slotId);
        if (!hasCapacity) {
          res.status(409).json({
            error: 'Slot is full',
            message: '選択された日時は満席です。他の日時をお選びください。'
          });
          return;
        }
      }

      // Check subscription limits
      try {
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
        // Include eventId and slotId if provided (for event management)
        eventId: body.eventId,
        slotId: body.slotId,
      });

      // Increment event slot capacity (if eventId and slotId are provided)
      if (body.eventId && body.slotId) {
        const success = await firestore.incrementSlotCapacity(body.eventId, body.slotId);
        if (!success) {
          console.error(`Failed to increment slot capacity for event ${body.eventId}, slot ${body.slotId}`);
          // Note: We continue even if capacity update fails, as the application is already created
        }
      }

      // Increment application count for subscription tracking
      try {
        await incrementApplicationCount(orgConfig.organizationId);
      } catch (error) {
        console.warn('Failed to increment application count:', error);
      }

      // Create reminders if consent is true
      if (user.consent) {
        // Get reminder templates from Firestore
        const db = firestore.getDb();
        const reminderTemplates = await getReminderTemplates(db, orgConfig.organizationId);

        // Determine which reminders to create
        let remindersToCreate: Array<{
          type: ReminderType;
          scheduledAt: Timestamp;
          message: string;
        }> = [];

        if (reminderTemplates.length > 0) {
          // Use custom templates
          console.log(`Creating ${reminderTemplates.length} custom reminders for organization: ${orgConfig.organizationId}`);

          remindersToCreate = reminderTemplates.map((template) => {
            const scheduledAt = calculateReminderTime(
              slotAt,
              template.delayDays,
              template.timeOfDay
            );

            // Replace variables in message
            const message = template.message
              .replace(/\{plan\}/g, body.plan)
              .replace(/\{time\}/g, timezone.formatTimeOnly(slotAt))
              .replace(/\{datetime\}/g, timezone.formatDateTimeWithDayOfWeek(slotAt));

            return {
              type: template.reminderType as ReminderType,
              scheduledAt,
              message,
            };
          });
        } else {
          // Fallback to default reminders (backward compatibility)
          console.log(`Using default reminders for organization: ${orgConfig.organizationId}`);

          const t24hTime = timezone.calculateT24hReminder(slotAt);
          const dayOfTime = timezone.calculateDayOfReminder(slotAt);

          remindersToCreate = [
            {
              type: 'T-24h',
              scheduledAt: t24hTime,
              message: messages.generateT24hReminderMessage(body.plan, slotAt),
            },
            {
              type: 'day-of',
              scheduledAt: dayOfTime,
              message: messages.generateDayOfReminderMessage(body.plan, slotAt),
            },
          ];
        }

        // Check subscription limits
        let canCreateReminders = true;
        try {
          for (let i = 0; i < remindersToCreate.length; i++) {
            const canCreate = await canCreateReminder(orgConfig.organizationId);
            if (!canCreate) {
              console.warn(`Reminder limit reached for organization: ${orgConfig.organizationId}. Created ${i}/${remindersToCreate.length} reminders.`);
              remindersToCreate = remindersToCreate.slice(0, i);
              break;
            }
          }
        } catch (error) {
          console.warn('Reminder limit check failed, skipping reminders:', error);
          canCreateReminders = false;
        }

        // Create reminders
        if (canCreateReminders && remindersToCreate.length > 0) {
          for (const reminder of remindersToCreate) {
            await firestore.createReminder({
              applicationId,
              userId,
              scheduledAt: reminder.scheduledAt,
              type: reminder.type,
              sentAt: null,
              canceled: false,
              message: reminder.message,
              organizationId: orgConfig.organizationId,
            });
          }

          // Increment reminder count
          try {
            for (let i = 0; i < remindersToCreate.length; i++) {
              await incrementReminderCount(orgConfig.organizationId);
            }
          } catch (error) {
            console.warn('Failed to increment reminder count:', error);
          }

          console.log(`Created ${remindersToCreate.length} reminders for application: ${applicationId}`);
        }
      }

      // Create step delivery schedule (after seminar date)
      const db = firestore.getDb();
      const stepDeliveries = await stepDelivery.createStepDeliverySchedule(
        db,
        applicationId,
        userId,
        slotAt,
        orgConfig.organizationId,
        body.plan
      );

      // Check subscription limits for step deliveries
      let allowedStepDeliveriesCount = stepDeliveries.length;
      try {
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
      const batch = db.batch();

      for (let i = 0; i < allowedStepDeliveriesCount; i++) {
        const docRef = db.collection('step_deliveries').doc();
        batch.set(docRef, stepDeliveries[i]);
      }

      await batch.commit();

      // Increment step delivery count for subscription tracking
      if (allowedStepDeliveriesCount > 0) {
        try {
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
