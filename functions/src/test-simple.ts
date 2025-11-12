import { onRequest } from 'firebase-functions/v2/https';

export const testSimple = onRequest(
  {
    cors: true,
    region: 'asia-northeast1',
  },
  async (req, res) => {
    res.status(200).json({ message: 'Hello from test function!' });
  }
);
