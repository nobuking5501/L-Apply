# ステップ配信機能 - 完全ガイド

## 📋 概要

ステップ配信機能は、セミナー参加者に対して**セミナー終了後**に自動的にフォローアップメッセージを送信する機能です。

---

## ✅ 修正内容

### **問題**:
- `functions/src/index.ts` で `remind` と `deliverSteps` 関数がコメントアウトされていた
- そのため、ステップ配信機能とリマインダー機能がデプロイされていなかった

### **修正**:
- `remind` と `deliverSteps` 関数のコメントアウトを解除
- これらの関数をデプロイに含めるように変更

---

## 🚀 機能の仕組み

### **1. 申込時の処理**

ユーザーがLIFFアプリからセミナーに申し込むと：

1. **申込データを保存** (`applications` コレクション)
2. **リマインダーを作成** (`reminders` コレクション)
   - T-24h リマインダー（セミナー24時間前）
   - Day-of リマインダー（セミナー当日朝8時）
3. **ステップ配信スケジュールを作成** (`step_deliveries` コレクション)
   - Step 1: セミナー開催日時の**翌日**
   - Step 2: セミナー開催日時の**3日後**
   - Step 3: セミナー開催日時の**7日後**

### **2. スケジュール実行**

#### **リマインダー配信** (`remind` 関数)
- **実行頻度**: 5分ごと
- **処理内容**:
  - `reminders` コレクションから送信予定のリマインダーを取得
  - ユーザーの配信同意（`consent`）を確認
  - 同意がある場合のみLINEメッセージを送信
  - 送信後、`sentAt` を更新

#### **ステップ配信** (`deliverSteps` 関数)
- **実行頻度**: 5分ごと
- **処理内容**:
  - `step_deliveries` コレクションから送信予定のステップを取得
  - ユーザーの配信同意（`consent`）を確認
  - 同意がある場合のみLINEメッセージを送信
  - 送信後、`status` を `sent` に更新

---

## 📅 配信タイミング

### **例: 2025年12月1日 14:00 のセミナーに申し込んだ場合**

| タイミング | 配信内容 | 実行関数 |
|----------|---------|---------|
| 2025/11/30 14:00 | T-24h リマインダー | `remind` |
| 2025/12/01 08:00 | Day-of リマインダー | `remind` |
| **2025/12/02 14:00** | **Step 1: イベント参加のお礼** | `deliverSteps` |
| **2025/12/04 14:00** | **Step 2: 個別相談のご案内** | `deliverSteps` |
| **2025/12/08 14:00** | **Step 3: ラストチャンス案内** | `deliverSteps` |

---

## 📝 ステップメッセージの内容

### **Step 1 (翌日)**
```
イベントへのご参加ありがとうございました！🎉

いかがでしたか？
AI×コピペでアプリ開発の可能性を感じていただけましたでしょうか。

【個別相談のご案内】
もっと詳しく知りたい方向けに、無料の個別相談を実施しています💡

✨ 個別相談でできること
・あなたのアイデアを具体化
・最適な開発手順をご提案
・疑問点を直接解消

ご希望の方は「個別相談希望」と返信してください📩
```

### **Step 2 (3日後)**
```
こんにちは！
イベントから少し時間が経ちましたが、アプリ開発は進んでいますか？😊

【無料個別相談、まだ受付中です】

「何から始めればいいかわからない...」
「自分のアイデアは実現できる？」
「もっと詳しく聞きたい！」

そんなお悩みを個別相談で解決しませんか？

📅 所要時間：30分程度
💰 料金：完全無料
💻 形式：オンライン（Zoom）

ご希望の方は「個別相談希望」と返信してください！
```

### **Step 3 (7日後)**
```
イベントからもうすぐ1週間ですね📆

【個別相談ラストチャンス！】

この機会を逃すと、次回のご案内は未定です。

実際に多くの方が個別相談を経て、
自分のアイデアをアプリとして形にしています✨

「ちょっと話を聞いてみたい」
だけでも大歓迎です！

今ならまだ枠が空いています。
「個別相談希望」と返信してお気軽にお申し込みください。

※この案内が最後となります
```

---

## 🔧 カスタマイズ方法

### **ステップメッセージを変更する**

`functions/src/config/step-messages.ts` を編集：

```typescript
export const STEP_MESSAGES: StepMessageConfig[] = [
  {
    step: 1,
    delayDays: 1, // セミナー日時から何日後に送信するか
    message: `ここにメッセージ内容を記載`,
  },
  // 追加のステップを作成する場合はここに追加
];
```

### **配信頻度を変更する**

`functions/src/remind-prod.ts` と `functions/src/deliver-steps-prod.ts`:

```typescript
export const remind = onSchedule(
  {
    schedule: 'every 5 minutes', // ここを変更（例: 'every 10 minutes', 'every 1 hours'）
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
  },
  // ...
);
```

---

## 🐛 トラブルシューティング

### **ステップメッセージが届かない場合**

#### **1. Cloud Functions がデプロイされているか確認**

Firebase Console → Functions セクションで以下を確認：
- ✅ `remind`
- ✅ `deliverSteps`
- ✅ `apply`
- ✅ `webhook`

#### **2. Firestore のデータを確認**

Firebase Console → Firestore Database で以下をチェック：

**`step_deliveries` コレクション**:
- `status`: `pending` （送信待ち）
- `scheduledAt`: 送信予定日時
- `userId`: 対象ユーザー
- `message`: 送信するメッセージ

**`line_users` コレクション**:
- `consent`: `true` （配信同意がある）

#### **3. ユーザーが配信停止していないか確認**

ユーザーが「配信停止」コマンドを送信すると `consent` が `false` になります。

#### **4. Cloud Scheduler のログを確認**

Firebase Console → Functions → `deliverSteps` → ログタブ:
```
Step delivery function triggered at: 2025-11-30T...
Found X pending step deliveries
Successfully sent step delivery...
```

---

## 📊 動作確認方法

### **1. テストデータを作成**

Firebase Console → Firestore → `step_deliveries` コレクションに手動でドキュメントを追加：

```json
{
  "applicationId": "test_app_123",
  "userId": "U1234567890abcdef",
  "stepNumber": 1,
  "scheduledAt": "2025-11-30T05:00:00Z", // 現在時刻より前
  "sentAt": null,
  "status": "pending",
  "message": "テストメッセージ",
  "organizationId": "your_org_id",
  "createdAt": "2025-11-30T04:00:00Z"
}
```

### **2. 5分待つ**

`deliverSteps` 関数が5分ごとに実行されるのを待つ

### **3. LINEでメッセージを確認**

指定した `userId` のLINEアカウントにメッセージが届くはず

### **4. Firestoreを確認**

`step_deliveries` コレクションのドキュメントが更新されているか確認：
- `status`: `sent`
- `sentAt`: 送信日時

---

## 🔒 セキュリティと制限

### **配信同意の確認**

- ユーザーが「配信停止」コマンドを送信すると、すべての配信がストップ
- `line_users` コレクションの `consent` フィールドで管理

### **サブスクリプション制限**

- プランによって作成できるステップ配信数に上限あり
- 上限に達すると、新しいステップ配信は作成されない
- 詳細は `lib/stripe-config.ts` の `limits.maxStepDeliveries` を参照

---

## 📞 サポート

問題が解決しない場合：

1. Firebase Console のログを確認
2. GitHub Actions のデプロイログを確認
3. Firestore のデータ構造を確認

---

**最終更新**: 2025-11-30
**作成者**: Claude Code
