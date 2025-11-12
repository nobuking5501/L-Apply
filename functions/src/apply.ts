import { onRequest } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyIdToken, pushMessage, createTextMessage } from './utils/line';
import {
  upsertLineUser,
  createApplication,
  createReminder,
  applicationExists,
  getLineUser,
} from './utils/firestore';
import {
  parseISOToTimestamp,
  calculateT24hReminder,
  calculateDayOfReminder,
} from './utils/timezone';
import {
  generateCompletionMessage,
  generateT24hReminderMessage,
  generateDayOfReminderMessage,
} from './utils/messages';
import { ApplyRequestBody } from './types';

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
      if (!body.idToken || !body.plan || !body.slotAt || body.consent === undefined) {
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

      // Parse slot time
      let slotAt: Timestamp;
      try {
        slotAt = parseISOToTimestamp(body.slotAt);
      } catch (error) {
        res.status(400).json({ error: 'Invalid slotAt format' });
        return;
      }

      // Check if application already exists
      const exists = await applicationExists(userId, slotAt);
      if (exists) {
        res.status(409).json({ error: 'Application already exists for this slot' });
        return;
      }

      // Upsert line_user
      await upsertLineUser(userId, displayName, body.consent);

      // Get user to check consent
      const user = await getLineUser(userId);
      if (!user) {
        throw new Error('Failed to create/get user');
      }

      // Create application
      const applicationId = await createApplication({
        userId,
        slotAt,
        plan: body.plan,
        notes: body.notes,
        status: 'applied',
        createdAt: Timestamp.now(),
      });

      // Create reminders if consent is true
      if (user.consent) {
        const t24hTime = calculateT24hReminder(slotAt);
        const dayOfTime = calculateDayOfReminder(slotAt);

        // T-24h reminder
        await createReminder({
          applicationId,
          userId,
          scheduledAt: t24hTime,
          type: 'T-24h',
          sentAt: null,
          canceled: false,
          message: generateT24hReminderMessage(body.plan, slotAt),
        });

        // Day-of reminder (8 AM)
        await createReminder({
          applicationId,
          userId,
          scheduledAt: dayOfTime,
          type: 'day-of',
          sentAt: null,
          canceled: false,
          message: generateDayOfReminderMessage(body.plan, slotAt),
        });
      }

      // Send completion message
      const completionMessage = generateCompletionMessage(body.plan, slotAt);
      await pushMessage(userId, [createTextMessage(completionMessage)]);

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
