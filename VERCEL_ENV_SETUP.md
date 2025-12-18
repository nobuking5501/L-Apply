# Vercel環境変数設定ガイド

## 📋 設定が必要な環境変数

以下の環境変数を [Vercel Dashboard](https://vercel.com/nobuking5501-gmailcoms-projects/l-apply/settings/environment-variables) に設定してください。

---

## 1️⃣ Firebase Web SDK（公開）

これらは `NEXT_PUBLIC_` で始まるため、ブラウザからアクセス可能です。

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_APP_NAME` | `L-Apply` |
| `NEXT_PUBLIC_APPLY_API_URL` | `https://asia-northeast1-l-apply.cloudfunctions.net/apply` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyD5R_EwSLznU1TZxPP3w8EHA1iopYDzhZI` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `l-apply.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `l-apply` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `l-apply.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1076344687205` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:1076344687205:web:313e0215b6defd2b11d48c` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-KN8JRX4LN6` |

---

## 2️⃣ Stripe

| 変数名 | 値 |
|--------|-----|
| `STRIPE_SECRET_KEY` | Vercel Dashboardで既に設定済み |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Vercel Dashboardで既に設定済み |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboardで取得してください |

---

## 3️⃣ Firebase Admin SDK（重要！）🔥

### `FIREBASE_SERVICE_ACCOUNT`

この環境変数は**最も重要**です。これがないとAPI Routesが動作しません。

#### 取得方法：

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. **l-apply** プロジェクトを選択
3. ⚙️ **プロジェクトの設定** をクリック
4. **サービスアカウント** タブを開く
5. 「**新しい秘密鍵の生成**」ボタンをクリック
6. JSONファイルがダウンロードされます

#### JSONファイルの内容（例）：
```json
{
  "type": "service_account",
  "project_id": "l-apply",
  "private_key_id": "xxxxx...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@l-apply.iam.gserviceaccount.com",
  "client_id": "xxxxx...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40l-apply.iam.gserviceaccount.com"
}
```

#### Vercelに設定：

1. Vercel Dashboard → **l-apply** → **Settings** → **Environment Variables**
2. **Add** ボタンをクリック
3. **Name**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value**: ダウンロードしたJSONファイルの**全内容**をコピー＆ペースト
5. **Environment**: **Production**, **Preview**, **Development** すべてにチェック
6. **Save**

---

## 4️⃣ その他（オプション）

| 変数名 | 値 |
|--------|-----|
| `ADMIN_SECRET` | `your-secure-admin-secret-change-this` |
| `NEXT_PUBLIC_ADMIN_SECRET` | `your-secure-admin-secret-change-this` |
| `FIREBASE_PROJECT_ID` | `l-apply` |
| `GOOGLE_CLOUD_PROJECT` | `l-apply` |

---

## ✅ 設定手順（まとめ）

### ステップ1: Vercel Dashboardを開く

https://vercel.com/nobuking5501-gmailcoms-projects/l-apply/settings/environment-variables

### ステップ2: 環境変数を追加

上記の表を見ながら、**Add** ボタンで1つずつ追加してください。

**重要なポイント：**
- すべての環境変数で **Production**, **Preview**, **Development** にチェック
- `FIREBASE_SERVICE_ACCOUNT` は必ずJSONファイル全体をコピー

### ステップ3: 再デプロイ

環境変数を追加しただけでは反映されません。再デプロイが必要です。

#### 方法A: Vercel Dashboardで再デプロイ
1. Vercel Dashboard → **l-apply** → **Deployments**
2. 最新のデプロイメントの右側にある「⋯」メニューをクリック
3. **Redeploy** をクリック

#### 方法B: CLIで再デプロイ
```bash
cd /mnt/c/Users/user/Desktop/L-Apply
vercel --prod
```

---

## 🧪 テスト

再デプロイ後、以下をテストしてください：

1. **設定ページ**: https://l-apply.vercel.app/dashboard/settings
   - 設定を保存できるか確認

2. **LIFF URL**: https://liff.line.me/2008405494-nKEy7Pl0
   - エラーが出ないか確認

---

## ❓ トラブルシューティング

### Q: 環境変数を追加したのにエラーが出る

A: **再デプロイ**しましたか？環境変数の変更は再デプロイしないと反映されません。

### Q: `FIREBASE_SERVICE_ACCOUNT` の値が長すぎる

A: 正常です。JSONファイル全体（改行含む）をそのままペーストしてください。

### Q: どの環境変数が最も重要？

A: 優先順位は以下の通り：
1. **`FIREBASE_SERVICE_ACCOUNT`** ← 最重要！
2. `NEXT_PUBLIC_FIREBASE_*` ← これらがないとログインできない
3. その他

---

**最終更新**: 2025-12-18
