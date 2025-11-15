# Vercel移行手順書

このドキュメントは、L-ApplyをFirebase HostingからVercelに移行する手順を説明します。

## 📋 移行概要

- **フロントエンド**: Firebase Hosting → Vercel
- **バックエンド**: Cloud Functions → GitHub Actions経由でデプロイ
- **データベース**: Firestore（変更なし）

## ✅ 事前準備完了項目

- [x] GitHub Actionsワークフロー作成（`.github/workflows/deploy-functions.yml`）
- [x] Vercel設定ファイル作成（`vercel.json`, `.vercelignore`）
- [x] 不要なCloud Functionsファイルの削除

## 🚀 移行手順

### 1. GitHubにFirebase Tokenを設定

```bash
# Firebase CI Tokenを生成（ローカルで実行）
firebase login:ci
```

生成されたトークンをコピーして：

1. GitHubリポジトリ: https://github.com/nobuking5501/L-Apply
2. Settings → Secrets and variables → Actions
3. 「New repository secret」をクリック
4. Name: `FIREBASE_TOKEN`
5. Secret: 上記でコピーしたトークンを貼り付け
6. 「Add secret」をクリック

### 2. Vercelプロジェクトのセットアップ

1. **Vercelにログイン**: https://vercel.com
2. **New Project**をクリック
3. **Import Git Repository**: `nobuking5501/L-Apply`を選択
4. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `./`（デフォルト）
   - Build Command: `npm run build`（デフォルト）
   - Output Directory: `.next`（デフォルト）

### 3. Vercelに環境変数を設定

Vercelダッシュボード → Settings → Environment Variables で以下を追加：

#### Next.js（フロントエンド）用

```
NEXT_PUBLIC_LIFF_ID=2008405494-nKEy7Pl0
NEXT_PUBLIC_APP_NAME=L-Apply
NEXT_PUBLIC_APPLY_API_URL=https://asia-northeast1-l-apply.cloudfunctions.net/apply
```

#### Firebase Config用

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD5R_EwSLznU1TZxPP3w8EHA1iopYDzhZI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=l-apply.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=l-apply
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=l-apply.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1076344687205
NEXT_PUBLIC_FIREBASE_APP_ID=1:1076344687205:web:313e0215b6defd2b11d48c
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-KN8JRX4LN6
```

**重要**: すべての環境変数を「Production」「Preview」「Development」全てにチェックを入れてください。

### 4. Firebase設定を環境変数化

`lib/firebase.ts`を修正して環境変数から読み込むようにします：

```typescript
// Before: ハードコードされた設定
const firebaseConfig = {
  apiKey: "AIzaSyD5R_EwSLznU1TZxPP3w8EHA1iopYDzhZI",
  // ...
};

// After: 環境変数から読み込み
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};
```

### 5. Cloud Functionsのデプロイテスト

変更をGitにプッシュして、GitHub Actionsが自動的にCloud Functionsをデプロイすることを確認：

```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

GitHubで確認：
- https://github.com/nobuking5501/L-Apply/actions
- 「Deploy Cloud Functions」ワークフローが実行されていることを確認

### 6. Vercelデプロイの確認

1. Vercelダッシュボードで「Deployments」タブを確認
2. デプロイが成功したら、プレビューURLをクリック
3. アプリケーションが正常に動作することを確認

### 7. LIFFアプリのエンドポイント更新

LINE Developers Console:
1. https://developers.line.biz/console/
2. 該当のLIFFアプリを選択
3. Endpoint URL を Vercel の本番URLに変更
   - 例: `https://l-apply.vercel.app/liff/apply`

### 8. カスタムドメインの設定（オプション）

Vercelダッシュボード → Settings → Domains で独自ドメインを追加できます。

## 🔍 動作確認チェックリスト

- [ ] フロントエンド（Next.js）が正常に表示される
- [ ] LIFFアプリケーションが正常に動作する
- [ ] 申込機能が正常に動作する
- [ ] 管理画面（Dashboard）にログインできる
- [ ] Cloud Functions（apply, webhook, remind, deliverSteps）が正常に動作する
- [ ] LINEメッセージの送受信が正常に動作する

## ⚠️ トラブルシューティング

### GitHub Actionsのデプロイが失敗する場合

1. `FIREBASE_TOKEN`が正しく設定されているか確認
2. `functions/`ディレクトリの変更を含むコミットをプッシュしているか確認
3. GitHub Actionsのログを確認: https://github.com/nobuking5501/L-Apply/actions

### Vercelデプロイが失敗する場合

1. 環境変数が全て正しく設定されているか確認
2. Vercelのデプロイログを確認
3. ローカルで `npm run build` が成功するか確認

### LIFFアプリが動作しない場合

1. LINE Developers ConsoleのEndpoint URLが正しいか確認
2. Vercelの環境変数 `NEXT_PUBLIC_LIFF_ID` が正しいか確認
3. ブラウザのコンソールでエラーを確認

## 📝 今後のデプロイフロー

### フロントエンドの更新

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

→ Vercelが自動的にデプロイ

### Cloud Functionsの更新

```bash
# functions/ディレクトリ内のファイルを変更
git add functions/
git commit -m "Update Cloud Functions"
git push origin main
```

→ GitHub Actionsが自動的にデプロイ

## 🔐 セキュリティ注意事項

- **絶対に** `.env.local` や `functions/.env` をGitにコミットしないでください
- API KeyやTokenは全て環境変数として設定してください
- 本番環境の認証情報は厳重に管理してください

## 📞 サポート

問題が発生した場合は、以下を確認してください：
- GitHub Actions ログ
- Vercel デプロイログ
- Firebase Functions ログ: `firebase functions:log`
