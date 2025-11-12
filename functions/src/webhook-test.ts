import { onRequest } from 'firebase-functions/v2/https';
import { verifySignature, replyMessage, createTextMessage } from './utils/line';

export const webhookTest = onRequest(
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
      console.log('Webhook received:', JSON.stringify(req.body));

      // Test: echo back any message
      const events = req.body.events || [];
      for (const event of events) {
        if (event.type === 'message' && event.message?.type === 'text') {
          const text = event.message.text;
          await replyMessage(event.replyToken, [createTextMessage(`受信しました: ${text}`)]);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal server error');
    }
  }
);
