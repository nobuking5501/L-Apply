import { getAdminDb } from '../lib/firebase-admin';

async function checkOrganization() {
  const db = getAdminDb();
  const orgId = 'org_n6iKxvKk55MgP3YhaD2rRrDM1bj1';

  try {
    console.log('🔍 組織情報を確認中...\n');

    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      console.log('❌ 組織が見つかりません');
      return;
    }

    const data = orgDoc.data();
    if (!data) {
      console.log('❌ 組織データが空です');
      return;
    }

    console.log('✅ 組織情報:');
    console.log('  - 組織ID:', orgId);
    console.log('  - 名前:', data.name || '(未設定)');
    console.log('  - Email:', data.email || '(未設定)');
    console.log('  - LIFF ID:', data.liffId || '(未設定)');
    console.log('  - LINE Channel ID:', data.lineChannelId || '(未設定)');
    console.log('  - プラン:', data.subscription?.plan || 'test');
    console.log('  - ステータス:', data.subscription?.status || 'trial');
    console.log('  - 無効化:', data.disabled ? 'はい' : 'いいえ');
    console.log('');

    // Check secrets in new location
    const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();
    if (secretsDoc.exists) {
      const secrets = secretsDoc.data();
      console.log('🔐 認証情報（新しい場所: organization_secrets）:');
      console.log('  - Channel Secret:', secrets?.lineChannelSecret ? '✅ 設定済み' : '❌ 未設定');
      console.log('  - Access Token:', secrets?.lineChannelAccessToken ? '✅ 設定済み' : '❌ 未設定');
      console.log('');
    } else {
      console.log('⚠️  organization_secrets にデータがありません');
      console.log('');
    }

    // Check secrets in old location
    console.log('🔐 認証情報（旧い場所: organizations）:');
    console.log('  - Channel Secret:', data.lineChannelSecret ? '✅ 設定済み' : '❌ 未設定');
    console.log('  - Access Token:', data.lineChannelAccessToken ? '✅ 設定済み' : '❌ 未設定');
    console.log('');

    // Check if LIFF ID is configured
    if (data.liffId) {
      console.log('📱 LIFF URL:');
      console.log('  https://l-apply.vercel.app/liff/apply?liffId=' + data.liffId);
      console.log('');
    }

    // Check active events
    const eventsSnapshot = await db
      .collection('events')
      .where('organizationId', '==', orgId)
      .where('isActive', '==', true)
      .get();

    console.log('📅 アクティブなイベント数:', eventsSnapshot.size);

    if (eventsSnapshot.size > 0) {
      console.log('');
      eventsSnapshot.forEach((doc) => {
        const event = doc.data();
        console.log('  - ' + event.title + ' (ID: ' + doc.id + ')');
      });
    }

    console.log('');
    console.log('✅ 確認完了');
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkOrganization()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
