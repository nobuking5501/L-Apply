/**
 * Debug script to check organization configuration for apply form errors
 * Usage: node scripts/debug-org-apply-error.ts <organizationId>
 */

import { getAdminDb } from '../lib/firebase-admin';

const db = getAdminDb();

async function debugOrganization(organizationId: string) {
  console.log('=== Organization Debug Report ===');
  console.log(`Organization ID: ${organizationId}\n`);

  try {
    // 1. Check if organization exists
    console.log('1. Checking organization document...');
    const orgDoc = await db.collection('organizations').doc(organizationId).get();

    if (!orgDoc.exists) {
      console.error('❌ Organization not found!');
      return;
    }

    const orgData = orgDoc.data();
    console.log('✅ Organization exists');
    console.log('   Name:', orgData?.name || 'N/A');
    console.log('   Company Name:', orgData?.companyName || 'N/A');
    console.log('   LIFF ID:', orgData?.liffId || '❌ NOT SET');
    console.log('   LINE Channel ID:', orgData?.lineChannelId || '❌ NOT SET');

    // 2. Check LIFF ID
    console.log('\n2. Checking LIFF ID...');
    if (!orgData?.liffId) {
      console.error('❌ LIFF ID is not set!');
      console.log('   → This will cause "LIFF IDが指定されていません" error');
    } else {
      console.log(`✅ LIFF ID: "${orgData.liffId}"`);
      console.log(`   Length: ${orgData.liffId.length} characters`);
      console.log(`   Has spaces: ${orgData.liffId.includes(' ') ? '⚠️ YES' : 'No'}`);
      console.log(`   Trimmed: "${orgData.liffId.trim()}"`);
    }

    // 3. Check organization secrets
    console.log('\n3. Checking organization secrets...');
    const secretsDoc = await db.collection('organization_secrets').doc(organizationId).get();

    if (!secretsDoc.exists) {
      console.error('❌ Organization secrets not found!');
    } else {
      const secretsData = secretsDoc.data();
      console.log('✅ Secrets exist');
      console.log('   Has Access Token:', secretsData?.lineChannelAccessToken ? '✅ Yes' : '❌ No');
      console.log('   Has Channel Secret:', secretsData?.lineChannelSecret ? '✅ Yes' : '❌ No');

      if (!secretsData?.lineChannelAccessToken) {
        console.error('   → This will cause ID token verification to fail');
      }
    }

    // 4. Check active events
    console.log('\n4. Checking active events...');
    const eventsSnapshot = await db
      .collection('events')
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true)
      .get();

    if (eventsSnapshot.empty) {
      console.error('❌ No active events found!');
      console.log('   → This will cause "現在公開中のイベントがありません" error');
    } else {
      console.log(`✅ Found ${eventsSnapshot.size} active event(s)`);
      eventsSnapshot.docs.forEach(doc => {
        const eventData = doc.data();
        console.log(`\n   Event: ${eventData.title}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Description: ${eventData.description || 'N/A'}`);
        console.log(`   Location: ${eventData.location || 'N/A'}`);
        console.log(`   Slots: ${eventData.slots?.length || 0}`);

        if (eventData.slots && eventData.slots.length > 0) {
          eventData.slots.forEach((slot: any, index: number) => {
            const current = slot.currentCapacity || 0;
            const max = slot.maxCapacity || 0;
            const isFull = current >= max;
            console.log(`      Slot ${index + 1}: ${slot.date} ${slot.time} - ${current}/${max} ${isFull ? '(満席)' : ''}`);
          });
        }
      });
    }

    // 5. Check subscription
    console.log('\n5. Checking subscription...');
    const subsSnapshot = await db
      .collection('subscriptions')
      .where('organizationId', '==', organizationId)
      .limit(1)
      .get();

    if (subsSnapshot.empty) {
      console.warn('⚠️ No subscription found');
      console.log('   → Application limits will not be enforced');
    } else {
      const subsData = subsSnapshot.docs[0].data();
      console.log('✅ Subscription exists');
      console.log(`   Tier: ${subsData.tier || 'N/A'}`);
      console.log(`   Status: ${subsData.status || 'N/A'}`);
      console.log(`   Application Limit: ${subsData.applicationLimit || 'N/A'}`);
      console.log(`   Current Count: ${subsData.currentApplicationCount || 0}`);

      if (subsData.currentApplicationCount >= subsData.applicationLimit) {
        console.error('   ❌ Application limit reached!');
        console.log('   → This will cause "今月の申込上限に達しています" error');
      }
    }

    // 6. Test LIFF ID lookup
    console.log('\n6. Testing LIFF ID lookup (like apply function does)...');
    if (orgData?.liffId) {
      const lookupSnapshot = await db
        .collection('organizations')
        .where('liffId', '==', orgData.liffId)
        .limit(1)
        .get();

      if (lookupSnapshot.empty) {
        console.error('❌ LIFF ID lookup failed!');
        console.log('   → This will cause "Invalid LIFF ID - organization not found" error');
      } else {
        console.log('✅ LIFF ID lookup succeeded');
        console.log(`   Found organization: ${lookupSnapshot.docs[0].id}`);
      }
    }

    // 7. Summary
    console.log('\n=== SUMMARY ===');
    const issues: string[] = [];

    if (!orgData?.liffId) {
      issues.push('LIFF ID not set');
    }
    if (!secretsDoc.exists || !secretsDoc.data()?.lineChannelAccessToken) {
      issues.push('LINE Channel Access Token not set');
    }
    if (eventsSnapshot.empty) {
      issues.push('No active events');
    }

    if (issues.length === 0) {
      console.log('✅ No critical issues found');
      console.log('   The organization should be able to accept applications');
    } else {
      console.log('❌ Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } catch (error) {
    console.error('Error during debug:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Get organization ID from command line argument or use default
const orgId = process.argv[2] || 'org_XOVcuVO7o6Op6idItDHsqiBgdBD3';

console.log(`Debugging organization: ${orgId}\n`);

debugOrganization(orgId)
  .then(() => {
    console.log('\n✅ Debug complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
