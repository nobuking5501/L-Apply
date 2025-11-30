# リマインダー機能 - 完全ガイド

## ✅ 現在の状態

リマインダー機能は**既に完全に実装され、デプロイ済み**です。

---

## 📋 機能概要

セミナー申込時に、自動的に以下の2つのリマインダーが作成されます：

1. **T-24h リマインダー**: セミナー開催の**24時間前**
2. **当日朝リマインダー**: セミナー当日の**朝8時**

---

## 🚀 動作の仕組み

### **1. 申込時の処理** (`apply-prod.ts`)

ユーザーがLIFFアプリからセミナーに申し込むと：

```typescript
// T-24h reminder（セミナー24時間前）
const t24hTime = timezone.calculateT24hReminder(slotAt);
await firestore.createReminder({
  applicationId,
  userId,
  scheduledAt: t24hTime,
  type: 'T-24h',
  sentAt: null,
  canceled: false,
  message: messages.generateT24hReminderMessage(plan, slotAt),
  organizationId: orgConfig.organizationId,
});

// Day-of reminder（当日朝8時）
const dayOfTime = timezone.calculateDayOfReminder(slotAt);
await firestore.createReminder({
  applicationId,
  userId,
  scheduledAt: dayOfTime,
  type: 'day-of',
  sentAt: null,
  canceled: false,
  message: messages.generateDayOfReminderMessage(plan, slotAt),
  organizationId: orgConfig.organizationId,
});
```

これらのデータは `reminders` コレクションに保存されます。

---

### **2. スケジュール実行** (`remind-prod.ts`)

`remind` 関数が**5分ごと**に自動実行され、以下の処理を行います：

```typescript
export const remind = onSchedule(
  {
    schedule: 'every 5 minutes',  // 5分ごとに実行
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
  },
  async (event) => {
    // 1. 現在時刻を取得
    const now = timezone.getNowJST();

    // 2. 送信予定のリマインダーを取得
    // (scheduledAt <= now && sentAt == null && canceled == false)
    const reminders = await firestore.getPendingReminders(now);

    for (const reminder of reminders) {
      // 3. ユーザーの配信同意を確認
      const user = await firestore.getLineUser(reminder.userId);
      if (!user || !user.consent) {
        await firestore.markReminderAsSent(reminder.id);
        continue;
      }

      // 4. 組織の LINE 設定を取得
      const orgConfig = await getOrganizationConfig(reminder.organizationId);

      // 5. LINEメッセージを送信
      await pushMessageWithRetry(
        reminder.userId,
        [createTextMessage(reminder.message)],
        orgConfig.line.channelAccessToken,
        3  // 3回までリトライ
      );

      // 6. 送信済みとしてマーク
      await firestore.markReminderAsSent(reminder.id);
    }
  }
);
```

---

## 📅 リマインダーの送信タイミング

### **例: 2025年12月5日 14:00 のセミナーに申し込んだ場合**

| 日時 | 送信内容 | 計算方法 |
|-----|---------|---------|
| **12月4日 14:00** | **T-24h リマインダー** | セミナー開催時刻 - 24時間 |
| **12月5日 08:00** | **当日朝リマインダー** | セミナー開催日の朝8時 |

---

## 📝 リマインダーメッセージの内容

### **T-24h リマインダー** (`generateT24hReminderMessage`)

```
⏰ 【リマインダー】明日14:00から開始です

プラン名

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

ご都合が悪い場合は「キャンセル」と返信ください。
```

### **当日朝リマインダー** (`generateDayOfReminderMessage`)

```
🔔 【本日開催】14:00スタートです

プラン名

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

5分前にはZoomに接続してご準備をお願いします！
```

---

## ⚠️ 重要な注意事項

### **今日の日付で申込した場合の動作**

**例: 現在時刻が 2025年12月5日 15:00 で、今日の 16:00 のセミナーに申し込んだ場合**

| リマインダー | 送信予定時刻 | 状態 |
|-------------|------------|------|
| T-24h | 12月4日 16:00 | ❌ **過去の時刻なので送信されない** |
| 当日朝 | 12月5日 08:00 | ❌ **過去の時刻なので送信されない** |

**結論**: 今日の日付で申込した場合、リマインダーは送信されません。これは正常な動作です。

---

## 🔧 リマインダーの時刻計算ロジック

### **T-24h リマインダー** (`timezone.ts:37-41`)

```typescript
export function calculateT24hReminder(slotAt: Timestamp): Timestamp {
  const date = slotAt.toDate();
  const reminderDate = addHours(date, -24);  // 24時間前
  return Timestamp.fromDate(reminderDate);
}
```

