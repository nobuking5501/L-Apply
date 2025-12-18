/**
 * Data Migration Script: Move LINE secrets from organizations to organization_secrets
 *
 * This script safely migrates lineChannelSecret and lineChannelAccessToken from the
 * organizations collection to a new organization_secrets collection for better security.
 *
 * Usage:
 *   npx ts-node scripts/migrate-secrets.ts
 *
 * Requirements:
 *   - FIREBASE_SERVICE_ACCOUNT environment variable set with service account JSON
 *   - OR GOOGLE_APPLICATION_CREDENTIALS pointing to service account key file
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
function initializeFirebase() {
  if (getApps().length > 0) {
    return;
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      });
    } else {
      initializeApp();
    }
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

async function migrateSecrets() {
  initializeFirebase();
  const db = getFirestore();

  console.log('\n🔄 Starting secret migration...\n');

  try {
    // Get all organizations
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`📊 Found ${orgsSnapshot.size} organizations\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each organization
    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();

      console.log(`Processing organization: ${orgId} (${orgData.name || 'Unnamed'})`);

      try {
        const hasSecret = orgData.lineChannelSecret;
        const hasToken = orgData.lineChannelAccessToken;

        if (!hasSecret && !hasToken) {
          console.log(`  ⏭️  Skipped - No secrets to migrate\n`);
          skippedCount++;
          continue;
        }

        // Check if already migrated
        const secretDoc = await db.collection('organization_secrets').doc(orgId).get();
        if (secretDoc.exists) {
          console.log(`  ⚠️  Warning - Secrets already exist in organization_secrets`);
          console.log(`  ℹ️  Will update with current values from organizations collection\n`);
        }

        // Create/update secrets document
        const secretsData: any = {
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (hasSecret) {
          secretsData.lineChannelSecret = orgData.lineChannelSecret;
          console.log(`  ✓ Migrating lineChannelSecret`);
        }

        if (hasToken) {
          secretsData.lineChannelAccessToken = orgData.lineChannelAccessToken;
          console.log(`  ✓ Migrating lineChannelAccessToken`);
        }

        // Write to organization_secrets
        await db.collection('organization_secrets').doc(orgId).set(secretsData, { merge: true });
        console.log(`  ✅ Secrets migrated successfully\n`);

        migratedCount++;

        // Optional: Remove secrets from organizations collection
        // Uncomment the lines below if you want to clean up the old location
        // WARNING: Only do this after verifying the migration was successful!
        /*
        const updateData: any = {};
        if (hasSecret) {
          updateData.lineChannelSecret = FieldValue.delete();
        }
        if (hasToken) {
          updateData.lineChannelAccessToken = FieldValue.delete();
        }
        await db.collection('organizations').doc(orgId).update(updateData);
        console.log(`  🧹 Cleaned up secrets from organizations collection\n`);
        */

      } catch (error) {
        console.error(`  ❌ Error migrating ${orgId}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${orgsSnapshot.size}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Some migrations failed. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Verify the migration by checking the organization_secrets collection');
      console.log('2. Test the settings page (/dashboard/settings)');
      console.log('3. Test the LIFF page (/liff/apply)');
      console.log('4. If everything works, uncomment the cleanup code in this script and run again');
      console.log('5. Deploy Firestore rules: firebase deploy --only firestore:rules');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateSecrets()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
