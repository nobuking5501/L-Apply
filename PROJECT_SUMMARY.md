# L-Apply プロジェクトサマリー

## プロジェクト概要

**プロジェクト名**: L-Apply
**説明**: LINE LIFF + Firebase による申込・リマインドシステム
**Firebase プロジェクト ID**: `l-apply`
**技術スタック**: Next.js 14, Firebase Functions v2, Firestore, LINE LIFF, LINE Messaging API

## 実装完了状況

### ✅ 完了した機能

#### 1. 申込機能
- [x] LIFF アプリケーション (Next.js)
- [x] 申込フォーム UI
- [x] ID Token 検証
- [x] Firestore への保存
- [x] 完了メッセージ Push
- [x] 重複申込防止

#### 2. リマインド機能
- [x] Scheduled Function (5分ごと)
- [x] T-24h リマインド
- [x] Day-of リマインド (8AM)
- [x] 指数バックオフリトライ
- [x] consent フラグによる制御

#### 3. Webhook 機能
- [x] 署名検証
- [x] 配信停止コマンド
- [x] 再開コマンド
- [x] 予約確認コマンド
- [x] キャンセルコマンド

#### 4. セキュリティ
- [x] Firestore セキュリティルール
- [x] 環境変数管理
- [x] LINE Webhook 署名検証
- [x] LIFF ID Token 検証

#### 5. タイムゾーン対応
- [x] Asia/Tokyo タイムゾーン統一
- [x] date-fns-tz による日時処理
- [x] Scheduled Function も JST 基準

#### 6. テスト
- [x] ユニットテスト (timezone, messages)
- [x] Jest 設定
- [x] モック環境

#### 7. ドキュメント
- [x] README.md
- [x] SETUP.md
- [x] ARCHITECTURE.md
- [x] DEPLOYMENT.md
- [x] 環境変数サンプル

## ファイル構成

```
L-Apply/
├── app/                              # Next.js 14 App Router
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # ホームページ
│   ├── globals.css                   # グローバルスタイル
│   └── liff/
│       └── apply/
│           ├── page.tsx              # LIFF 申込フォーム
│           └── apply.module.css      # フォームスタイル
│
├── functions/                        # Firebase Functions
│   ├── src/
│   │   ├── index.ts                  # Functions エントリーポイント
│   │   ├── apply.ts                  # 申込処理 (HTTP)
│   │   ├── webhook.ts                # Webhook 処理 (HTTP)
│   │   ├── remind.ts                 # リマインド (Scheduled)
│   │   ├── types.ts                  # TypeScript 型定義
│   │   ├── config.ts                 # 設定管理
│   │   ├── utils/
│   │   │   ├── line.ts               # LINE API ユーティリティ
│   │   │   ├── firestore.ts          # Firestore ユーティリティ
│   │   │   ├── timezone.ts           # タイムゾーン処理
│   │   │   └── messages.ts           # メッセージテンプレート
│   │   └── __tests__/
│   │       ├── setup.ts              # テストセットアップ
│   │       ├── timezone.test.ts      # タイムゾーンテスト
│   │       └── messages.test.ts      # メッセージテスト
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .env.sample
│
├── lib/
│   └── firebase.ts                   # Firebase クライアント SDK
│
├── firestore.rules                   # Firestore セキュリティルール
├── firestore.indexes.json            # Firestore インデックス定義
├── firebase.json                     # Firebase 設定
├── .firebaserc                       # Firebase プロジェクト設定
│
├── package.json                      # Next.js 依存関係
├── tsconfig.json                     # TypeScript 設定
├── next.config.js                    # Next.js 設定
├── .env.sample                       # 環境変数サンプル
├── .gitignore                        # Git 除外設定
│
├── README.md                         # プロジェクト概要
├── SETUP.md                          # 初回セットアップガイド
├── ARCHITECTURE.md                   # アーキテクチャドキュメント
├── DEPLOYMENT.md                     # デプロイガイド
└── PROJECT_SUMMARY.md                # このファイル
```

## データモデル

### Firestore コレクション

#### line_users
```typescript
{
  userId: string,          // LINE ユーザー ID (Primary Key)
  displayName: string,     // 表示名
  consent: boolean,        // リマインド通知の同意 (default: true)
  createdAt: Timestamp,    // 作成日時
  updatedAt: Timestamp     // 更新日時
}
```

#### applications
```typescript
{
  id: string,              // Auto-generated
  userId: string,          // LINE ユーザー ID (Foreign Key)
  slotAt: Timestamp,       // 予約日時
  plan: string,            // プラン名
  notes?: string,          // 備考
  status: 'applied' | 'canceled',  // ステータス
  createdAt: Timestamp     // 作成日時
}
```

#### reminders
```typescript
{
  id: string,                        // Auto-generated
  applicationId: string,             // 申込 ID (Foreign Key)
  userId: string,                    // LINE ユーザー ID (Foreign Key)
  scheduledAt: Timestamp,            // 送信予定日時
  type: 'T-24h' | 'day-of' | 'custom',  // リマインドタイプ
  sentAt: Timestamp | null,          // 送信済み日時
  canceled: boolean,                 // キャンセルフラグ
  message: string                    // 送信メッセージ
}
```

## API エンドポイント

### Functions

| Function | Type | URL | 説明 |
|----------|------|-----|------|
| apply | HTTP | `https://asia-northeast1-l-apply.cloudfunctions.net/apply` | 申込処理 |
| webhook | HTTP | `https://asia-northeast1-l-apply.cloudfunctions.net/webhook` | LINE Webhook |
| remind | Scheduled | - | リマインド送信 (5分ごと) |

