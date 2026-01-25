import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  // For local development, use Application Default Credentials
  try {
    initializeApp();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

const db = getFirestore();

async function checkLineSetup() {
  try {
    // Get all organizations
    const orgsSnapshot = await db.collection('organizations').get();

    console.log('\n=== 組織のLINE連携状態 ===\n');

    if (orgsSnapshot.empty) {
      console.log('組織が見つかりません');
      return;
    }

    for (const doc of orgsSnapshot.docs) {
      const orgData = doc.data();
      console.log(`組織ID: ${doc.id}`);
      console.log(`組織名: ${orgData.name || '未設定'}`);
      console.log(`lineChannelId: ${orgData.lineChannelId ? '✅ 設定済み' : '❌ 未設定'}`);
      console.log(`liffId: ${orgData.liffId ? '✅ 設定済み' : '❌ 未設定'}`);

      const hasLineSetup = !!(orgData.lineChannelId && orgData.liffId);
      console.log(`\nLINE連携状態: ${hasLineSetup ? '✅ 完了' : '❌ 未完了'}`);

      if (hasLineSetup) {
        console.log('⚠️  警告: LINE連携が既に設定されているため、オーバーレイは表示されません');
      } else {
        console.log('✅ 警告: LINE連携が未設定のため、オーバーレイが表示されるはずです');
      }

      console.log('\n実際のデータ:');
      console.log('lineChannelId:', orgData.lineChannelId);
      console.log('liffId:', orgData.liffId);
      console.log('\n' + '='.repeat(50) + '\n');
    }
  } catch (error) {
    console.error('Error checking LINE setup:', error);
  }
}

checkLineSetup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
