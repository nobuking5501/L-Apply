# GitHub Secrets セットアップガイド

GitHub ActionsでCloud Functionsを自動デプロイするには、GitHubリポジトリにFirebaseサービスアカウントキーを設定する必要があります。

## 必要なSecret

- `FIREBASE_SERVICE_ACCOUNT`: Firebaseサービスアカウントの認証情報（JSON形式）

## セットアップ手順

### 1. Firebaseサービスアカウントキーを取得

#### 方法A: Firebase Console（推奨）

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「L-Apply」を選択
3. 左上の歯車アイコン → **プロジェクトの設定** をクリック
4. **サービス アカウント** タブを選択
5. **新しい秘密鍵の生成** ボタンをクリック
6. 確認ダイアログで **キーを生成** をクリック
7. JSONファイルがダウンロードされます（例: `l-apply-xxxxx.json`）

#### 方法B: gcloud CLI

```bash
# Google Cloudプロジェクトを設定
gcloud config set project l-apply

# サービスアカウントを作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy"

# 必要なロールを付与
gcloud projects add-iam-policy-binding l-apply \
  --member="serviceAccount:github-actions@l-apply.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# キーを生成
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=github-actions@l-apply.iam.gserviceaccount.com
```

### 2. GitHubリポジトリにSecretを追加

1. ダウンロードしたJSONファイルをテキストエディタで開く
2. JSONの内容全体をコピー（`{` から `}` まで）
3. GitHubのリポジトリページ（https://github.com/nobuking5501/L-Apply）にアクセス
4. **Settings** タブをクリック
5. 左サイドバーの **Secrets and variables** → **Actions** をクリック
6. **New repository secret** ボタンをクリック
7. 以下を入力：
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Secret**: コピーしたJSON全体を貼り付け
8. **Add secret** をクリック

### 3. ローカルファイルの削除

セキュリティのため、ダウンロードしたJSONファイルは削除してください：

```bash
rm l-apply-*.json
# または
rm service-account-key.json
```

### 4. 設定の確認

GitHub Actionsワークフローが正しく設定されているか確認：

```bash
cat .github/workflows/deploy-functions.yml
```

以下の記述があることを確認：
```yaml
- name: Authenticate with Firebase
  uses: google-github-actions/auth@v2
  with:
    credentials_json: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
```

## サービスアカウントキーの管理

### 有効期限

サービスアカウントキーには有効期限はありませんが、セキュリティのため定期的にローテーションすることを推奨します。

### キーのローテーション（推奨: 3〜6ヶ月ごと）

1. 上記の手順1で新しいキーを生成
2. GitHub Secretsを更新（既存のSecretを編集）
3. Firebase Consoleで古いキーを削除

## セキュリティ上の注意

- トークンは**絶対に**コードにコミットしないでください
- トークンは**絶対に**公開しないでください
- GitHub Secretsに保存されたトークンは暗号化され、安全に管理されます
- トークンが漏洩した場合は、すぐに新しいトークンを発行して古いトークンを無効化してください

## 自動デプロイのトリガー

GitHub Secretsを設定すると、以下の条件で自動デプロイが実行されます：

- `main` ブランチへのpush時
- `functions/` ディレクトリ内のファイルが変更された場合
- `.github/workflows/deploy-functions.yml` が変更された場合

デプロイの進行状況は、GitHubの **Actions** タブで確認できます。

## トラブルシューティング

### デプロイが失敗する場合

1. GitHub Actionsの **Actions** タブでエラーログを確認
2. トークンが正しく設定されているか確認
3. Firebaseプロジェクト（l-apply）へのアクセス権限があるか確認
4. トークンの有効期限が切れていないか確認

### トークンの再発行が必要な場合

```bash
# 古いトークンをログアウト
firebase logout

# 新しいトークンを発行
firebase login:ci
```

---

**次のステップ**: トークンを設定したら、`git push` でコードをプッシュして自動デプロイをテストしてください。
