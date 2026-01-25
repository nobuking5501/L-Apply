import { getAdminDb } from '../lib/firebase-admin';

async function findAutoReply() {
  const db = getAdminDb();

  const snapshot = await db.collection('auto_reply_messages')
    .where('isActive', '==', true)
    .get();

  if (snapshot.empty) {
    console.log('自動返信メッセージが見つかりません');
    return;
  }

  console.log(`見つかった自動返信メッセージ: ${snapshot.size}件\n`);

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`組織ID: ${data.organizationId || 'なし'}`);
    console.log(`トリガー: ${data.trigger}`);
    console.log(`メッセージ:\n${data.message}`);
    console.log(`有効: ${data.isActive}`);
    console.log('---\n');
  });
}

findAutoReply()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('エラー:', error);
    process.exit(1);
  });
