/**
 * 読み取り専用スクリプト：組織のデータを確認
 * このスクリプトはデータの読み取りのみを行い、書き込みは一切行いません
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Firebase Admin の初期化
if (getApps().length === 0) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

const db = getFirestore();

async function debugOrganization(orgId: string) {
  console.log('🔍 組織データの詳細確認\n');
  console.log('=' .repeat(60));
  console.log('組織ID:', orgId);
  console.log('=' .repeat(60));
  console.log('');

  try {
    // 1. 組織の基本情報を取得
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      console.log('❌ この組織は存在しません');
      console.log('');
      console.log('💡 確認事項:');
      console.log('   - 組織IDが正しいか確認してください');
      console.log('   - ダッシュボードで組織が作成されているか確認してください');
      return;
    }

    const orgData = orgDoc.data()!;

    console.log('✅ 組織情報');
    console.log('-'.repeat(60));
    console.log('  名前:', orgData.name || '(未設定)');
    console.log('  Email:', orgData.email || '(未設定)');
    console.log('  会社名:', orgData.companyName || '(未設定)');
    console.log('  LIFF ID:', orgData.liffId || '❌ 未設定');
    console.log('  LIFF ID (trimmed):', (orgData.liffId || '').trim() || '❌ 未設定');
    console.log('  LIFF ID (length):', (orgData.liffId || '').length, '文字');
    console.log('  LINE Channel ID:', orgData.lineChannelId || '(未設定)');
    console.log('  無効化:', orgData.disabled ? '❌ YES（無効化されています！）' : '✅ NO');
    console.log('  プラン:', orgData.subscription?.plan || 'test');
    console.log('  ステータス:', orgData.subscription?.status || 'trial');
    console.log('  作成日:', orgData.createdAt?.toDate?.()?.toLocaleString('ja-JP') || '(不明)');
    console.log('');

    // LIFF IDのバリデーション
    if (!orgData.liffId || orgData.liffId.trim() === '') {
      console.log('⚠️  警告: LIFF IDが設定されていません！');
      console.log('   → 設定ページで LIFF ID を保存してください');
      console.log('');
    }

    // 組織が無効化されているか確認
    if (orgData.disabled === true) {
      console.log('⚠️  警告: この組織は無効化されています！');
      console.log('   → 管理者に連絡して、有効化してもらってください');
      console.log('');
    }

    // 2. 認証情報の確認
    console.log('🔐 認証情報');
    console.log('-'.repeat(60));

    // 新しい場所 (organization_secrets) を確認
    const secretsDoc = await db.collection('organization_secrets').doc(orgId).get();
    if (secretsDoc.exists) {
      const secrets = secretsDoc.data()!;
      console.log('  📁 新しい場所 (organization_secrets):');
      console.log('     Channel Secret:', secrets.lineChannelSecret ? '✅ 設定済み' : '❌ 未設定');
      console.log('     Access Token:', secrets.lineChannelAccessToken ? '✅ 設定済み' : '❌ 未設定');
      console.log('     更新日:', secrets.updatedAt?.toDate?.()?.toLocaleString('ja-JP') || '(不明)');
    } else {
      console.log('  📁 新しい場所 (organization_secrets): ❌ データなし');
    }

    // 古い場所 (organizations) を確認
    console.log('  📁 古い場所 (organizations):');
    console.log('     Channel Secret:', orgData.lineChannelSecret ? '✅ 設定済み' : '❌ 未設定');
    console.log('     Access Token:', orgData.lineChannelAccessToken ? '✅ 設定済み' : '❌ 未設定');
    console.log('');

    // 認証情報のバリデーション
    const hasSecretsInNewLocation = secretsDoc.exists &&
      secretsDoc.data()?.lineChannelSecret &&
      secretsDoc.data()?.lineChannelAccessToken;
    const hasSecretsInOldLocation = orgData.lineChannelSecret && orgData.lineChannelAccessToken;

    if (!hasSecretsInNewLocation && !hasSecretsInOldLocation) {
      console.log('⚠️  警告: LINE認証情報が設定されていません！');
      console.log('   → 設定ページで以下を保存してください:');
      console.log('     - LINE Channel Secret');
      console.log('     - LINE Channel Access Token');
      console.log('');
    }

    // 3. イベント情報を取得
    console.log('📅 イベント情報');
    console.log('-'.repeat(60));

    const eventsSnapshot = await db
      .collection('events')
      .where('organizationId', '==', orgId)
      .get();

    if (eventsSnapshot.empty) {
      console.log('  ❌ イベントが1件も作成されていません');
      console.log('');
      console.log('  💡 対処方法:');
      console.log('     1. ダッシュボードにログイン');
      console.log('     2. 「イベント管理」ページを開く');
      console.log('     3. 「新しいイベント」をクリック');
      console.log('     4. イベント情報を入力して作成');
      console.log('');
    } else {
      console.log('  イベント総数:', eventsSnapshot.size, '件');
      console.log('');

      let activeCount = 0;
      let inactiveCount = 0;

      eventsSnapshot.forEach((doc) => {
        const event = doc.data();
        const isActive = event.isActive === true;

        if (isActive) {
          activeCount++;
        } else {
          inactiveCount++;
        }

        console.log('  📌 イベント:', event.title);
        console.log('     ID:', doc.id);
        console.log('     状態:', isActive ? '✅ 公開中（Active）' : '❌ 非公開（Inactive）');
        console.log('     開催場所:', event.location || '(未設定)');
        console.log('     スロット数:', (event.slots || []).length, '件');

        if (event.slots && event.slots.length > 0) {
          console.log('     日時:');
          event.slots.forEach((slot: any) => {
            const capacity = slot.currentCapacity || 0;
            const max = slot.maxCapacity || 0;
            console.log(`       - ${slot.date} ${slot.time} (${capacity}/${max}人)`);
          });
        }

        console.log('');
      });

      console.log('  集計:');
      console.log('    ✅ 公開中:', activeCount, '件');
      console.log('    ❌ 非公開:', inactiveCount, '件');
      console.log('');

      // アクティブなイベントがない場合の警告
      if (activeCount === 0) {
        console.log('⚠️  警告: 公開中のイベントがありません！');
        console.log('');
        console.log('  💡 対処方法:');
        console.log('     1. ダッシュボードの「イベント管理」ページを開く');
        console.log('     2. イベントの「公開」ボタンをクリック');
        console.log('     3. 確認ダイアログで「はい」をクリック');
        console.log('');
        console.log('  ⚠️  イベントが公開されていないと、LIFFアプリでエラーになります');
        console.log('');
      }
    }

    // 4. LIFF URL の生成
    if (orgData.liffId && orgData.liffId.trim() !== '') {
      console.log('📱 LIFF URL');
      console.log('-'.repeat(60));
      console.log('  https://l-apply.vercel.app/liff/apply?liffId=' + orgData.liffId.trim());
      console.log('');
      console.log('  💡 LINE Developers Console で設定してください:');
      console.log('     1. LINE Developers Console にログイン');
      console.log('     2. LIFF → 該当のLIFFアプリを選択');
      console.log('     3. 「編集」をクリック');
      console.log('     4. Endpoint URL に上記URLを設定');
      console.log('     5. 「更新」をクリック');
      console.log('');
    }

    // 5. 問題の診断
    console.log('🔬 診断結果');
    console.log('='.repeat(60));

    const issues: string[] = [];

    // LIFF ID チェック
    if (!orgData.liffId || orgData.liffId.trim() === '') {
      issues.push('❌ LIFF IDが設定されていません');
    } else {
      console.log('✅ LIFF ID: 設定済み');
    }

    // 認証情報チェック
    if (!hasSecretsInNewLocation && !hasSecretsInOldLocation) {
      issues.push('❌ LINE認証情報が設定されていません');
    } else {
      console.log('✅ LINE認証情報: 設定済み');
    }

    // イベントチェック
    if (eventsSnapshot.empty) {
      issues.push('❌ イベントが作成されていません');
    } else {
      const activeEvents = eventsSnapshot.docs.filter(doc => doc.data().isActive === true);
      if (activeEvents.length === 0) {
        issues.push('❌ 公開中のイベントがありません（イベントは作成されていますが、公開されていません）');
      } else {
        console.log('✅ 公開中のイベント: ' + activeEvents.length + '件');
      }
    }

    // 無効化チェック
    if (orgData.disabled === true) {
      issues.push('❌ 組織が無効化されています');
    } else {
      console.log('✅ 組織の状態: 有効');
    }

    console.log('');

    if (issues.length > 0) {
      console.log('⚠️  問題が見つかりました:');
      console.log('');
      issues.forEach(issue => {
        console.log('  ' + issue);
      });
      console.log('');
      console.log('💡 これらの問題を解決すると、LIFFアプリが正常に動作します');
    } else {
      console.log('✅ 全ての設定が正常です');
      console.log('');
      console.log('💡 LIFFアプリが動作しない場合:');
      console.log('   1. ブラウザのキャッシュをクリア');
      console.log('   2. LINEアプリを再起動');
      console.log('   3. LIFFアプリを開き直す');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ 診断完了');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('   メッセージ:', error.message);
      console.error('   スタック:', error.stack);
    }
  }
}

// コマンドライン引数から組織IDを取得
const orgId = process.argv[2] || 'org_n6iKxvKk55MgP3YhaD2rRrDM1bj1';

debugOrganization(orgId)
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
