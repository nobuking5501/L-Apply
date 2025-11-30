const admin = require('firebase-admin');
const serviceAccount = require('./l-apply-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkStepDeliveries() {
  console.log('=== ステップ配信データの確認 ===\n');

  try {
    // 1. すべてのステップ配信を取得
    const deliveriesSnapshot = await db.collection('step_deliveries').get();
    console.log(`📊 ステップ配信総数: ${deliveriesSnapshot.size}件\n`);

    if (deliveriesSnapshot.empty) {
      console.log('❌ ステップ配信がありません。');
      console.log('   申込を行ってステップ配信を作成してください。\n');
      return;
    }

    // 2. 今日の日付（JST）
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    console.log(`🕐 現在時刻（JST）: ${jstNow.toISOString().replace('T', ' ').substring(0, 19)}\n`);

    // 3. ステップ配信の状態を確認
    let pending = 0;
    let sent = 0;
    let skipped = 0;
    let future = 0;

    const deliveries = [];
    deliveriesSnapshot.forEach((doc) => {
      const data = doc.data();
      deliveries.push({ id: doc.id, ...data });
    });

    // scheduledAtでソート
    deliveries.sort((a, b) => {
      const aTime = a.scheduledAt?.toDate() || new Date(0);
      const bTime = b.scheduledAt?.toDate() || new Date(0);
      return aTime - bTime;
    });

    console.log('=== ステップ配信一覧 ===\n');

    deliveries.forEach((delivery) => {
      const scheduledAt = delivery.scheduledAt?.toDate();
      const sentAt = delivery.sentAt?.toDate();
      const scheduledJST = scheduledAt ? new Date(scheduledAt.getTime() + 9 * 60 * 60 * 1000) : null;
      const sentJST = sentAt ? new Date(sentAt.getTime() + 9 * 60 * 60 * 1000) : null;

      let status = '';
      let icon = '';

      if (delivery.status === 'skipped') {
        status = 'スキップ済み';
        icon = '⏭️';
        skipped++;
      } else if (delivery.status === 'sent') {
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
      console.log(`   ID: ${delivery.id}`);
      console.log(`   Step: ${delivery.stepNumber}`);
      console.log(`   User: ${delivery.userId}`);
      console.log(`   送信予定時刻: ${scheduledJST ? scheduledJST.toISOString().replace('T', ' ').substring(0, 19) : 'なし'}`);
      if (sentJST) {
        console.log(`   送信済み時刻: ${sentJST.toISOString().replace('T', ' ').substring(0, 19)}`);
      }
      console.log(`   メッセージ: ${delivery.message.substring(0, 50)}...`);
      console.log('');
    });

    console.log('=== 統計 ===');
    console.log(`📊 総数: ${deliveriesSnapshot.size}件`);
    console.log(`⏰ 送信待ち（過去の時刻）: ${pending}件`);
    console.log(`✅ 送信済み: ${sent}件`);
    console.log(`⏭️  スキップ済み: ${skipped}件`);
    console.log(`📅 送信予定（未来）: ${future}件\n`);

    if (pending > 0) {
      console.log('💡 ヒント: 送信待ちのステップ配信があります。');
      console.log('   deliverSteps関数は5分ごとに実行されます。次の実行を待ってください。\n');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }

  process.exit(0);
}

checkStepDeliveries();
