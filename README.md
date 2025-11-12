# L-Apply - LINE LIFF 申込システム

Next.js 14（App Router, TypeScript）+ Firebase（Firestore / Functions v2 / Scheduled Functions）+ LINE（LIFF + Messaging API）による、リッチメニューからの申込システムです。

## 主要機能

### 1. 申込フロー

- リッチメニューの「申込」ボタン → LIFF を起動
- ユーザーがフォーム送信（プラン、日時、備考、同意）
- LIFF で idToken 検証 → userId 取得
- Firebase Functions へ POST → Firestore に保存
- 申込直後に完了メッセージを LINE Push

### 2. 自動リマインド

- Scheduled Function が定期実行（5分ごと）
- `scheduledAt <= now` & `sentAt IS NULL` & `canceled=false` & `consent=true` を抽出
- LINE Push 送信 → `sentAt` を更新
- 送信失敗時は指数バックオフで最大3回リトライ

### 3. Webhook 対応

| コマンド | 動作 |
|---------|------|
| 配信停止 | `line_users.consent=false` |
| 再開 / 停止解除 | `line_users.consent=true` |
| 予約確認 | 直近の申込を返信 |
| キャンセル | `applications.status='canceled'`、関連 `reminders.canceled=true` |

## 技術スタック

- **Frontend**: Next.js 14 (App Router, TypeScript), LIFF SDK
- **Backend**: Firebase Functions v2 (Node.js 20)
- **Database**: Firestore
- **Authentication**: LINE LIFF ID Token
- **Messaging**: LINE Messaging API
- **Hosting**: Firebase Hosting

## プロジェクト構造

```
L-Apply/
├── app/                      # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── liff/
│       └── apply/
│           ├── page.tsx      # LIFF 申込フォーム
│           └── apply.module.css
├── functions/                # Firebase Functions
│   ├── src/
│   │   ├── index.ts          # Functions エントリーポイント
│   │   ├── apply.ts          # 申込処理 Function
│   │   ├── webhook.ts        # Webhook 処理 Function
│   │   ├── remind.ts         # リマインド Scheduled Function
│   │   ├── types.ts          # TypeScript 型定義
│   │   ├── config.ts         # 設定管理
│   │   ├── utils/
│   │   │   ├── line.ts       # LINE API ユーティリティ
│   │   │   ├── firestore.ts  # Firestore ユーティリティ
│   │   │   ├── timezone.ts   # タイムゾーン処理
│   │   │   └── messages.ts   # メッセージテンプレート
│   │   └── __tests__/        # テストコード
│   │       ├── setup.ts
│   │       ├── timezone.test.ts
│   │       └── messages.test.ts
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules           # Firestore セキュリティルール
├── firestore.indexes.json    # Firestore インデックス
├── firebase.json             # Firebase 設定
├── .firebaserc.sample        # Firebase プロジェクト設定サンプル
├── .env.sample               # Next.js 環境変数サンプル
├── SETUP.md                  # 初回セットアップガイド
└── README.md                 # このファイル
```

## データモデル

### line_users

| フィールド | 型 | 説明 |
|-----------|---|------|
| userId | string | LINE ユーザー ID |
| displayName | string | 表示名 |
| consent | boolean | リマインド通知の同意 |
| createdAt | Timestamp | 作成日時 |
| updatedAt | Timestamp | 更新日時 |

### applications

| フィールド | 型 | 説明 |
|-----------|---|------|
| userId | string | LINE ユーザー ID |
| slotAt | Timestamp | 予約日時 |
| plan | string | プラン名 |
| notes | string? | 備考 |
| status | string | 'applied' or 'canceled' |
| createdAt | Timestamp | 作成日時 |

### reminders

| フィールド | 型 | 説明 |
|-----------|---|------|
| applicationId | string | 申込 ID |
| userId | string | LINE ユーザー ID |
| scheduledAt | Timestamp | 送信予定日時 |
| type | string | 'T-24h', 'day-of', 'custom' |
| sentAt | Timestamp? | 送信済み日時 |
| canceled | boolean | キャンセルフラグ |
| message | string | 送信メッセージ |

### Firestore インデックス

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

## セキュリティ

### Firestore ルール

- **line_users**: ユーザーは自分のデータのみ読取可、書込はサーバーのみ
- **applications**: ユーザーは自分のデータのみ読取可、書込はサーバーのみ
- **reminders**: ユーザーは自分のデータのみ読取可、書込はサーバーのみ

### 環境変数管理

- **機密情報**: Firebase Secrets Manager または環境変数
- **ハードコード禁止**: すべての API キーとシークレットは環境変数化
- **.env.sample**: サンプルファイルで必要な変数を明示

### LINE Webhook 署名検証

- `x-line-signature` ヘッダーを検証
- 不正なリクエストは 401 エラー

## タイムゾーン対応

