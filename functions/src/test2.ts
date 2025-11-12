import { onRequest } from 'firebase-functions/v2/https';
import { getLineUser } from './utils/firestore';

export const test2 = onRequest(
  {
    region: 'asia-northeast1',
  },
  async (req, res) => {
    try {
      const user = await getLineUser('test');
      res.status(200).json({ message: 'Test2 works!', user });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  }
);
