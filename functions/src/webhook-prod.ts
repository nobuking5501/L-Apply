import { onRequest } from 'firebase-functions/v2/https';
import { verifySignature, replyMessage, createTextMessage, getProfile, pushMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import * as firestore from './utils/firestore';
import * as messages from './utils/messages';
import * as stepDelivery from './utils/step-delivery';

// LINE Webhook Event types
interface WebhookEvent {
  type: string;
  message?: {
    type: string;
    text?: string;
  };
  replyToken: string;
  source: {
    userId?: string;
  };
}

export const webhook = onRequest(
  {
    region: 'asia-northeast1',
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    // Verify signature
    const signature = req.headers['x-line-signature'] as string;
    if (!signature) {
      res.status(400).send('Missing signature');
      return;
    }

    const body = JSON.stringify(req.body);
    if (!verifySignature(body, signature)) {
      res.status(401).send('Invalid signature');
      return;
    }

    try {
      const events: WebhookEvent[] = req.body.events;

      for (const event of events) {
        if (event.type === 'message' && event.message?.type === 'text') {
          await handleTextMessage(event);
        } else if (event.type === 'follow') {
          await handleFollowEvent(event);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal server error');
    }
  }
);

async function handleTextMessage(event: WebhookEvent): Promise<void> {
  if (event.message?.type !== 'text') {
    return;
  }

  const userId = event.source.userId;
  if (!userId) {
    return;
  }

  const text = event.message.text?.trim() || '';
  const replyToken = event.replyToken;

  try {
    // Initialize Firebase
    ensureFirebaseInitialized();

    // Get Firestore instance
    const db = firestore.getDb();

    // Handle different commands
    if (text === '配信停止') {
      await firestore.updateUserConsent(userId, false);

      // Skip all pending step deliveries for this user
      await stepDelivery.skipAllStepDeliveriesForUser(db, userId);

      const message = messages.generateConsentUpdateMessage(false);
      await replyMessage(replyToken, [createTextMessage(message)]);
    } else if (text === '再開' || text === '停止解除') {
      await firestore.updateUserConsent(userId, true);
      const message = messages.generateConsentUpdateMessage(true);
      await replyMessage(replyToken, [createTextMessage(message)]);
    } else if (text === '予約確認') {
      const application = await firestore.getLatestApplication(userId);

      if (!application) {
        const message = messages.generateNoReservationMessage();
        await replyMessage(replyToken, [createTextMessage(message)]);
      } else {
        const message = messages.generateReservationConfirmationMessage(application.plan, application.slotAt);
        await replyMessage(replyToken, [createTextMessage(message)]);
      }
    } else if (text === 'キャンセル') {
      const application = await firestore.getLatestApplication(userId);

      if (!application) {
        const message = messages.generateNoReservationMessage();
        await replyMessage(replyToken, [createTextMessage(message)]);
      } else {
        // Cancel application
        await firestore.cancelApplication(application.id!);

        // Cancel reminders
        await firestore.cancelRemindersForApplication(application.id!);

        // Skip step deliveries for this application
        await stepDelivery.skipAllStepDeliveriesForApplication(db, application.id!);

        const message = messages.generateCancellationMessage(application.slotAt);
        await replyMessage(replyToken, [createTextMessage(message)]);
      }
    } else {
      // Check for auto-reply messages
      const organizationId = process.env.ORGANIZATION_ID || '';
      const autoReplyMessage = await firestore.getAutoReplyMessage(organizationId, text);

      if (autoReplyMessage) {
        // Send auto-reply message
        await replyMessage(replyToken, [createTextMessage(autoReplyMessage)]);

        // If it's a consultation request, save it
        if (text === '個別相談希望' || text === '個別相談' || text === '相談希望') {
          await firestore.createConsultationRequest(userId, organizationId);
        }
      } else {
        // Unknown command
        const message = messages.generateUnknownCommandMessage();
        await replyMessage(replyToken, [createTextMessage(message)]);
      }
    }
  } catch (error) {
    console.error('Error handling text message:', error);
    // Don't throw - just log the error
  }
}

async function handleFollowEvent(event: WebhookEvent): Promise<void> {
  const userId = event.source.userId;
  if (!userId) {
    return;
  }

  try {
    // Initialize Firebase
    ensureFirebaseInitialized();

    // Get config from environment variables
    const organizationId = process.env.ORGANIZATION_ID || '';
    const liffId = process.env.LIFF_ID || '';

    // Get user profile from LINE
    const profile = await getProfile(userId);

    // Save user to Firestore
    await firestore.upsertLineUser(userId, profile.displayName, true, organizationId);

    // Get welcome message template from Firestore
    const welcomeMessage = await firestore.getWelcomeMessageTemplate(organizationId);

    if (welcomeMessage) {
      // Add LIFF app link to the message
      const liffUrl = `https://liff.line.me/${liffId}`;
      const messageWithLink = `${welcomeMessage}\n\n【セミナー申込はこちら】\n${liffUrl}`;

      // Send welcome message
      await pushMessage(userId, [createTextMessage(messageWithLink)]);
    } else {
      // Fallback welcome message if no template is configured
      const liffUrl = `https://liff.line.me/${liffId}`;
      const defaultMessage = `友だち追加ありがとうございます！\n\nセミナーのお申込みは下記のリンクからどうぞ。\n${liffUrl}`;
      await pushMessage(userId, [createTextMessage(defaultMessage)]);
    }
  } catch (error) {
    console.error('Error handling follow event:', error);
    // Don't throw - just log the error
  }
}
