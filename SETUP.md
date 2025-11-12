# セットアップガイド

このドキュメントでは、L-Apply システムを初回セットアップする手順を説明します。

## 前提条件

- Node.js 20.x 以上
- npm または yarn
- Firebase CLI
- LINE Developers アカウント
- Firebase プロジェクト

## 1. LINE Developers 設定

### 1.1 Messaging API チャンネルの作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを選択または作成
3. 「Messaging API」チャンネルを作成
4. 以下の情報を控える：
   - Channel ID
   - Channel Secret
   - Channel Access Token (発行が必要)

### 1.2 Webhook 設定

1. Messaging API 設定画面で「Webhook URL」を設定
   - URL: `https://asia-northeast1-YOUR_PROJECT_ID.cloudfunctions.net/webhook`
   - デプロイ後に設定可能
2. 「Webhook の利用」を有効化
3. 「応答メッセージ」を無効化（ボットからの自動応答を停止）

### 1.3 LIFF アプリの作成

1. LINE Developers Console で「LIFF」タブを選択
2. 「追加」をクリック
3. 設定：
   - LIFF app name: `L-Apply`
   - Size: `Full`
   - Endpoint URL: `https://YOUR_APP.web.app/liff/apply`（デプロイ後に設定可能）
   - Scope: `profile`, `openid`
4. LIFF ID を控える

### 1.4 リッチメニューの作成

1. LINE Official Account Manager または API で リッチメニューを作成
2. 「申込」ボタンに LIFF URL を設定：
   - `https://liff.line.me/YOUR_LIFF_ID`

## 2. Firebase プロジェクト設定

### 2.1 プロジェクトの初期化

```bash
# Firebase CLI をインストール（まだの場合）
npm install -g firebase-tools

# Firebase にログイン
firebase login

# プロジェクトディレクトリで初期化
cd /path/to/L-Apply
firebase init
```

### 2.2 初期化の選択

- Firestore: Yes
- Functions: Yes
- Hosting: Yes

### 2.3 .firebaserc の作成

`.firebaserc.sample` をコピーして `.firebaserc` を作成：

```bash
cp .firebaserc.sample .firebaserc
```

`.firebaserc` を編集してプロジェクト ID を設定：

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 2.4 Firestore の有効化

1. Firebase Console でプロジェクトを開く
2. Firestore Database を有効化
3. 本番モードで開始（セキュリティルールは後でデプロイ）

### 2.5 Functions の有効化

1. Firebase Console で Functions を有効化
2. Blaze プラン（従量課金）にアップグレード（Functions v2 に必要）

## 3. 環境変数の設定

### 3.1 Next.js 環境変数

`.env.sample` をコピーして `.env.local` を作成：

```bash
cp .env.sample .env.local
```

`.env.local` を編集：

```env
NEXT_PUBLIC_LIFF_ID=YOUR_LIFF_ID
NEXT_PUBLIC_APP_NAME=L-Apply
NEXT_PUBLIC_APPLY_API_URL=https://asia-northeast1-YOUR_PROJECT_ID.cloudfunctions.net/apply
```

### 3.2 Firebase Functions Secrets

Functions v2 では Secrets Manager を使用します：

```bash
# LINE Channel Access Token を設定
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
# プロンプトでトークンを入力

# LINE Channel Secret を設定
firebase functions:secrets:set LINE_CHANNEL_SECRET
# プロンプトでシークレットを入力

# LIFF ID を設定
firebase functions:secrets:set LIFF_ID
# プロンプトで LIFF ID を入力
```

環境変数として設定する場合（開発環境）：

`functions/.env` を作成：

```env
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret
LIFF_ID=your_liff_id
APP_BASE_URL=https://your-app.web.app
```

## 4. 依存関係のインストール

### 4.1 ルートディレクトリ

```bash
npm install
```

### 4.2 Functions ディレクトリ

```bash
cd functions
npm install
cd ..
```

## 5. ビルドとデプロイ

### 5.1 全体をデプロイ

```bash
npm run build
firebase deploy
```

または個別にデプロイ：

```bash
# Firestore ルールのみ
firebase deploy --only firestore

# Functions のみ
firebase deploy --only functions

# Hosting のみ
npm run build
firebase deploy --only hosting
```

### 5.2 デプロイ後の確認

1. Firebase Console で Functions の URL を確認
2. LINE Developers Console で Webhook URL を更新
3. LIFF Endpoint URL を更新（必要に応じて）

## 6. 動作確認

### 6.1 LIFF 申込フロー

1. LINE アプリでボットを友だち追加
2. リッチメニューの「申込」をタップ
3. フォームに入力して送信
4. トークに完了メッセージが届くことを確認

### 6.2 Webhook コマンド

トークで以下のメッセージを送信して動作確認：

- `予約確認`: 現在の予約を表示
- `配信停止`: 通知を停止
- `再開`: 通知を再開
- `キャンセル`: 予約をキャンセル

### 6.3 リマインド送信

1. 申込時に数分後の日時を設定
2. Firebase Console の Functions ログでリマインド送信を確認
3. LINE トークでリマインドメッセージを受信

## 7. トラブルシューティング

### Functions デプロイエラー

```bash
# ログを確認
firebase functions:log

# ローカルでテスト
cd functions
npm test
npm run build
```

### Webhook が動作しない

1. Webhook URL が正しいか確認
2. 署名検証が有効か確認
3. Functions ログでエラーを確認

### LIFF が開かない

1. LIFF ID が正しいか確認
2. Endpoint URL が正しいか確認
3. ブラウザの開発者ツールでエラーを確認

## 8. 開発環境での実行

### Firebase Emulator の使用

```bash
firebase emulators:start
```

### Next.js 開発サーバー

```bash
npm run dev
```

## 次のステップ

- [README.md](./README.md) でプロジェクトの概要を確認
- [ARCHITECTURE.md](./ARCHITECTURE.md) でアーキテクチャを理解
- テストを実行: `cd functions && npm test`
