import { onRequest } from 'firebase-functions/v2/https';

export const webhookSimple = onRequest(
  {
    region: 'asia-northeast1',
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    try {
      // Log the webhook event
      console.log('Webhook received:', JSON.stringify(req.body));

      // Return success
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal server error');
    }
  }
);
