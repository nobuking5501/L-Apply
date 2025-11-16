# サービスアカウント権限エラーの修正手順

## エラー内容

```
Error: Missing permissions required for functions deploy.
You must have permission iam.serviceAccounts.ActAs on service account
l-apply@appspot.gserviceaccount.com.
```

GitHub Actionsで使用しているサービスアカウントに、Cloud Functions デプロイに必要な権限が不足しています。

## 解決方法

以下の手順でサービスアカウントに必要な権限を付与します。

### 方法1: Google Cloud Console（推奨・簡単）

1. **IAM ページを開く**
   - https://console.cloud.google.com/iam-admin/iam?project=l-apply にアクセス

2. **サービスアカウントを検索**
   - 検索ボックスで「firebase-adminsdk-fbsvc」を検索
   - `firebase-adminsdk-fbsvc@l-apply.iam.gserviceaccount.com` を見つける

3. **権限を編集**
   - サービスアカウントの右側にある「編集」（鉛筆アイコン）をクリック

4. **以下のロールを追加**
   - 「別のロールを追加」をクリックし、以下のロールを1つずつ追加：

   ✅ **Service Account User**
   - ロール: `roles/iam.serviceAccountUser`
   - 説明: サービスアカウントとして操作する権限

   ✅ **Cloud Functions Admin**
   - ロール: `roles/cloudfunctions.admin`
   - 説明: Cloud Functionsの完全な管理権限

   ✅ **Firebase Admin**
   - ロール: `roles/firebase.admin`
   - 説明: Firebaseリソースの完全な管理権限

5. **保存**
   - 「保存」ボタンをクリック

### 方法2: Firebase CLI（コマンドライン）

ローカル環境で以下のコマンドを実行：

```bash
# Firebaseプロジェクトを確認
firebase projects:list

# デフォルトのプロジェクトApp Engineサービスアカウントに権限を付与
firebase functions:config:set \
  runtime.serviceAccount=firebase-adminsdk-fbsvc@l-apply.iam.gserviceaccount.com
```

### 方法3: gcloud CLI（最も詳細）

gcloud CLIがインストールされている場合：

```bash
# プロジェクトを設定
gcloud config set project l-apply

# Service Account Userロールを付与
gcloud projects add-iam-policy-binding l-apply \
  --member="serviceAccount:firebase-adminsdk-fbsvc@l-apply.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Cloud Functions Adminロールを付与
gcloud projects add-iam-policy-binding l-apply \
  --member="serviceAccount:firebase-adminsdk-fbsvc@l-apply.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"

# Firebase Adminロールを付与
gcloud projects add-iam-policy-binding l-apply \
  --member="serviceAccount:firebase-adminsdk-fbsvc@l-apply.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# 付与された権限を確認
gcloud projects get-iam-policy l-apply \
  --flatten="bindings[].members" \
  --filter="bindings.members:firebase-adminsdk-fbsvc@l-apply.iam.gserviceaccount.com"
```

## 設定後の確認

### 1. GitHub Actionsで再デプロイ

権限を付与したら、GitHub Actionsで再度デプロイを実行：

1. https://github.com/nobuking5501/L-Apply/actions にアクセス
2. **Deploy Cloud Functions** ワークフローを選択
3. **Run workflow** をクリック
4. **Run workflow** ボタンをクリック

### 2. ログを確認

デプロイが成功すると、以下のようなメッセージが表示されます：

```
✔  Deploy complete!

Functions deployed:
  - webhook: https://asia-northeast1-l-apply.cloudfunctions.net/webhook
  - apply: https://asia-northeast1-l-apply.cloudfunctions.net/apply
```

## トラブルシューティング

### まだエラーが出る場合

**権限の反映に時間がかかる場合があります（最大5分）**
- 少し待ってから再度デプロイを試してください

**それでもエラーが出る場合**
- 以下のロールが全て付与されているか確認：
  - Service Account User
  - Cloud Functions Admin
  - Firebase Admin

**その他のエラーの場合**
- GitHub Actionsのログを確認
- Firebase Consoleでプロジェクト設定を確認

## 参考リンク

- [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam?project=l-apply)
- [Firebase Console](https://console.firebase.google.com/project/l-apply/overview)
- [GitHub Actions](https://github.com/nobuking5501/L-Apply/actions)

---

権限を付与したら、このファイルの内容を確認して再度デプロイを試してください。
