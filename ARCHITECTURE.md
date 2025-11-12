# アーキテクチャドキュメント

## システム概要

L-Apply は LINE LIFF + Firebase を使った申込・リマインドシステムです。

```
┌─────────────┐
│  LINE User  │
└──────┬──────┘
       │
       │ 1. タップ（リッチメニュー）
       ▼
┌─────────────────┐
│   LINE LIFF     │
│  (Next.js SPA)  │
└────────┬────────┘
         │
         │ 2. POST /apply
         │    (idToken + form data)
         ▼
┌─────────────────────────────┐
│  Firebase Functions v2      │
│  ┌─────────────────────┐   │
│  │  apply()            │   │
│  │  - ID Token 検証    │   │
│  │  - Firestore 保存   │   │
│  │  - リマインド作成   │   │
│  │  - 完了Push送信     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  webhook()          │   │
│  │  - 署名検証         │   │
│  │  - コマンド処理     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  remind()           │   │
│  │  - 5分ごと実行      │   │
│  │  - pending抽出      │   │
│  │  - Push送信         │   │
│  └─────────────────────┘   │
└───────────┬─────────────────┘
            │
            ▼
     ┌──────────────┐
     │  Firestore   │
     │  - line_users│
     │  - apps      │
     │  - reminders │
     └──────────────┘
            │
            │ 4. Push Message
            ▼
      ┌──────────────┐
      │ LINE Messaging│
      │     API       │
      └───────┬───────┘
              │
              ▼
        ┌──────────┐
        │LINE User │
        └──────────┘
```

## コンポーネント詳細

### 1. LIFF アプリケーション (Next.js)

**責務:**
- ユーザーインターフェースの提供
- フォーム入力の検証
- LIFF SDK による認証
- ID Token の取得と Functions への送信

**実装:**
- `app/liff/apply/page.tsx`: メインのフォーム画面
- LIFF SDK で LINE ログイン
- フォーム送信時に ID Token を Functions へ POST

**セキュリティ:**
- LIFF ID Token による認証
- HTTPS 通信
- CORS 制限

### 2. Firebase Functions

#### 2.1 apply Function (HTTP)

**責務:**
- 申込処理のメイン関数
- ID Token 検証
- Firestore への保存
- リマインド作成
- 完了メッセージ送信

**フロー:**
```
1. Request 受信
2. ID Token 検証 (LINE API)
3. line_users upsert
4. 重複チェック
5. applications 作成
6. reminders 作成 (T-24h, day-of)
7. 完了メッセージ Push
8. Response 返却
```

**エラーハンドリング:**
- 400: バリデーションエラー
- 401: ID Token 無効
- 409: 重複申込
- 500: サーバーエラー

#### 2.2 webhook Function (HTTP)

**責務:**
- LINE Webhook イベント処理
- コマンド分岐
- ユーザーアクション対応

**サポートコマンド:**
- `配信停止`: consent を false に更新
- `再開` / `停止解除`: consent を true に更新
- `予約確認`: 最新の申込を返信
- `キャンセル`: 申込を canceled に更新、reminders をキャンセル

**セキュリティ:**
- x-line-signature ヘッダー検証
- Channel Secret による署名検証

#### 2.3 remind Function (Scheduled)

**責務:**
- 定期的なリマインド送信
- 5分ごとに実行
- pending リマインドの抽出と送信

**フロー:**
```
1. 現在時刻取得 (JST)
2. pending reminders 抽出
   - scheduledAt <= now
   - sentAt IS NULL
   - canceled = false
3. 各リマインドについて:
   a. ユーザーの consent チェック
   b. Push メッセージ送信
   c. sentAt 更新
4. エラー時は指数バックオフでリトライ
```

**冪等性:**
- `sentAt` フィールドで送信済みを記録
- 同じリマインドを複数回送信しない

### 3. Firestore

#### 3.1 データモデル

```typescript
// line_users
{
  userId: string,          // Primary Key
  displayName: string,
  consent: boolean,        // デフォルト true
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// applications
{
  id: string,              // Auto-generated
  userId: string,          // Foreign Key
  slotAt: Timestamp,
  plan: string,
  notes?: string,
  status: 'applied' | 'canceled',
  createdAt: Timestamp
}

// reminders
{
  id: string,              // Auto-generated
  applicationId: string,   // Foreign Key
  userId: string,          // Foreign Key
  scheduledAt: Timestamp,  // 送信予定時刻
  type: 'T-24h' | 'day-of' | 'custom',
  sentAt: Timestamp | null,
  canceled: boolean,
  message: string
}
```

#### 3.2 インデックス

