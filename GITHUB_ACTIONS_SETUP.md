# GitHub Actions セットアップガイド

GitHub Actionsを使用してFirebase Functionsを自動デプロイするための設定手順です。

---

## 🚨 権限エラーの解決方法

### エラーメッセージ:
```
Error: Missing permissions required for functions deploy.
You must have permission iam.serviceAccounts.ActAs on service account
```

### 原因:
Firebase service accountに必要な権限が付与されていない

---

## ✅ 解決手順

### 方法1: Firebase Console で権限を追加（推奨）

1. **Firebase Console を開く**
   ```
   https://console.cloud.google.com/iam-admin/iam?project=l-apply
   ```

2. **Service Accountを見つける**
   - メールアドレス: `l-apply@appspot.gserviceaccount.com`

3. **ロールを追加**
   - 「編集」ボタンをクリック
   - 以下のロールを追加:
     - ✅ **Service Account User**
     - ✅ **Cloud Functions Developer**
     - ✅ **Cloud Build Service Account**

4. **保存して完了**

---

**最終更新**: 2025-11-30