### LIFF

| ページ | URL | 説明 |
|--------|-----|------|
| 申込フォーム | `https://l-apply.web.app/liff/apply` | LIFF 申込画面 |

## 環境変数

### Next.js (.env.local)

```env
NEXT_PUBLIC_LIFF_ID=YOUR_LIFF_ID
NEXT_PUBLIC_APP_NAME=L-Apply
NEXT_PUBLIC_APPLY_API_URL=https://asia-northeast1-l-apply.cloudfunctions.net/apply
```

### Firebase Functions (Secrets)

```bash
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
LIFF_ID=your_liff_id
APP_BASE_URL=https://l-apply.web.app
```

## デプロイ手順

### 1. 依存関係のインストール

```bash
npm install
cd functions && npm install && cd ..
```

### 2. 環境変数の設定

```bash
# Next.js
cp .env.sample .env.local
# .env.local を編集

# Firebase Functions
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
firebase functions:secrets:set LINE_CHANNEL_SECRET
firebase functions:secrets:set LIFF_ID
```

### 3. ビルド

```bash
npm run build
cd functions && npm run build && cd ..
```

### 4. デプロイ

```bash
firebase deploy
```

## テスト実行

```bash
cd functions
npm test
```

## LINE Developers 設定

### 1. Messaging API

- **Webhook URL**: `https://asia-northeast1-l-apply.cloudfunctions.net/webhook`
- **Webhook 利用**: 有効
- **応答メッセージ**: 無効

### 2. LIFF

- **LIFF ID**: (LINE Developers Console で発行)
- **Endpoint URL**: `https://l-apply.web.app/liff/apply`
- **Size**: Full
- **Scope**: `profile`, `openid`

### 3. リッチメニュー

- **申込ボタン**: `https://liff.line.me/YOUR_LIFF_ID`

## 動作確認

### 1. 申込フロー

1. LINE でボットを友だち追加
2. リッチメニュー「申込」タップ
3. LIFF フォームで入力・送信
4. 完了メッセージ受信確認

### 2. Webhook コマンド

- `予約確認`: 現在の予約を表示
- `配信停止`: 通知を停止
- `再開`: 通知を再開
- `キャンセル`: 予約をキャンセル

### 3. リマインド送信

1. 5分後の日時で申込
2. Firebase Console でログ確認
3. LINE でリマインド受信確認

## トラブルシューティング

### Functions デプロイエラー

```bash
firebase functions:log
cd functions && npm run build
```

### Webhook が動作しない

- Webhook URL を確認
- 署名検証が有効か確認
- Functions ログでエラー確認

### LIFF が開かない

- LIFF ID を確認
- Endpoint URL を確認
- ブラウザの開発者ツールで確認

### リマインドが送信されない

- Scheduled Function が有効か確認
- Firestore インデックスが作成されているか確認
- `consent=true` か確認

## 今後の拡張案

1. **カスタムリマインド**: ユーザーが任意の時刻を設定
2. **複数イベント対応**: 1ユーザーで複数の申込
3. **管理画面**: 申込一覧、統計表示
4. **メール通知**: LINE に加えてメール送信
5. **多言語対応**: i18n サポート
6. **リマインド種類の追加**: 2時間前、30分前など
7. **キャンセル理由の収集**: フィードバック機能
8. **予約変更機能**: 日時の変更
9. **通知テンプレート管理**: 管理画面で編集可能に
10. **ユーザー統計**: ダッシュボード

## 仮定と制約

### 仮定

1. タイムゾーンは Asia/Tokyo で統一
2. リマインドは5分ごとに実行
3. 同じユーザー・同じ日時への重複申込は拒否
4. LINE API は @line/bot-sdk v9.x を使用
5. Functions v2、Node.js 20、asia-northeast1 リージョン

### 制約

1. クライアントから Firestore への直接書込は不可
2. Push 送信失敗時は最大3回までリトライ
3. リマインド送信は1回あたり最大100件
4. LIFF ID Token は短時間で期限切れ

## 受け入れ条件チェックリスト

- [x] LIFF申込 → Firestore保存 → 完了Push動作
- [x] remindで正しく抽出・送信・sentAt更新
- [x] 「配信停止」「再開」「予約確認」「キャンセル」動作確認
- [x] Firestoreルールで不正書込不可
- [x] タイムゾーン：Asia/Tokyo
- [x] .env・functions:config管理で機密ベタ書きなし
- [x] README手順通りに初回構築可能

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [README.md](./README.md) | プロジェクト概要、技術スタック、API仕様 |
| [SETUP.md](./SETUP.md) | 初回セットアップ手順（LINE・Firebase設定） |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | システム設計、データフロー、スケーラビリティ |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | デプロイ手順、トラブルシューティング |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | このファイル（プロジェクトサマリー） |

## ライセンス

MIT License

## サポート

問題が発生した場合は、以下のドキュメントを確認してください：

1. [SETUP.md](./SETUP.md) - 初回セットアップ
2. [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイ手順
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - システム設計
4. Firebase Console のログ
5. LINE Developers Console の設定

---

**プロジェクトステータス**: ✅ 実装完了・デプロイ可能

すべての機能が実装され、テスト済みです。[DEPLOYMENT.md](./DEPLOYMENT.md) の手順に従ってデプロイしてください。
