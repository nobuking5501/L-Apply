import { onRequest } from 'firebase-functions/v2/https';
import { verifySignature, replyMessage, createTextMessage, getProfile, pushMessage } from './utils/line';
import { ensureFirebaseInitialized } from './utils/firebase-init';
import * as firestore from './utils/firestore';
import * as messages from './utils/messages';
import * as stepDelivery from './utils/step-delivery';
import { getOrganizationConfig } from './config';

// LINE Webhook Event types
// Multi-tenant support: Automatically identifies organization from webhook signature
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

/**
 * Verify signature and identify which organization the webhook is from
 * @param body Request body as string
 * @param signature X-LINE-Signature header value
 * @returns organizationId if verification succeeds, null otherwise
 */
async function verifySignatureAndGetOrganization(
  body: string,
  signature: string
): Promise<string | null> {
  ensureFirebaseInitialized();
  const db = firestore.getDb();

  // Get all organizations
  const orgsSnapshot = await db.collection('organizations').get();

  // Try to verify signature with each organization's channelSecret
  for (const orgDoc of orgsSnapshot.docs) {
    const orgId = orgDoc.id;
    const orgData = orgDoc.data();

    // Try to get channelSecret from organization_secrets first (new method)
    let channelSecret = '';

    try {
      const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();
      if (secretsDoc.exists) {
        const secretsData = secretsDoc.data();
        channelSecret = secretsData?.lineChannelSecret || '';
      }
    } catch (error) {
      console.warn(`Failed to fetch organization_secrets for ${orgId}`, error);
    }

    // Fallback to old structure (backward compatibility)
    if (!channelSecret) {
      const settings = orgData.settings || {};
      const branding = settings.branding || {};
      channelSecret = orgData.lineChannelSecret || branding.lineChannelSecret || '';
    }

    if (!channelSecret) {
      continue;
    }

    // Verify signature with this organization's secret
    if (verifySignature(body, signature, channelSecret)) {
      return orgId;
    }
  }

  return null;
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

    // Verify signature and identify organization
    const organizationId = await verifySignatureAndGetOrganization(body, signature);
    if (!organizationId) {
      console.error('Invalid signature - no matching organization found');
      res.status(401).send('Invalid signature');
      return;
    }

    console.log(`Webhook request from organization: ${organizationId}`);

    try {
      const events: WebhookEvent[] = req.body.events;

      for (const event of events) {
        if (event.type === 'message' && event.message?.type === 'text') {
          await handleTextMessage(event, organizationId);
        } else if (event.type === 'follow') {
          await handleFollowEvent(event, organizationId);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal server error');
    }
  }
);

async function handleTextMessage(event: WebhookEvent, organizationId: string): Promise<void> {
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

    // Get organization config
    const orgConfig = await getOrganizationConfig(organizationId);

    // Get Firestore instance
    const db = firestore.getDb();

    // Handle different commands
    if (text === '配信停止') {
      await firestore.updateUserConsent(userId, false);

      // Skip all pending step deliveries for this user
      await stepDelivery.skipAllStepDeliveriesForUser(db, userId);

      const message = messages.generateConsentUpdateMessage(false);
      await replyMessage(replyToken, [createTextMessage(message)], orgConfig.line.channelAccessToken);
    } else if (text === '再開' || text === '停止解除') {
      await firestore.updateUserConsent(userId, true);
      const message = messages.generateConsentUpdateMessage(true);
      await replyMessage(replyToken, [createTextMessage(message)], orgConfig.line.channelAccessToken);
    } else if (text === '予約確認') {
      const application = await firestore.getLatestApplication(userId);

      if (!application) {
        const message = messages.generateNoReservationMessage();
        await replyMessage(replyToken, [createTextMessage(message)], orgConfig.line.channelAccessToken);
      } else {
        const message = messages.generateReservationConfirmationMessage(application.plan, application.slotAt);
        await replyMessage(replyToken, [createTextMessage(message)], orgConfig.line.channelAccessToken);
      }
    } else if (text === 'キャンセル') {
      const application = await firestore.getLatestApplication(userId);

      if (!application) {
        const message = messages.generateNoReservationMessage();
        await replyMessage(replyToken, [createTextMessage(message)], orgConfig.line.channelAccessToken);
      } else {
        // Cancel application
        await firestore.cancelApplication(application.id!);

        // Cancel reminders
        await firestore.cancelRemindersForApplication(application.id!);

        // Skip step deliveries for this application
        await stepDelivery.skipAllStepDeliveriesForApplication(db, application.id!);

        const message = messages.generateCancellationMessage(application.slotAt);
        await replyMessage(replyToken, [createTextMessage(message)], orgConfig.line.channelAccessToken);
      }
    } else {
      // Check for auto-reply messages
      const autoReplyMessage = await firestore.getAutoReplyMessage(organizationId, text);

      if (autoReplyMessage) {
        // Send auto-reply message
        await replyMessage(replyToken, [createTextMessage(autoReplyMessage)], orgConfig.line.channelAccessToken);

        // If it's a consultation request, save it
        if (text === '個別相談希望' || text === '個別相談' || text === '相談希望') {
          await firestore.createConsultationRequest(userId, organizationId);
        }
      }
      // If no auto-reply message is found, do nothing (don't send any response)
    }
  } catch (error) {
    console.error('Error handling text message:', error);
    // Don't throw - just log the error
  }
}

async function handleFollowEvent(event: WebhookEvent, organizationId: string): Promise<void> {
  const userId = event.source.userId;
  if (!userId) {
    return;
  }

  try {
    // Initialize Firebase
    ensureFirebaseInitialized();

    // Get organization config
    const orgConfig = await getOrganizationConfig(organizationId);

    // Get user profile from LINE
    const profile = await getProfile(userId, orgConfig.line.channelAccessToken);

    // Save user to Firestore
    await firestore.upsertLineUser(userId, profile.displayName, true, organizationId);

    // Get welcome message template from Firestore
    const welcomeMessage = await firestore.getWelcomeMessageTemplate(organizationId);

    if (welcomeMessage) {
      // Add LIFF app link to the message
      const liffUrl = `https://liff.line.me/${orgConfig.liff.id}`;
      const messageWithLink = `${welcomeMessage}\n\n【セミナー申込はこちら】\n${liffUrl}`;

      // Send welcome message
      await pushMessage(userId, [createTextMessage(messageWithLink)], orgConfig.line.channelAccessToken);
    } else {
      // Fallback welcome message if no template is configured
      const liffUrl = `https://liff.line.me/${orgConfig.liff.id}`;
      const defaultMessage = `友だち追加ありがとうございます！\n\nセミナーのお申込みは下記のリンクからどうぞ。\n${liffUrl}`;
      await pushMessage(userId, [createTextMessage(defaultMessage)], orgConfig.line.channelAccessToken);
    }
  } catch (error) {
    console.error('Error handling follow event:', error);
    // Don't throw - just log the error
  }
}
