import { getAdminDb } from '../lib/firebase-admin';

async function checkOrgApplications() {
  const db = getAdminDb();
  const orgId = 'org_XOVcuVO7o6Op6idItDHsqiBgdBD3';

  try {
    console.log(`🔍 組織 ${orgId} の状況を確認中...\n`);

    // 組織情報を取得
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      console.log('❌ 組織が見つかりません');
      return;
    }

    const orgData = orgDoc.data();
    console.log('📋 組織情報:');
    console.log(`  - ID: ${orgDoc.id}`);
    console.log(`  - 名前: ${orgData?.name || '(なし)'}`);
    console.log(`  - メール: ${orgData?.email || '(なし)'}`);
    console.log(`  - プラン: ${orgData?.subscription?.plan || '(なし)'}`);
    console.log(`  - ステータス: ${orgData?.subscription?.status || '(なし)'}`);
    console.log(`  - LIFF ID: ${orgData?.liffId || '(なし)'}`);
    console.log('');

    // この組織に紐づくユーザーを確認
    const usersSnapshot = await db.collection('users')
      .where('organizationId', '==', orgId)
      .get();

    console.log(`👥 ユーザー数: ${usersSnapshot.size}件\n`);

    if (!usersSnapshot.empty) {
      // ユーザーIDのリストを取得
      const userIds = usersSnapshot.docs.map(doc => doc.id);
      console.log('ユーザーID一覧:');
      userIds.forEach((userId, index) => {
        const userData = usersSnapshot.docs[index].data();
        console.log(`  ${index + 1}. ${userId} (${userData.displayName || '名前なし'})`);
      });
      console.log('');

      // 各ユーザーの申込を確認
      for (const userId of userIds) {
        const applicationsSnapshot = await db.collection('applications')
          .where('userId', '==', userId)
          .where('status', '==', 'applied')
          .get();

        if (!applicationsSnapshot.empty) {
          console.log(`📝 ユーザー ${userId} の有効な申込:`);
          applicationsSnapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`  申込 #${index + 1}:`);
            console.log(`    - 申込ID: ${doc.id}`);
            console.log(`    - organizationId: ${data.organizationId || '❌ 未設定'}`);
            console.log(`    - status: ${data.status}`);
            console.log(`    - slotAt: ${data.slotAt?.toDate?.() || data.slotAt}`);
            console.log(`    - createdAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
          });
          console.log('');
        }
      }
    }

    // organizationIdが設定されていない申込を探す
    const applicationsWithoutOrgId = await db.collection('applications')
      .where('status', '==', 'applied')
      .get();

    const problematicApps = applicationsWithoutOrgId.docs.filter(doc => {
      const data = doc.data();
      return !data.organizationId && usersSnapshot.docs.some(userDoc => userDoc.id === data.userId);
    });

    if (problematicApps.length > 0) {
      console.log('⚠️  警告: organizationIdが設定されていない申込が見つかりました:');
      problematicApps.forEach((doc) => {
        const data = doc.data();
        console.log(`  - 申込ID: ${doc.id}`);
        console.log(`    userId: ${data.userId}`);
        console.log(`    status: ${data.status}`);
        console.log(`    slotAt: ${data.slotAt?.toDate?.()}`);
      });
      console.log('\nこれらの申込はキャンセルできない可能性があります。');
    } else {
      console.log('✅ 全ての申込にorganizationIdが設定されています');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkOrgApplications()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
