import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with Application Default Credentials
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

async function deleteUnwantedAutoReply() {
  try {
    console.log('🔍 不要な自動返信メッセージを検索中...\n');

    // Search for the specific message
    const snapshot = await db.collection('auto_reply_messages').get();

    if (snapshot.empty) {
      console.log('自動返信メッセージが見つかりません');
      return;
    }

    console.log(`合計 ${snapshot.size} 件の自動返信が見つかりました\n`);

    const targetMessage = 'メッセージありがとうございます！';
    let found = false;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Check if this is the unwanted message
      if (data.message && data.message.includes(targetMessage)) {
        console.log('❌ 削除対象を発見:');
        console.log(`   ID: ${doc.id}`);
        console.log(`   組織ID: ${data.organizationId || 'なし'}`);
        console.log(`   トリガー: ${data.trigger}`);
        console.log(`   メッセージ:\n${data.message}`);
        console.log('');

        // Delete the document
        await db.collection('auto_reply_messages').doc(doc.id).delete();
        console.log('✅ 削除しました\n');
        found = true;
      }
    }

    if (!found) {
      console.log('⚠️  該当するメッセージが見つかりませんでした');
      console.log('');
      console.log('登録されている自動返信一覧:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - トリガー: ${data.trigger}`);
        console.log(`    メッセージ: ${data.message?.substring(0, 50)}...`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

deleteUnwantedAutoReply()
  .then(() => {
    console.log('✅ 完了');
    process.exit(0);
  })
  .catch(error => {
    console.error('エラー:', error);
    process.exit(1);
  });
