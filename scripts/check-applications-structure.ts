import { getAdminDb } from '../lib/firebase-admin';

async function checkApplicationsStructure() {
  const db = getAdminDb();

  try {
    console.log('🔍 申込データの構造を確認中...\n');

    const snapshot = await db.collection('applications')
      .where('status', '==', 'applied')
      .limit(10)
      .get();

    if (snapshot.empty) {
      console.log('❌ 有効な申込が見つかりません');
      return;
    }

    console.log(`✅ ${snapshot.size}件の申込を確認\n`);

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`申込 #${index + 1}:`);
      console.log(`  - ID: ${doc.id}`);
      console.log(`  - userId: ${data.userId || '(なし)'}`);
      console.log(`  - organizationId: ${data.organizationId || '❌ 未設定'}`);
      console.log(`  - status: ${data.status}`);
      console.log(`  - eventId: ${data.eventId || '(なし)'}`);
      console.log(`  - slotId: ${data.slotId || '(なし)'}`);
      console.log(`  - slotAt: ${data.slotAt?.toDate?.() || data.slotAt}`);
      console.log('');
    });

    // Count documents without organizationId
    const withoutOrgId = snapshot.docs.filter(doc => !doc.data().organizationId);
    if (withoutOrgId.length > 0) {
      console.log(`⚠️  警告: ${withoutOrgId.length}件の申込に organizationId が設定されていません`);
      console.log('これらの申込はキャンセルできない可能性があります。');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkApplicationsStructure()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
