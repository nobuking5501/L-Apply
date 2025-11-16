# サービスアカウントに権限を追加する方法

## 方法1: 既存のサービスアカウントに権限を追加（推奨）

### 手順

1. **Google Cloud IAMを開く**
   https://console.cloud.google.com/iam-admin/iam?project=l-apply

2. **サービスアカウントを見つける**
   - メールアドレスが `@appspot.gserviceaccount.com` で終わるものを探す
   - または `firebase-adminsdk` を探す

3. **編集アイコン（鉛筆）をクリック**
   - サービスアカウントの右側にあります

4. **以下のロールを追加**

   **ロール1**: Service Account User
   - 「別のロールを追加」をクリック
   - 「Service Account User」を検索して選択

   **ロール2**: Cloud Functions Admin
   - 「別のロールを追加」をクリック
   - 「Cloud Functions Admin」を検索して選択

   **ロール3**: Firebase Admin（既にあるはず）
   - なければ追加

5. **保存**
   - 「保存」ボタンをクリック

---

## 方法2: 新しいサービスアカウントを作成（代替案）

### 手順

1. **サービスアカウントページを開く**
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=l-apply

2. **「サービスアカウントを作成」をクリック**

3. **サービスアカウントの詳細**
   - 名前: `github-actions-deploy`
   - ID: 自動生成されます
   - 「作成して続行」をクリック

4. **ロールを付与**

   以下のロールを追加：
   - Firebase Admin
   - Cloud Functions Admin
   - Service Account User

   「続行」をクリック

5. **完了**
   - 「完了」をクリック

6. **鍵を作成**
   - 作成したサービスアカウントをクリック
   - 「鍵」タブをクリック
   - 「鍵を追加」→「新しい鍵を作成」
   - 「JSON」を選択
   - 「作成」をクリック
   - JSONファイルがダウンロードされます

7. **GitHubのシークレットを更新**
   - https://github.com/nobuking5501/L-Apply/settings/secrets/actions
   - `FIREBASE_SERVICE_ACCOUNT` を削除
   - 新しく追加：Name=`FIREBASE_SERVICE_ACCOUNT`, Secret=ダウンロードしたJSON

---

## 🔄 権限追加後

GitHubでワークフローを再実行：

1. https://github.com/nobuking5501/L-Apply/actions
2. 失敗したワークフローをクリック
3. 「Re-run all jobs」をクリック

---

## ✅ 成功の確認

ワークフローが成功したら、以下で確認：

```bash
firebase functions:list
```

以下の関数が表示されればOK：
- apply
- webhook
- remind
- deliverSteps
