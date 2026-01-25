import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5R_EwSLznU1TZxPP3w8EHA1iopYDzhZI",
  authDomain: "l-apply.firebaseapp.com",
  projectId: "l-apply",
  storageBucket: "l-apply.firebasestorage.app",
  messagingSenderId: "1076344687205",
  appId: "1:1076344687205:web:313e0215b6defd2b11d48c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const org1Id = 'org_XOVcuVO7o6Op6idItDHsqiBgdBD3'; // 申込不可
const org2Id = 'org_LRLxHcD2I6QC0ztGNAxSSwwCAhl1'; // 申込可

async function fetchOrgData(orgId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 組織: ${orgId}`);
  console.log('='.repeat(80));

  // Fetch organization document
  const orgDoc = await getDoc(doc(db, 'organizations', orgId));
  const orgData = orgDoc.exists() ? orgDoc.data() : null;

  // Fetch organization_secrets document
  const secretsDoc = await getDoc(doc(db, 'organization_secrets', orgId));
  const secretsData = secretsDoc.exists() ? secretsDoc.data() : null;

  // Fetch subscriptions document
  const subscriptionsDoc = await getDoc(doc(db, 'subscriptions', orgId));
  const subscriptionsData = subscriptionsDoc.exists() ? subscriptionsDoc.data() : null;

  // Fetch events
  const eventsQuery = query(
    collection(db, 'events'),
    where('organizationId', '==', orgId),
    where('isActive', '==', true)
  );
  const eventsSnapshot = await getDocs(eventsQuery);
  const events = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return {
    organizations: orgData,
    organization_secrets: secretsData,
    subscriptions: subscriptionsData,
    events,
  };
}

function compareObjects(obj1, obj2, label) {
  console.log(`\n🔍 ${label} の比較:\n`);

  const allKeys = new Set([
    ...Object.keys(obj1 || {}),
    ...Object.keys(obj2 || {}),
  ]);

  const differences = [];

  for (const key of allKeys) {
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    const str1 = JSON.stringify(val1);
    const str2 = JSON.stringify(val2);

    if (str1 !== str2) {
      differences.push({
        field: key,
        org1: val1,
        org2: val2,
      });
    }
  }

  if (differences.length === 0) {
    console.log('✅ すべてのフィールドが同じです');
  } else {
    console.log(`⚠️  ${differences.length} 個の違いが見つかりました:\n`);
    differences.forEach((diff) => {
      console.log(`  📌 フィールド: ${diff.field}`);
      console.log(`     org_XOVcuVO7o6Op6idItDHsqiBgdBD3 (申込不可): ${JSON.stringify(diff.org1)}`);
      console.log(`     org_LRLxHcD2I6QC0ztGNAxSSwwCAhl1 (申込可):   ${JSON.stringify(diff.org2)}`);
      console.log();
    });
  }
}

async function main() {
  try {
    console.log('🔍 組織の比較を開始します...\n');

    const data1 = await fetchOrgData(org1Id);
    const data2 = await fetchOrgData(org2Id);

    console.log('\n' + '='.repeat(80));
    console.log('📊 比較結果');
    console.log('='.repeat(80));

    // Compare organizations collection
    compareObjects(data1.organizations, data2.organizations, 'organizations コレクション');

    // Compare organization_secrets collection
    console.log('\n' + '-'.repeat(80));
    compareObjects(
      data1.organization_secrets,
      data2.organization_secrets,
      'organization_secrets コレクション'
    );

    // Compare subscriptions collection
    console.log('\n' + '-'.repeat(80));
    compareObjects(data1.subscriptions, data2.subscriptions, 'subscriptions コレクション');

    // Compare events
    console.log('\n' + '-'.repeat(80));
    console.log(`\n🔍 events コレクションの比較:\n`);
    console.log(`  org_XOVcuVO7o6Op6idItDHsqiBgdBD3 (申込不可): ${data1.events.length} 件のアクティブなイベント`);
    console.log(`  org_LRLxHcD2I6QC0ztGNAxSSwwCAhl1 (申込可):   ${data2.events.length} 件のアクティブなイベント`);

    if (data1.events.length > 0) {
      console.log(`\n  📅 org_XOVcuVO7o6Op6idItDHsqiBgdBD3 のイベント:`);
      data1.events.forEach((event, index) => {
        console.log(`\n    ${index + 1}. ${event.title || '(タイトルなし)'} (ID: ${event.id})`);
        console.log(`       slots: ${JSON.stringify(event.slots, null, 2)}`);
      });
    }

    if (data2.events.length > 0) {
      console.log(`\n  📅 org_LRLxHcD2I6QC0ztGNAxSSwwCAhl1 のイベント:`);
      data2.events.forEach((event, index) => {
        console.log(`\n    ${index + 1}. ${event.title || '(タイトルなし)'} (ID: ${event.id})`);
        console.log(`       slots: ${JSON.stringify(event.slots, null, 2)}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 比較完了');
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

main();
