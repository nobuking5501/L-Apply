/**
 * One-time script to initialize subscription information for existing organizations
 *
 * This script should be run once to add subscription and usage fields to all existing
 * organizations in the Firestore database.
 *
 * Usage:
 * 1. Make sure Firebase is properly initialized
 * 2. Run this function via Firebase Functions or as a standalone script
 * 3. All existing organizations will be updated with default subscription info
 */

import { onRequest } from 'firebase-functions/v2/https';
import { initializeOrganizationSubscription } from './utils/admin-firestore';
import { getDb } from './utils/firestore';
import { ensureFirebaseInitialized } from './utils/firebase-init';

export const initSubscriptions = onRequest(
  {
    cors: true,
    region: 'asia-northeast1',
    // Increase timeout for batch operations
    timeoutSeconds: 540,
  },
  async (req, res) => {
    // Only allow POST requests with admin secret
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const adminSecret = req.headers['x-admin-secret'] || req.body.adminSecret;
    if (adminSecret !== process.env.ADMIN_SECRET) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      ensureFirebaseInitialized();
      const db = getDb();

      // Get all organizations
      const snapshot = await db.collection('organizations').get();

      if (snapshot.empty) {
        res.status(200).json({
          success: true,
          message: 'No organizations found',
          initializedCount: 0,
        });
        return;
      }

      const results = {
        total: snapshot.size,
        initialized: 0,
        skipped: 0,
        errors: [] as string[],
      };

      // Initialize subscription for each organization
      for (const doc of snapshot.docs) {
        try {
          const data = doc.data();

          // Skip if subscription already exists
          if (data.subscription) {
            console.log(`Organization ${doc.id} already has subscription, skipping`);
            results.skipped++;
            continue;
          }

          // Initialize subscription
          await initializeOrganizationSubscription(doc.id);
          console.log(`Initialized subscription for organization ${doc.id}`);
          results.initialized++;
        } catch (error) {
          console.error(`Failed to initialize organization ${doc.id}:`, error);
          results.errors.push(`${doc.id}: ${error}`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Subscription initialization completed',
        results,
      });
    } catch (error) {
      console.error('Init subscriptions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