```json
{
  "collectionGroup": "reminders",
  "fields": [
    { "fieldPath": "scheduledAt", "order": "ASCENDING" },
    { "fieldPath": "sentAt", "order": "ASCENDING" },
    { "fieldPath": "canceled", "order": "ASCENDING" }
  ]
}
```

**理由:**
- remind Function でのクエリを高速化
- `scheduledAt <= now` & `sentAt == null` & `canceled == false` のクエリ

#### 3.3 セキュリティルール

```javascript
match /line_users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false;  // Functions のみ
}

match /applications/{applicationId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if false;  // Functions のみ
}

match /reminders/{reminderId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if false;  // Functions のみ
}
```

### 4. LINE Platform

#### 4.1 LIFF

- LIFF ID による認証
- ID Token の発行
- ユーザープロフィール取得

#### 4.2 Messaging API

- Push メッセージ送信
- Webhook イベント受信
- リッチメニュー

## データフロー

### 申込フロー

```
User → LIFF → Functions (apply) → Firestore → LINE API → User
     [Form]   [ID Token]        [Save]       [Push]    [Message]
```

### リマインドフロー

```
Scheduler → Functions (remind) → Firestore → LINE API → User
  [5min]    [Query pending]      [Update]    [Push]   [Message]
```

### Webhook フロー

```
User → LINE API → Functions (webhook) → Firestore
 [Text]  [Event]   [Command]           [Update]
                        ↓
                    LINE API
                        ↓
                      User
                   [Reply]
```

## タイムゾーン処理

すべての日時処理は **Asia/Tokyo** で統一：

```typescript
import { toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'Asia/Tokyo';

// Firestore Timestamp → JST 表示
const jstString = format(
  toZonedTime(timestamp.toDate(), TIMEZONE),
  'yyyy/MM/dd HH:mm',
  { timeZone: TIMEZONE }
);

// T-24h 計算
const reminderTime = addHours(slotAt.toDate(), -24);

// Day-of 8AM 計算
const dayStart = startOfDay(toZonedTime(slotAt.toDate(), TIMEZONE));
const reminder8AM = setHours(dayStart, 8);
```

## セキュリティ設計

### 認証・認可

1. **LIFF → Functions**: ID Token 検証
2. **LINE → Functions**: Webhook 署名検証
3. **Client → Firestore**: セキュリティルールで書込禁止

### 環境変数管理

```bash
# Firebase Secrets Manager (本番)
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN

# 環境変数 (開発)
export LINE_CHANNEL_ACCESS_TOKEN=xxx
```

### CORS

```typescript
onRequest({
  cors: true,  // すべてのオリジンを許可（本番では制限推奨）
  // ...
})
```

## スケーラビリティ

### 現状の制約

- **リマインド送信**: 5分ごとに最大100件
- **Firestore 読取**: クエリあたり最大100件
- **LINE API**: Rate limit あり

### スケールアップ方法

1. **リマインド頻度を調整**: `every 1 minute` など
2. **バッチサイズ拡大**: limit(100) → limit(500)
3. **並列処理**: Promise.all で複数リマインドを並列送信
4. **パーティショニング**: reminders を時間帯ごとに分割

## 監視とログ

### Firebase Functions ログ

```bash
# リアルタイムログ
firebase functions:log

# 特定の Function のログ
firebase functions:log --only remind
```

### 監視項目

- **apply Function**: 成功率、レスポンスタイム、エラー率
- **webhook Function**: 署名検証失敗率
- **remind Function**: 送信成功率、リトライ回数

### アラート設定

- エラー率が 5% を超えたら通知
- リマインド送信失敗が連続したら通知

## テスト戦略

### ユニットテスト

- `timezone.test.ts`: 日時計算ロジック
- `messages.test.ts`: メッセージテンプレート

### 統合テスト

- Firebase Emulator を使用
- LIFF SDK はモック化

### E2E テスト

1. LIFF フォーム送信
2. Firestore 保存確認
3. Push メッセージ受信確認
4. リマインド送信確認

## デプロイ戦略

### CI/CD

```bash
# ビルド
npm run build
cd functions && npm run build

# テスト
cd functions && npm test

# デプロイ
firebase deploy
```

### ステージング環境

- 別の Firebase プロジェクトを使用
- `.firebaserc` で切り替え

```json
{
  "projects": {
    "default": "l-apply-prod",
    "staging": "l-apply-staging"
  }
}
```

## 今後の拡張

1. **カスタムリマインド**: ユーザーが任意の時刻を設定
2. **複数イベント対応**: 1ユーザーで複数の申込
3. **管理画面**: 申込一覧、統計表示
4. **メール通知**: LINE に加えてメール送信
5. **多言語対応**: i18n サポート

## 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Functions v2](https://firebase.google.com/docs/functions/get-started?gen=2nd)
- [LINE LIFF](https://developers.line.biz/ja/docs/liff/)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
