/**
 * 各組織のLIFF URLを確認するスクリプト
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Check if already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./l-apply-firebase-adminsdk-pz6op-4c3b07c96c.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkLiffUrls() {
  console.log('🔍 各組織のLIFF URLを確認中...\n');

  try {
    const orgsSnapshot = await db.collection('organizations').get();

    if (orgsSnapshot.empty) {
      console.log('❌ 組織が見つかりません');
      return;
    }

    console.log(`📊 ${orgsSnapshot.size} 件の組織が見つかりました\n`);
    console.log('=' .repeat(80));

    orgsSnapshot.forEach((doc) => {
      const data = doc.data();
      const orgId = doc.id;
      const liffId = data.liffId;
      const name = data.name || '(名前未設定)';

      console.log(`\n組織ID: ${orgId}`);
      console.log(`組織名: ${name}`);

      if (liffId) {
        const liffUrl = `https://liff.line.me/${liffId}`;
        console.log(`✅ LIFF ID: ${liffId}`);
        console.log(`✅ LIFF URL: ${liffUrl}`);
        console.log(`\n📋 リッチメニュー設定用:`);
        console.log(`   タイプ: リンク`);
        console.log(`   ラベル: セミナー申込`);
        console.log(`   URL: ${liffUrl}`);
      } else {
        console.log(`❌ LIFF ID が設定されていません`);
        console.log(`\n⚠️  修正方法:`);
        console.log(`   1. LINE Developers Console で LIFF アプリを作成`);
        console.log(`   2. LIFF ID を取得`);
        console.log(`   3. Firestore の organizations/${orgId} に liffId を追加`);
      }

      console.log('=' .repeat(80));
    });

    console.log('\n✅ 確認完了');
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    process.exit(0);
  }
}

checkLiffUrls();
