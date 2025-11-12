# 個別相談機能

## 実装内容

リッチメニューまたはトーク画面から「個別相談希望」と送信すると、自動返信メッセージを送信し、Firestoreに相談リクエストを保存します。

## 機能仕様

### トリガーとなるテキスト

以下のいずれかのテキストを受信すると、個別相談として処理されます：

- `個別相談希望`
- `個別相談`
- `相談希望`

### 自動返信メッセージ

```
個別相談のお申し込みありがとうございます！

日程調整をいたしますので少々お待ちください。

担当者より24時間以内にご連絡させていただきます。
```

### データ保存

相談リクエストは以下のデータ構造でFirestoreに保存されます：

**コレクション**: `consultation_requests`

**ドキュメント構造**:
```typescript
{
  userId: string;           // LINE ユーザーID
  organizationId: string;   // 組織ID
  status: 'pending';        // ステータス（現在は'pending'のみ）
  createdAt: Timestamp;     // 作成日時
  updatedAt: Timestamp;     // 更新日時
}
```

## リッチメニュー設定

### 4分割レイアウト

```
+-------------+-------------+-------------+-------------+
|             |             |             |             |
| セミナー    |   予約      | キャンセル  |   個別      |
|  申込       |   確認      |             |   相談      |
|             |             |             |             |
+-------------+-------------+-------------+-------------+
```

### 個別相談ボタンの設定

**LINE Developers Console で設定:**

```
タイプ: テキスト
ラベル: 個別相談
テキスト: 個別相談希望
```

## ファイル変更箇所

### 1. `functions/src/webhook-prod.ts`

個別相談のテキストを受信したときの処理を追加:

```typescript
} else if (text === '個別相談希望' || text === '個別相談' || text === '相談希望') {
  // Individual consultation request
  const config = getConfig();

  // Save consultation request to Firestore
  await firestore.createConsultationRequest(userId, config.app.organizationId);

  const message = '個別相談のお申し込みありがとうございます！\n\n日程調整をいたしますので少々お待ちください。\n\n担当者より24時間以内にご連絡させていただきます。';
  await replyMessage(replyToken, [createTextMessage(message)]);
}
```

### 2. `functions/src/utils/firestore.ts`

相談リクエストを保存する関数を追加:

```typescript
/**
 * Create consultation request
 */
export async function createConsultationRequest(
  userId: string,
  organizationId: string
): Promise<string> {
  const consultationRef = await getDb().collection('consultation_requests').add({
    userId,
    organizationId,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return consultationRef.id;
}
```

### 3. `firestore.rules`

`consultation_requests`コレクションのセキュリティルールを追加:

```javascript
// Consultation Requests - Cloud Functionsからアクセス
match /consultation_requests/{requestId} {
  allow read, write: if true;
}
```

## デプロイ状況

- ✅ **Firestoreセキュリティルール**: デプロイ済み
- ⏳ **Cloud Functions**: ビルド完了、手動デプロイ待ち

## Cloud Functionsのデプロイ方法

Firebase CLIのタイムアウト問題があるため、以下の方法でデプロイしてください：

### 方法1: Firebase Consoleから手動デプロイ（推奨）

1. [Firebase Console - Functions](https://console.firebase.google.com/project/l-apply/functions) を開く
2. `webhook`関数を選択
3. 「編集」または「ソースを表示」をクリック
4. 新しいコードをアップロード
5. デプロイ

### 方法2: コマンドライン（タイムアウトする可能性あり）

```bash
firebase deploy --only functions:webhook
```

## 動作確認

### 1. リッチメニューから確認

1. LINEアプリでBotを開く
2. 「個別相談」ボタンをタップ
3. 自動返信メッセージが表示されることを確認

### 2. テキスト入力から確認

1. トーク画面で「個別相談希望」と入力して送信
2. 同じ自動返信メッセージが表示されることを確認

### 3. Firestoreでデータ確認

1. [Firebase Console - Firestore](https://console.firebase.google.com/project/l-apply/firestore) を開く
2. `consultation_requests`コレクションを確認
3. 新しいドキュメントが作成されていることを確認

### 4. ログ確認

```bash
firebase functions:log --only webhook
```

## 今後の拡張案

### 1. ダッシュボードでの相談リクエスト管理

`app/dashboard/consultations/page.tsx`を作成して、以下の機能を実装:

- [ ] 相談リクエスト一覧表示
- [ ] ステータス管理（pending, in-progress, completed, cancelled）
- [ ] 担当者アサイン機能
- [ ] LINE通知機能（担当者への通知）
- [ ] メモ機能（対応内容の記録）

### 2. 自動日程調整

- [ ] Googleカレンダー連携
- [ ] 自動で空き時間を提示
- [ ] ユーザーが日時を選択できるLIFFアプリ

### 3. リマインダー機能

- [ ] 相談予定日の前日にリマインダー送信
- [ ] 担当者への通知

### 4. 統計・分析

- [ ] 相談リクエスト数の推移
- [ ] 対応時間の分析
- [ ] 成約率の追跡

## トラブルシューティング

### メッセージが返信されない

**原因**: Cloud Functionsがデプロイされていない

**解決方法**:
1. Cloud Functionsをデプロイ
2. Webhook URLが正しく設定されているか確認

### Firestoreにデータが保存されない

**原因**: セキュリティルールが適用されていない

**解決方法**:
```bash
firebase deploy --only firestore:rules
```

### 「不明なコマンド」と返信される

**原因**: 古いバージョンのCloud Functionsがデプロイされている

**解決方法**: 最新のコードをデプロイ

## まとめ

個別相談機能は以下の流れで動作します：

1. ユーザーが「個別相談希望」をリッチメニューまたはテキストで送信
2. Webhookが受信
3. Firestoreに相談リクエストを保存
4. ユーザーに自動返信メッセージを送信
5. （今後）ダッシュボードで管理者が確認・対応

現在は基本的な機能のみ実装されていますが、今後の拡張により、より便利な相談管理システムに発展できます。
