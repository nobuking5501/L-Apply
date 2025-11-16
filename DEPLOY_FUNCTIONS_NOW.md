# Cloud Functions デプロイ手順（今すぐ実行）

フロントエンドは既にデプロイ済みです！
次はCloud Functionsをデプロイしましょう。

## ステップ1: Firebase Tokenを生成 ⏱️ 2分

### Windows PowerShellまたはコマンドプロンプトを開く

**重要**: WSLではなく、Windowsのネイティブターミナルを使用してください！

1. **Windowsキー** を押して「cmd」または「powershell」と入力
2. コマンドプロンプトまたはPowerShellを開く
3. 以下のコマンドを実行：

```bash
firebase login:ci
```

4. ブラウザが開いてGoogleログインが表示されます
5. ログインして「許可」をクリック
6. ターミナルに**長いトークン**が表示されます
7. **このトークンをコピー**してください（重要！）

例:
```
1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ステップ2: GitHub Actionsワークフローを作成 ⏱️ 3分

### 2-1. GitHubでファイルを作成

1. **GitHubリポジトリを開く**
   - https://github.com/nobuking5501/L-Apply

2. **新しいファイルを作成**
   - 「Add file」→「Create new file」をクリック

3. **ファイル名を入力**
   - ファイル名欄に以下を入力：
   ```
   .github/workflows/deploy-functions.yml
   ```
   ※ スラッシュを入力すると自動的にフォルダが作成されます

4. **以下のコードをコピー＆ペースト**

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
   - 「Commit changes」ボタンをクリック
   - Commit message: `Add GitHub Actions workflow for Cloud Functions`
   - 「Commit changes」を再度クリック

### 2-2. Firebase Tokenをシークレットに追加

1. **GitHub Settings を開く**
   - リポジトリページで「Settings」タブをクリック

2. **Secrets を開く**
   - 左メニューの「Secrets and variables」→「Actions」

3. **新しいシークレットを追加**
   - 「New repository secret」をクリック
   - **Name**: `FIREBASE_TOKEN`
   - **Secret**: ステップ1でコピーしたトークンを貼り付け
   - 「Add secret」をクリック

## ステップ3: デプロイをトリガー ⏱️ 1分

ワークフローを実行するために、functionsディレクトリに変更を加えます：

### 方法A: GitHub UI から（簡単）

1. https://github.com/nobuking5501/L-Apply
2. `functions/src/index.ts` を開く
3. 「Edit」ボタン（鉛筆アイコン）をクリック
4. ファイルの最後に空行を1つ追加
5. 「Commit changes」をクリック

### 方法B: ローカルから（既にある場合）

```bash
cd /mnt/c/Users/user/Desktop/L-Apply
git pull origin main
touch functions/src/index.ts
git add functions/src/index.ts
git commit -m "Trigger functions deployment"
git push origin main
```

## ステップ4: デプロイを確認 ⏱️ 5分

1. **GitHub Actions を開く**
   - https://github.com/nobuking5501/L-Apply/actions

2. **ワークフローの実行を確認**
   - 「Deploy Cloud Functions」が実行中になっているはずです
   - クリックして進行状況を確認

3. **完了を待つ**
   - 通常3-5分で完了します
   - ✅ 緑のチェックマークが表示されたら成功！

4. **関数を確認**
   ```bash
   firebase functions:list
   ```

   以下が表示されればOK：
   - apply
   - webhook
   - remind
   - deliverSteps

## ステップ5: LINE動作確認 ⏱️ 2分

1. **LINEアプリを開く**
2. **LIFFアプリを開く**
   - セミナー申込のLIFFアプリ
3. **動作を確認**
   - イベント一覧が表示される
   - 申込みができる
   - 完了メッセージが届く

## 🎉 完了！

全て成功したら、以下が自動化されます：

- ✅ フロントエンド: Gitプッシュ → Firebase Hostingに自動デプロイ
- ✅ Cloud Functions: Gitプッシュ → GitHub Actionsで自動デプロイ

## ⚠️ トラブルシューティング

### ワークフローが失敗する

**原因**: FIREBASE_TOKENが正しくない

**解決策**:
1. Windowsのコマンドプロンプトで再度 `firebase login:ci` を実行
2. 新しいトークンをコピー
3. GitHub Settings → Secrets → FIREBASE_TOKEN を更新

### ワークフローが実行されない

**原因**: functionsディレクトリが変更されていない

**解決策**:
- functionsディレクトリ内の任意のファイルを変更してプッシュ

### デプロイは成功するがLINEが動かない

**原因**: Firestoreのデータが不足している可能性

**解決策**:
1. Firebase Console → Firestore
2. organizations コレクションにデータがあるか確認
3. 必要に応じてデータを追加
