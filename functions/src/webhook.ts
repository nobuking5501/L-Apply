import { onRequest } from 'firebase-functions/v2/https';
import { verifySignature, replyMessage, createTextMessage } from './utils/line';
import {
  updateUserConsent,
  getLatestApplication,
  cancelApplication,
  cancelRemindersForApplication,
} from './utils/firestore';
import {
  generateConsentUpdateMessage,
  generateNoReservationMessage,
  generateReservationConfirmationMessage,
  generateCancellationMessage,
  generateUnknownCommandMessage,
} from './utils/messages';

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
    // Handle different commands
    if (text === '配信停止') {
      await updateUserConsent(userId, false);
      const message = generateConsentUpdateMessage(false);
      await replyMessage(replyToken, [createTextMessage(message)]);
    } else if (text === '再開' || text === '停止解除') {
      await updateUserConsent(userId, true);
      const message = generateConsentUpdateMessage(true);
      await replyMessage(replyToken, [createTextMessage(message)]);
    } else if (text === '予約確認') {
      const application = await getLatestApplication(userId);

      if (!application) {
        const message = generateNoReservationMessage();
        await replyMessage(replyToken, [createTextMessage(message)]);
      } else {
        const message = generateReservationConfirmationMessage(application.plan, application.slotAt);
        await replyMessage(replyToken, [createTextMessage(message)]);
      }
    } else if (text === 'キャンセル') {
      const application = await getLatestApplication(userId);

      if (!application) {
        const message = generateNoReservationMessage();
        await replyMessage(replyToken, [createTextMessage(message)]);
      } else {
        // Cancel application
        await cancelApplication(application.id!);

        // Cancel reminders
        await cancelRemindersForApplication(application.id!);

        const message = generateCancellationMessage(application.slotAt);
        await replyMessage(replyToken, [createTextMessage(message)]);
      }
    } else {
      // Unknown command
      const message = generateUnknownCommandMessage();
      await replyMessage(replyToken, [createTextMessage(message)]);
    }
  } catch (error) {
    console.error('Error handling text message:', error);
    // Don't throw - just log the error
  }
}
