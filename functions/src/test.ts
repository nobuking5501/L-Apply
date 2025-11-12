import { onRequest } from 'firebase-functions/v2/https';

export const test = onRequest(
  {
    region: 'asia-northeast1',
  },
  async (req, res) => {
    res.status(200).json({ message: 'Test function works!' });
  }
);
