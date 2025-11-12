# デプロイガイド

このドキュメントでは、L-Apply システムを実際にデプロイする手順を説明します。

## 前提条件

- [SETUP.md](./SETUP.md) の手順を完了していること
- Firebase プロジェクト ID: `l-apply`
- LINE Developers Console で設定完了

## 1. 環境変数の最終確認

### 1.1 Next.js 環境変数 (.env.local)

```env
NEXT_PUBLIC_LIFF_ID=YOUR_ACTUAL_LIFF_ID
NEXT_PUBLIC_APP_NAME=L-Apply
NEXT_PUBLIC_APPLY_API_URL=https://asia-northeast1-l-apply.cloudfunctions.net/apply
```

### 1.2 Firebase Functions Secrets

```bash
# Secrets を設定
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
# プロンプトでトークンを入力

firebase functions:secrets:set LINE_CHANNEL_SECRET
# プロンプトでシークレットを入力

firebase functions:secrets:set LIFF_ID
# プロンプトで LIFF ID を入力

# 確認
firebase functions:secrets:access LINE_CHANNEL_ACCESS_TOKEN
```

または環境変数を使う場合（`functions/.env`）:

```bash
cd functions
cat > .env << 'EOF'
LINE_CHANNEL_ACCESS_TOKEN=your_actual_token_here
LINE_CHANNEL_SECRET=your_actual_secret_here
LIFF_ID=your_actual_liff_id_here
APP_BASE_URL=https://l-apply.web.app
EOF
cd ..
```

## 2. 依存関係のインストール

```bash
# ルートディレクトリ
npm install

# Functions ディレクトリ
cd functions
npm install
cd ..
```

## 3. ビルドとテスト

### 3.1 Functions のテスト

```bash
cd functions
npm test
```

### 3.2 Functions のビルド

```bash
cd functions
npm run build
cd ..
```

### 3.3 Next.js のビルド

```bash
npm run build
```

## 4. Firebase へのデプロイ

### 4.1 初回デプロイ（全体）

```bash
firebase deploy
```

これにより以下がデプロイされます：
- Firestore セキュリティルール
- Firestore インデックス
- Firebase Functions (apply, webhook, remind)
- Firebase Hosting (Next.js アプリ)

### 4.2 個別デプロイ

#### Firestore のみ

```bash
firebase deploy --only firestore
```

#### Functions のみ

```bash
firebase deploy --only functions
```

特定の Function のみ:

```bash
firebase deploy --only functions:apply
firebase deploy --only functions:webhook
firebase deploy --only functions:remind
```

#### Hosting のみ

```bash
npm run build
firebase deploy --only hosting
```

## 5. デプロイ後の設定

### 5.1 Functions URL の確認

```bash
firebase functions:list
```

出力例:
```
┌───────────┬────────────────────────────────────────────────┬────────┐
│ Function  │ URL                                            │ Region │
├───────────┼────────────────────────────────────────────────┼────────┤
│ apply     │ https://asia-northeast1-l-apply.cloudfun...   │ asia-  │
│ webhook   │ https://asia-northeast1-l-apply.cloudfun...   │ asia-  │
│ remind    │ (scheduled)                                    │ asia-  │
└───────────┴────────────────────────────────────────────────┴────────┘
```

### 5.2 LINE Developers Console の更新

#### Webhook URL の設定

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. Messaging API 設定画面へ
3. **Webhook URL** を更新:
   ```
   https://asia-northeast1-l-apply.cloudfunctions.net/webhook
   ```
4. 「検証」ボタンで接続確認
5. 「Webhook の利用」を有効化

#### LIFF Endpoint URL の確認

1. LIFF タブへ
2. **Endpoint URL** が正しいか確認:
   ```
   https://l-apply.web.app/liff/apply
   ```

### 5.3 リッチメニューの設定

リッチメニューに LIFF URL を設定:

```
https://liff.line.me/YOUR_LIFF_ID
```

## 6. 動作確認

### 6.1 LIFF 申込フロー

1. LINE アプリでボットを友だち追加
2. リッチメニューの「申込」をタップ
3. LIFF アプリが起動
4. フォームに入力して送信
5. トークに完了メッセージが届くことを確認

### 6.2 Webhook コマンド

トークで以下のコマンドを送信:

- `予約確認` → 現在の予約を表示
- `配信停止` → 通知停止メッセージ
- `再開` → 通知再開メッセージ
- `キャンセル` → キャンセル確認メッセージ

