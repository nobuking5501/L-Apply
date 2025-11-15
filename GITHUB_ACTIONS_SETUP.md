# GitHub Actions セットアップ手順

## GitHub Actionsワークフローの追加

ローカルからのプッシュではworkflowスコープが必要なため、GitHub UIから直接作成します。

### 手順

1. **GitHubリポジトリにアクセス**
   - https://github.com/nobuking5501/L-Apply

2. **Actionsタブを開く**
   - 上部メニューの「Actions」をクリック

3. **新しいワークフローを作成**
   - 「New workflow」または「set up a workflow yourself」をクリック

4. **ワークフローファイルを作成**
   - ファイル名: `.github/workflows/deploy-functions.yml`
   - 以下の内容を貼り付け：

```yaml
name: Deploy Cloud Functions

on:
  push:
    branches:
      - main
    paths:
      - 'functions/**'
      - '.github/workflows/deploy-functions.yml'

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

      - name: Deploy to Firebase Functions
        run: |
          npm install -g firebase-tools
          firebase deploy --only functions --project l-apply --token "$FIREBASE_TOKEN"
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

5. **コミット**
   - 「Commit changes」をクリック
   - Commit message: `Add GitHub Actions workflow for Cloud Functions deployment`

## Firebase Token の設定

ワークフローを作成したら、Firebase Tokenを設定します：

### 1. Firebase CI Tokenを生成

**WSLまたはローカル環境で実行：**

```bash
firebase login:ci
```

ブラウザが開き、Googleアカウントでログインします。
ターミナルに表示されるトークンをコピーします。

### 2. GitHubにシークレットを追加

1. GitHubリポジトリ: https://github.com/nobuking5501/L-Apply
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** をクリック
4. 以下を入力：
   - **Name**: `FIREBASE_TOKEN`
   - **Secret**: コピーしたトークンを貼り付け
5. **Add secret** をクリック

## テスト

1. `functions/` ディレクトリ内のファイルを変更
2. Gitにコミット・プッシュ
3. GitHub Actionsが自動的に実行されることを確認
   - https://github.com/nobuking5501/L-Apply/actions

## トラブルシューティング

### ワークフローが実行されない場合

- `functions/` ディレクトリ内のファイルが変更されているか確認
- GitHub Actionsタブでワークフローが有効になっているか確認

### デプロイが失敗する場合

- `FIREBASE_TOKEN` が正しく設定されているか確認
- ワークフローログを確認して、エラーメッセージを確認
- Firebase CLIが最新版か確認（ワークフロー内で自動インストールされます）
