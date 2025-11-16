# Cloud Functions デプロイ（最も簡単な方法）

コマンドライン操作は一切不要です！ブラウザだけで完了します。

## ステップ1: サービスアカウントキーを取得（2分）

### 1-1. Firebase Consoleを開く
https://console.firebase.google.com/project/l-apply/settings/serviceaccounts/adminsdk

### 1-2. 鍵を生成
1. 「新しい秘密鍵の生成」ボタンをクリック
2. 確認ダイアログで「鍵を生成」をクリック
3. JSONファイルがダウンロードされます

### 1-3. JSONの内容をコピー
1. ダウンロードした `l-apply-xxxxx.json` をメモ帳で開く
2. 全ての内容を選択（Ctrl+A）
3. コピー（Ctrl+C）

## ステップ2: GitHubにシークレットを追加（1分）

### 2-1. GitHubのSecrets設定を開く
https://github.com/nobuking5501/L-Apply/settings/secrets/actions

### 2-2. シークレットを追加
1. 「New repository secret」ボタンをクリック
2. 以下を入力：
   - **Name（名前）**: FIREBASE_SERVICE_ACCOUNT
   - **Secret（値）**: コピーしたJSON全体を貼り付け
3. 「Add secret」ボタンをクリック

## ステップ3: GitHub Actionsワークフローを作成（3分）

### 3-1. 新しいファイルを作成
1. https://github.com/nobuking5501/L-Apply にアクセス
2. 「Add file」→「Create new file」をクリック

### 3-2. ファイル名を入力
ファイル名欄に以下を入力（コピペ）：
```
.github/workflows/deploy-functions.yml
```

### 3-3. コードをコピー＆ペースト
以下のコード全体をコピーして、ファイルに貼り付け：

```yaml
name: Deploy Cloud Functions

on:
  push:
    branches:
      - main
    paths:
      - 'functions/**'
      - '.github/workflows/deploy-functions.yml'
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Firebase
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: functions/package-lock.json

      - name: Install dependencies
        run: |
          cd functions
          npm ci

      - name: Build functions
        run: |
          cd functions
          npm run build

      - name: Authenticate with Firebase
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}

      - name: Deploy to Firebase Functions
        run: |
          npm install -g firebase-tools
          firebase deploy --only functions --project l-apply
```

### 3-4. コミット
1. ページの一番下までスクロール
2. 「Commit changes」ボタンをクリック
3. 確認ダイアログで「Commit changes」を再度クリック

## ステップ4: デプロイを確認（5分）

### 4-1. GitHub Actionsを開く
https://github.com/nobuking5501/L-Apply/actions

### 4-2. ワークフローの実行を確認
- 「Deploy Cloud Functions」という名前のワークフローが実行中のはずです
- クリックして進行状況を確認

### 4-3. 完了を待つ
- 通常3-5分で完了します
- ✅ 緑のチェックマークが表示されたら成功！
- ❌ 赤いXが表示されたら、クリックしてエラーログを確認

## 🎉 完了確認

デプロイが成功したら、以下で確認できます：

### フロントエンド
https://l-apply.web.app

### Cloud Functions
```bash
firebase functions:list
```

以下が表示されればOK：
- apply
- webhook
- remind
- deliverSteps

## 🔧 トラブルシューティング

### ワークフローが失敗する場合

**エラー**: "Error: Unable to detect a Project Id"
→ FIREBASE_SERVICE_ACCOUNT が正しく設定されていません
→ ステップ1からやり直してください

**エラー**: "Error: HTTP Error: 403"
→ サービスアカウントに権限がありません
→ Firebase Console → IAM で権限を確認

### ワークフローが実行されない場合

**原因**: functionsディレクトリが変更されていない

**解決策**: 手動で実行
1. https://github.com/nobuking5501/L-Apply/actions
2. 「Deploy Cloud Functions」をクリック
3. 「Run workflow」→「Run workflow」をクリック

## ✨ 成功後

今後は `functions/` ディレクトリを変更してGitにプッシュするだけで、自動的にデプロイされます！

```bash
git add functions/
git commit -m "Update functions"
git push origin main
```

→ GitHub Actionsが自動的にデプロイ！