すべての日時処理は **Asia/Tokyo** タイムゾーンで統一：

- `date-fns-tz` を使用
- Firestore は UTC で保存、表示時に JST に変換
- リマインド送信タイミングも JST 基準

## リマインドロジック

### T-24h リマインド

- 予約時刻の24時間前に送信
- 例: 2025-11-02 14:00 の予約 → 2025-11-01 14:00 に送信

### Day-of リマインド

- 予約当日の朝8時に送信
- 例: 2025-11-02 14:00 の予約 → 2025-11-02 08:00 に送信

### 冪等性保持

- `sentAt` フィールドで送信済みを記録
- 同じリマインドを複数回送信しない
- 送信失敗時はリトライ（最大3回、指数バックオフ）

## メッセージテンプレート

### 申込完了

```
お申し込みありがとうございます！

プラン：{plan}
日時：{slotAt_ja}
会場/URL：{url}

ご不明点はこのトークに返信してください。
```

### 前日リマインド

```
明日{time_ja}から開始です。

プラン：{plan}
会場/URL：{url}

ご都合が悪い場合は「キャンセル」と返信ください。
```

### 当日朝リマインド

```
本日{time_ja}スタートです。

プラン：{plan}

5分前にはご準備をお願いします！
```

## セットアップ

詳細な手順は [SETUP.md](./SETUP.md) を参照してください。

### クイックスタート

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd L-Apply

# 2. 依存関係をインストール
npm install
cd functions && npm install && cd ..

# 3. 環境変数を設定
cp .env.sample .env.local
cp .firebaserc.sample .firebaserc
# .env.local と .firebaserc を編集

# 4. Firebase Secrets を設定
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
firebase functions:secrets:set LINE_CHANNEL_SECRET
firebase functions:secrets:set LIFF_ID

# 5. ビルドとデプロイ
npm run build
firebase deploy
```

## 開発

### ローカル開発

```bash
# Next.js 開発サーバー
npm run dev

# Firebase Emulator
firebase emulators:start

# Functions をビルド
cd functions
npm run build
```

### テスト実行

```bash
cd functions
npm test
```

### デプロイ

```bash
# 全体をデプロイ
npm run deploy

# Functions のみ
firebase deploy --only functions

# Hosting のみ
npm run build
firebase deploy --only hosting

# Firestore ルールのみ
firebase deploy --only firestore
```

## API エンドポイント

### POST /apply

申込処理を実行します。

**Request Body:**
```json
{
  "idToken": "LINE_ID_TOKEN",
  "plan": "ベーシックプラン",
  "slotAt": "2025-11-02T14:00:00+09:00",
  "notes": "備考",
  "consent": true
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "abc123"
}
```

### POST /webhook

LINE Webhook イベントを処理します。

**Headers:**
- `x-line-signature`: LINE 署名

**Request Body:**
```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "予約確認"
      }
    }
  ]
}
```

### Scheduled: remind

5分ごとに実行され、pending リマインドを送信します。

## トラブルシューティング

### Functions デプロイエラー

```bash
# ログを確認
firebase functions:log

# ローカルでビルドテスト
cd functions
npm run build
npm test
```

### Webhook が動作しない

1. Webhook URL が正しいか確認
2. 署名検証が有効か確認（Channel Secret が正しいか）
3. Functions ログでエラーを確認

### LIFF が開かない

1. LIFF ID が正しいか確認
2. Endpoint URL が正しいか確認
3. ブラウザの開発者ツールでエラーを確認

### リマインドが送信されない

1. Scheduled Function が有効か確認
2. `scheduledAt` が未来の日時になっていないか確認
3. `consent=true` になっているか確認
4. Firestore インデックスが作成されているか確認

## 仮定と制約

### 仮定

1. **タイムゾーン**: すべての日時は Asia/Tokyo（JST）で処理
2. **リマインド送信**: 5分ごとに実行（本番環境では調整可能）
3. **重複申込**: 同じユーザー・同じ日時への重複申込は 409 エラーで拒否
4. **LINE API**: `@line/bot-sdk` v9.x を使用
5. **Functions v2**: Node.js 20、asia-northeast1 リージョン

### 制約

1. **Firestore 書込**: クライアントからの直接書込は不可（セキュリティルール）
2. **リトライ**: Push 送信失敗時は最大3回までリトライ
3. **バッチサイズ**: リマインド送信は1回あたり最大100件
4. **ID Token 有効期限**: LIFF ID Token は短時間で期限切れになる可能性あり

## ライセンス

MIT License

## サポート

問題が発生した場合は、以下を確認してください：

1. [SETUP.md](./SETUP.md) のセットアップ手順
2. Firebase Console のログ
3. LINE Developers Console の設定
4. 環境変数が正しく設定されているか

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まず Issue を開いて変更内容を議論してください。

## 謝辞

- Next.js チーム
- Firebase チーム
- LINE Developers
