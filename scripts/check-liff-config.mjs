/**
 * Check organization configuration by LIFF ID
 * Usage: node scripts/check-liff-config.mjs <liffId>
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkLiffConfiguration(liffId) {
  console.log('=== LIFF Configuration Check ===');
  console.log(`LIFF ID: ${liffId}\n`);

  try {
    // 1. Find organization by LIFF ID
    console.log('1. Searching for organization with this LIFF ID...');
    const orgSnapshot = await db
      .collection('organizations')
      .where('liffId', '==', liffId)
      .limit(1)
      .get();

    if (orgSnapshot.empty) {
      console.error('❌ No organization found with this LIFF ID!');
      console.log('\n⚠️ This will cause: "Invalid LIFF ID - organization not found" error');

      // Try to find organizations with similar LIFF IDs
      console.log('\n🔍 Searching for similar LIFF IDs...');
      const allOrgs = await db.collection('organizations').get();
      const orgsWithLiff = [];
      allOrgs.docs.forEach(doc => {
        const data = doc.data();
        if (data.liffId) {
          orgsWithLiff.push({
            id: doc.id,
            liffId: data.liffId,
            name: data.name
          });
        }
      });

      if (orgsWithLiff.length > 0) {
        console.log('\n📋 Organizations with LIFF IDs:');
        orgsWithLiff.forEach(org => {
          console.log(`  - ${org.id}: ${org.liffId} (${org.name || 'No name'})`);
        });
      } else {
        console.log('❌ No organizations have LIFF IDs set');
      }

      return;
    }

    const orgDoc = orgSnapshot.docs[0];
    const orgData = orgDoc.data();
    const organizationId = orgDoc.id;

    console.log('✅ Organization found!');
    console.log(`   Organization ID: ${organizationId}`);
    console.log(`   Name: ${orgData.name || 'N/A'}`);
    console.log(`   LIFF ID: ${orgData.liffId}`);

    // 2. Check organization_secrets
    console.log('\n2. Checking LINE credentials (organization_secrets)...');
    const secretsDoc = await db.collection('organization_secrets').doc(organizationId).get();

    if (!secretsDoc.exists) {
      console.error('❌ No secrets found!');
      console.log('   → This will cause: "Invalid ID token" error (401)');
    } else {
      const secretsData = secretsDoc.data();
      const hasToken = !!secretsData?.lineChannelAccessToken;
      const hasSecret = !!secretsData?.lineChannelSecret;

      console.log(`   Access Token: ${hasToken ? '✅ Set' : '❌ NOT SET'}`);
      console.log(`   Channel Secret: ${hasSecret ? '✅ Set' : '❌ NOT SET'}`);

      if (!hasToken) {
        console.error('\n   ⚠️ Missing Access Token will cause: "Invalid ID token" error (401)');
      }
    }

    // 3. Check active events
    console.log('\n3. Checking active events...');
    const eventsSnapshot = await db
      .collection('events')
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true)
      .get();

    if (eventsSnapshot.empty) {
      console.error('❌ No active events!');
      console.log('   → This will cause: "現在公開中のイベントがありません" error');
    } else {
      console.log(`✅ Found ${eventsSnapshot.size} active event(s)`);

      eventsSnapshot.docs.forEach(doc => {
        const eventData = doc.data();
        console.log(`\n   📅 Event: ${eventData.title}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Location: ${eventData.location || 'N/A'}`);

        const slots = eventData.slots || [];
        console.log(`      Slots: ${slots.length}`);

        if (slots.length === 0) {
          console.error('      ❌ No slots defined!');
        } else {
          slots.forEach((slot, idx) => {
            const current = slot.currentCapacity || 0;
            const max = slot.maxCapacity || 0;
            const isFull = current >= max;
            const status = isFull ? '❌ FULL' : '✅ Available';
            console.log(`      Slot ${idx + 1}: ${slot.date} ${slot.time} - ${current}/${max} ${status}`);
          });
        }
      });
    }

    // 4. Check subscription limits
    console.log('\n4. Checking subscription limits...');
    const subsSnapshot = await db
      .collection('subscriptions')
      .where('organizationId', '==', organizationId)
      .limit(1)
      .get();

    if (subsSnapshot.empty) {
      console.log('⚠️ No subscription found (limits not enforced)');
    } else {
      const subsData = subsSnapshot.docs[0].data();
      const current = subsData.currentApplicationCount || 0;
      const limit = subsData.applicationLimit || 0;
      const isLimitReached = current >= limit;

      console.log(`   Tier: ${subsData.tier || 'N/A'}`);
      console.log(`   Status: ${subsData.status || 'N/A'}`);
      console.log(`   Applications: ${current}/${limit} ${isLimitReached ? '❌ LIMIT REACHED' : '✅'}`);

      if (isLimitReached) {
        console.error('\n   ⚠️ Application limit reached will cause: "今月の申込上限に達しています" error (403)');
      }
    }

    // 5. Check recent applications for this organization
    console.log('\n5. Checking recent applications...');
    const appsSnapshot = await db
      .collection('applications')
      .where('organizationId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (appsSnapshot.empty) {
      console.log('   No applications yet');
    } else {
      console.log(`   Last ${appsSnapshot.size} applications:`);
      appsSnapshot.docs.forEach((doc, idx) => {
        const app = doc.data();
        const date = app.slotAt?.toDate ? app.slotAt.toDate().toISOString() : 'N/A';
        console.log(`   ${idx + 1}. User: ${app.userId} | Slot: ${date} | Status: ${app.status}`);
      });
    }

    // 6. Summary
    console.log('\n=== SUMMARY ===');
    const issues = [];

    if (!secretsDoc.exists || !secretsDoc.data()?.lineChannelAccessToken) {
      issues.push('LINE Channel Access Token is missing');
    }
    if (eventsSnapshot.empty) {
      issues.push('No active events');
    } else {
      let hasAvailableSlot = false;
      eventsSnapshot.docs.forEach(doc => {
        const slots = doc.data().slots || [];
        slots.forEach(slot => {
          const current = slot.currentCapacity || 0;
          const max = slot.maxCapacity || 0;
          if (current < max) {
            hasAvailableSlot = true;
          }
        });
      });
      if (!hasAvailableSlot) {
        issues.push('All slots are full');
      }
    }
    if (!subsSnapshot.empty) {
      const subsData = subsSnapshot.docs[0].data();
      if ((subsData.currentApplicationCount || 0) >= (subsData.applicationLimit || 0)) {
        issues.push('Application limit reached');
      }
    }

    if (issues.length === 0) {
      console.log('✅ No issues found - application form should work');
    } else {
      console.log('❌ Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  }
}

// Get LIFF ID from command line or use default
const liffId = process.argv[2] || '2008813377-giAgrmJV';

checkLiffConfiguration(liffId)
  .then(() => {
    console.log('\n✅ Check complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