### 6.3 リマインド送信テスト

1. 申込時に **5分後** の日時を設定
2. Firebase Console → Functions → Logs でリマインド送信ログを確認
3. LINE トークでリマインドメッセージを受信

## 7. ログとモニタリング

### 7.1 Functions ログの確認

```bash
# リアルタイムログ
firebase functions:log

# 特定の Function
firebase functions:log --only apply
firebase functions:log --only webhook
firebase functions:log --only remind
```

### 7.2 Firebase Console でのモニタリング

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「l-apply」を選択
3. Functions → ダッシュボード で以下を確認:
   - 実行回数
   - エラー率
   - 実行時間

### 7.3 Firestore データの確認

Firebase Console → Firestore Database で以下を確認:

- `line_users`: ユーザー登録状況
- `applications`: 申込データ
- `reminders`: リマインド送信状況（`sentAt` フィールド）

## 8. トラブルシューティング

### Functions デプロイエラー

**エラー**: `Secrets not found`

```bash
# Secrets を再設定
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
firebase functions:secrets:set LINE_CHANNEL_SECRET
firebase functions:secrets:set LIFF_ID
```

**エラー**: `Build failed`

```bash
cd functions
npm run build
# エラーを確認して修正
```

### Webhook が動作しない

**確認事項**:
1. Webhook URL が正しいか
2. 署名検証が有効か
3. Functions ログでエラー確認

```bash
firebase functions:log --only webhook
```

**デバッグ**:
```bash
# webhook Function のテスト
curl -X POST https://asia-northeast1-l-apply.cloudfunctions.net/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
```

### LIFF が開かない

**確認事項**:
1. LIFF ID が正しいか (.env.local)
2. Endpoint URL が正しいか
3. LIFF アプリが LINE にログインしているか

**デバッグ**:
ブラウザの開発者ツール → Console でエラー確認

### リマインドが送信されない

**確認事項**:
1. Scheduled Function が有効か
   ```bash
   firebase functions:list
   ```

2. Firestore インデックスが作成されているか
   - Firebase Console → Firestore → インデックス

3. `scheduledAt` が過去の日時になっているか

4. `consent=true` になっているか

**デバッグ**:
```bash
firebase functions:log --only remind
```

## 9. 本番環境の最適化

### 9.1 Scheduled Function の頻度調整

`functions/src/remind.ts` を編集:

```typescript
export const remind = onSchedule(
  {
    schedule: 'every 1 minute',  // 5分 → 1分に変更
    // ...
  },
  // ...
);
```

再デプロイ:
```bash
firebase deploy --only functions:remind
```

### 9.2 CORS 制限

`functions/src/apply.ts` を編集:

```typescript
onRequest({
  cors: {
    origin: ['https://l-apply.web.app', 'https://liff.line.me'],
    methods: ['POST'],
  },
  // ...
})
```

### 9.3 Functions のリージョン最適化

日本のユーザーが多い場合は `asia-northeast1` (東京) を使用（既に設定済み）。

## 10. ステージング環境

### 10.1 ステージング用 Firebase プロジェクトの作成

```bash
# 新しいプロジェクトを作成
firebase projects:create l-apply-staging

# .firebaserc に追加
firebase use --add
# プロンプトで "l-apply-staging" を選択
# エイリアスを "staging" に設定
```

### 10.2 ステージング環境へのデプロイ

```bash
# ステージングに切り替え
firebase use staging

# デプロイ
firebase deploy

# 本番に戻す
firebase use default
```

## 11. CI/CD の設定（オプション）

### GitHub Actions の例

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm ci
          cd functions && npm ci

      - name: Run tests
        run: cd functions && npm test

      - name: Build
        run: |
          npm run build
          cd functions && npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: l-apply
```

## 12. セキュリティチェックリスト

デプロイ前に以下を確認:

- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] 本番の API キーが環境変数に設定されている
- [ ] Firestore セキュリティルールが有効
- [ ] LINE Webhook 署名検証が有効
- [ ] CORS 設定が適切
- [ ] Functions の認証が正しく機能している

## 次のステップ

- [README.md](./README.md) でプロジェクト概要を確認
- [ARCHITECTURE.md](./ARCHITECTURE.md) でシステム設計を理解
- ユーザーフィードバックを収集
- 機能拡張の計画

---

デプロイが完了しました！🎉

問題が発生した場合は、Firebase Console のログを確認するか、[SETUP.md](./SETUP.md) を再確認してください。
