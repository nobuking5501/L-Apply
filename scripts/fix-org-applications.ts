import { getAdminDb } from '../lib/firebase-admin';

async function fixOrgApplications() {
  const db = getAdminDb();
  const orgId = 'org_XOVcuVO7o6Op6idItDHsqiBgdBD3';

  try {
    console.log(`🔧 組織 ${orgId} の申込データを修正中...\n`);

    // 組織情報を取得
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      console.log('❌ 組織が見つかりません');
      return;
    }

    console.log('✅ 組織が見つかりました\n');

    // この組織に紐づくユーザーを取得
    const usersSnapshot = await db.collection('users')
      .where('organizationId', '==', orgId)
      .get();

    console.log(`👥 ユーザー数: ${usersSnapshot.size}件\n`);

    if (usersSnapshot.empty) {
      console.log('ℹ️  この組織にユーザーがいません');
      return;
    }

    const userIds = usersSnapshot.docs.map(doc => doc.id);
    console.log('ユーザーID:');
    userIds.forEach((userId, index) => {
      const userData = usersSnapshot.docs[index].data();
      console.log(`  ${index + 1}. ${userId} (${userData.displayName || '名前なし'})`);
    });
    console.log('');

    let fixedCount = 0;
    let alreadyFixedCount = 0;

    // 各ユーザーの申込をチェックして修正
    for (const userId of userIds) {
      const applicationsSnapshot = await db.collection('applications')
        .where('userId', '==', userId)
        .get();

      if (applicationsSnapshot.empty) {
        continue;
      }

      for (const doc of applicationsSnapshot.docs) {
        const data = doc.data();

        if (!data.organizationId) {
          console.log(`🔧 修正中: 申込 ${doc.id}`);
          console.log(`   userId: ${userId}`);
          console.log(`   status: ${data.status}`);
          console.log(`   slotAt: ${data.slotAt?.toDate?.()}`);

          // organizationIdを設定
          await db.collection('applications').doc(doc.id).update({
            organizationId: orgId,
          });

          fixedCount++;
          console.log(`   ✅ organizationIdを設定しました\n`);
        } else {
          alreadyFixedCount++;
        }
      }
    }

    console.log('\n📊 修正結果:');
    console.log(`   - 修正した申込: ${fixedCount}件`);
    console.log(`   - 既に設定済み: ${alreadyFixedCount}件`);
    console.log(`   - 合計: ${fixedCount + alreadyFixedCount}件`);

    if (fixedCount > 0) {
      console.log('\n✅ 修正が完了しました。これでキャンセル機能が正常に動作するはずです。');
    } else {
      console.log('\nℹ️  修正が必要な申込はありませんでした。');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

fixOrgApplications()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
