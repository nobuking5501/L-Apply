const admin = require('firebase-admin');
const serviceAccount = require('./l-apply-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkReminders() {
  console.log('=== リマインダーデータの確認 ===\n');

  try {
    // 1. すべてのリマインダーを取得
    const remindersSnapshot = await db.collection('reminders').get();
    console.log(`📊 リマインダー総数: ${remindersSnapshot.size}件\n`);

    if (remindersSnapshot.empty) {
      console.log('❌ リマインダーがありません。');
      console.log('   申込を行ってリマインダーを作成してください。\n');
      return;
    }

    // 2. 今日の日付（JST）
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    console.log(`🕐 現在時刻（JST）: ${jstNow.toISOString().replace('T', ' ').substring(0, 19)}\n`);

    // 3. リマインダーの状態を確認
    let pending = 0;
    let sent = 0;
    let canceled = 0;
    let future = 0;

    const reminders = [];
    remindersSnapshot.forEach((doc) => {
      const data = doc.data();
      reminders.push({ id: doc.id, ...data });
    });

    // scheduledAtでソート
    reminders.sort((a, b) => {
      const aTime = a.scheduledAt?.toDate() || new Date(0);
      const bTime = b.scheduledAt?.toDate() || new Date(0);
      return aTime - bTime;
    });

    console.log('=== リマインダー一覧 ===\n');

    reminders.forEach((reminder) => {
      const scheduledAt = reminder.scheduledAt?.toDate();
      const sentAt = reminder.sentAt?.toDate();
      const scheduledJST = scheduledAt ? new Date(scheduledAt.getTime() + 9 * 60 * 60 * 1000) : null;
      const sentJST = sentAt ? new Date(sentAt.getTime() + 9 * 60 * 60 * 1000) : null;

      let status = '';
      let icon = '';

      if (reminder.canceled) {
        status = 'キャンセル済み';
        icon = '🚫';
        canceled++;
      } else if (sentAt) {
        status = '送信済み';
        icon = '✅';
        sent++;
      } else if (scheduledAt && scheduledAt <= now) {
        status = '送信待ち（過去）';
        icon = '⏰';
        pending++;
      } else {
        status = '送信予定';
        icon = '📅';
        future++;
      }

      console.log(`${icon} ${status}`);
      console.log(`   ID: ${reminder.id}`);
      console.log(`   Type: ${reminder.type}`);
      console.log(`   User: ${reminder.userId}`);
      console.log(`   送信予定時刻: ${scheduledJST ? scheduledJST.toISOString().replace('T', ' ').substring(0, 19) : 'なし'}`);
      if (sentJST) {
        console.log(`   送信済み時刻: ${sentJST.toISOString().replace('T', ' ').substring(0, 19)}`);
      }
      console.log(`   メッセージ: ${reminder.message.substring(0, 50)}...`);
      console.log('');
    });

    console.log('=== 統計 ===');
    console.log(`📊 総数: ${remindersSnapshot.size}件`);
    console.log(`⏰ 送信待ち（過去の時刻）: ${pending}件`);
    console.log(`✅ 送信済み: ${sent}件`);
    console.log(`🚫 キャンセル済み: ${canceled}件`);
    console.log(`📅 送信予定（未来）: ${future}件\n`);

    if (pending > 0) {
      console.log('💡 ヒント: 送信待ちのリマインダーがあります。');
      console.log('   remind関数は5分ごとに実行されます。次の実行を待ってください。\n');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }

  process.exit(0);
}

checkReminders();