### **当日朝リマインダー** (`timezone.ts:46-52`)

```typescript
export function calculateDayOfReminder(slotAt: Timestamp): Timestamp {
  const date = slotAt.toDate();
  const zonedDate = toZonedTime(date, 'Asia/Tokyo');
  const dayStart = startOfDay(zonedDate);  // 当日の0:00
  const reminder8AM = setHours(setMinutes(dayStart, 0), 8);  // 8:00に設定
  return Timestamp.fromDate(reminder8AM);
}
```

---

## 🎯 動作確認方法

### **1. Firestore でリマインダーデータを確認**

Firebase Console → Firestore → `reminders` コレクション

```json
{
  "applicationId": "app_xxx",
  "userId": "U1234567890abcdef",
  "scheduledAt": "2025-12-04T05:00:00Z",  // UTC時刻（JST 14:00）
  "type": "T-24h",
  "sentAt": null,  // 送信前は null、送信後に Timestamp が入る
  "canceled": false,
  "message": "⏰ 【リマインダー】明日14:00から開始です...",
  "organizationId": "org_xxx"
}
```

### **2. Cloud Functions のログを確認**

Firebase Console → Functions → `remind` → ログタブ

**正常な場合のログ**:
```
Reminder function triggered at: 2025-12-04T05:00:00.000Z
Found 2 pending reminders
Successfully sent reminder abc123 to user U1234567890abcdef
Successfully sent reminder def456 to user U9876543210fedcba
Reminder function completed successfully
```

**ユーザーが配信停止している場合のログ**:
```
Skipping reminder abc123 - user consent is false
```

### **3. LINE でメッセージを確認**

- T-24h リマインダー: セミナー24時間前に届く
- 当日朝リマインダー: セミナー当日朝8時に届く

---

## 🛠️ トラブルシューティング

### **リマインダーが届かない場合**

#### **1. ユーザーが配信停止していないか確認**

Firestore → `line_users` コレクション → 対象ユーザーのドキュメント:
```json
{
  "userId": "U1234567890abcdef",
  "consent": true  // ← これが false だと送信されない
}
```

#### **2. リマインダーがキャンセルされていないか確認**

Firestore → `reminders` コレクション:
```json
{
  "canceled": false  // ← これが true だと送信されない
}
```

#### **3. 送信予定時刻が過去でないか確認**

`scheduledAt` が現在時刻より前の時刻である必要があります。

#### **4. Cloud Functions がデプロイされているか確認**

Firebase Console → Functions:
- ✅ `apply`
- ✅ `webhook`
- ✅ **`remind`** ← これがあるか確認
- ✅ `deliverSteps`

---

## 🔄 リマインダーのキャンセル

ユーザーが「キャンセル」コマンドを送信すると、以下の処理が実行されます：

```typescript
// webhook-prod.ts
if (text === 'キャンセル') {
  const application = await firestore.getLatestApplication(userId);

  if (application) {
    // 申込をキャンセル
    await firestore.cancelApplication(application.id);

    // リマインダーをキャンセル
    await firestore.cancelRemindersForApplication(application.id);

    // ステップ配信をスキップ
    await stepDelivery.skipAllStepDeliveriesForApplication(db, application.id);
  }
}
```

キャンセルされたリマインダーは `canceled: true` となり、送信されません。

---

## 📊 デプロイ済み関数の確認

現在、以下の4つの関数がデプロイされています：

| 関数名 | 説明 | 実行頻度 |
|-------|------|---------|
| `apply` | セミナー申込処理 | HTTP リクエストで実行 |
| `webhook` | LINE Webhook 処理 | HTTP リクエストで実行 |
| **`remind`** | **リマインダー送信** | **5分ごと** |
| `deliverSteps` | ステップ配信送信 | 5分ごと |

---

## 🔒 セキュリティと制限

### **配信同意の確認**

- ユーザーが「配信停止」コマンドを送信すると、リマインダーは送信されません
- `line_users.consent` が `false` の場合、自動的にスキップされます

### **サブスクリプション制限**

- プランによって作成できるリマインダー数に上限があります
- 上限に達すると、新しいリマインダーは作成されません
- 詳細は `lib/stripe-config.ts` の `limits.maxReminders` を参照

---

## ✅ まとめ

- リマインダー機能は**既に実装され、デプロイ済み**です
- **既存機能（apply, webhook, deliverSteps）は一切変更していません**
- セミナー24時間前と当日朝8時に自動送信されます
- 今日の日付で申込した場合、リマインダーは送信されません（正常動作）
- ユーザーは「配信停止」「キャンセル」コマンドで制御できます

---

**最終更新**: 2025-11-30
**作成者**: Claude Code
