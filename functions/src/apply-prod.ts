import { onRequest } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyIdToken, pushMessage, createTextMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import * as firestore from './utils/firestore';
import * as timezone from './utils/timezone';
import * as messages from './utils/messages';
import * as stepDelivery from './utils/step-delivery';
import { getOrganizationConfig } from './config';
import { ReminderType, StepDelivery } from './types';
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
    // === 一時的な確認機能（ステップ配信チェック用） ===
    if (req.query.checkPending === 'true') {
      ensureFirebaseInitialized();
      const db = firestore.getDb();
      const dryRun = req.query.dryRun !== 'false';

      console.log('🔍 Pending状態のステップ配信を確認');

      const snapshot = await db
        .collection('step_deliveries')
        .where('status', '==', 'pending')
        .get();

      if (snapshot.size === 0) {
        res.status(200).json({
          success: true,
          message: 'Pending状態のステップ配信は見つかりませんでした。',
          count: 0,
        });
        return;
      }

      const byOrganization: Record<string, any[]> = {};

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const orgId = data.organizationId || 'unknown';

        if (!byOrganization[orgId]) {
          byOrganization[orgId] = [];
        }

        byOrganization[orgId].push({
          id: doc.id,
          stepNumber: data.stepNumber,
          scheduledAt: data.scheduledAt?.toDate(),
        });
      }

      const summary = Object.entries(byOrganization).map(([orgId, deliveries]) => ({
        organizationId: orgId,
        count: deliveries.length,
      }));

      if (!dryRun) {
        const batchSize = 500;
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = db.batch();
          const batchDocs = docs.slice(i, i + batchSize);

          batchDocs.forEach(doc => {
            batch.update(doc.ref, { status: 'skipped' });
          });

          await batch.commit();
        }

        res.status(200).json({
          success: true,
          message: `${snapshot.size}件のPending配信をスキップしました。`,
          totalSkipped: snapshot.size,
          byOrganization: summary,
        });
      } else {
        res.status(200).json({
          success: true,
          message: '確認のみモード。実行するには ?dryRun=false を付けてください。',
          totalPending: snapshot.size,
          byOrganization: summary,
        });
      }
      return;
    }
    // === 一時的な確認機能ここまで ===

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

      // Get organization document once for all feature flags
      const db = firestore.getDb();
      const orgDoc = await db.collection('organizations').doc(orgConfig.organizationId).get();
      const orgData = orgDoc.data();

      // Check feature flags
      // Default to true for backward compatibility (existing organizations should continue working)
      const reminderEnabled = orgData?.features?.reminderEnabled !== false;
      const stepDeliveryEnabled = orgData?.features?.stepDeliveryEnabled === true;

      // Create reminders if consent is true AND reminder is enabled
      if (user.consent && reminderEnabled) {
        console.log(`Reminder is enabled for organization: ${orgConfig.organizationId}`);

        // Get reminder templates from Firestore
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
      // IMPORTANT: Only create if explicitly enabled at organization level
      // Note: stepDeliveryEnabled is already checked above (line 251)

      let stepDeliveries: Omit<StepDelivery, 'id'>[] = [];
      let allowedStepDeliveriesCount = 0;

      if (stepDeliveryEnabled) {
        console.log(`Step delivery is enabled for organization: ${orgConfig.organizationId}`);

        stepDeliveries = await stepDelivery.createStepDeliverySchedule(
          db,
          applicationId,
          userId,
          slotAt,
          orgConfig.organizationId,
          body.plan
        );

        // Check subscription limits for step deliveries
        allowedStepDeliveriesCount = stepDeliveries.length;
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

          console.log(`Created ${allowedStepDeliveriesCount} step deliveries for organization: ${orgConfig.organizationId}`);
        }
      } else {
        console.log(`Step delivery is disabled for organization: ${orgConfig.organizationId}. Skipping step delivery creation.`);
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
