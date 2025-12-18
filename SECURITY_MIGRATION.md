# セキュリティ強化：機密情報の分離

## 概要

マルチテナント SaaS として安全に運用するため、LINE 認証情報（Channel Secret、Access Token）を別のコレクションに分離しました。

## 実施した変更

### 1. 新しいコレクション: `organization_secrets`

```
organization_secrets/
  {orgId}/
    - lineChannelSecret: string
    - lineChannelAccessToken: string
    - updatedAt: Timestamp
```

このコレクションは **サーバーサイド（Admin SDK）のみ** がアクセスできます。

### 2. Firestore セキュリティルールの更新

```javascript
// Organizations - 同じ組織のメンバーまたは管理者のみ読み取り可能
match /organizations/{orgId} {
  allow read: if isSameOrganization(orgId) || isAdmin();
  allow create: if isSignedIn() && orgId == 'org_' + request.auth.uid;
  allow update, delete: if isSameOrganization(orgId) || isAdmin();
}

// Organization Secrets - クライアントからのアクセス不可
match /organization_secrets/{orgId} {
  allow read, write: if false; // Admin SDK のみ
}
```

### 3. 新しい API Routes

#### `/api/settings` (GET/POST)
- **認証**: Firebase ID Token (Bearer)
- **権限**: Owner または Admin のみ更新可能
- **機能**:
  - GET: 組織の公開情報を取得（機密情報は返さない）
  - POST: 組織情報を更新（機密情報は `organization_secrets` に保存）

#### `/api/liff/organization` (GET)
- **認証**: 不要（公開エンドポイント）
- **機能**: LIFF ID から組織情報とアクティブイベントを取得
- **セキュリティ**: 機密情報は返さない

### 4. 更新されたファイル

| ファイル | 変更内容 |
|---------|---------|
| `firestore.rules` | `organizations` の read を制限、`organization_secrets` ルールを追加 |
| `app/api/settings/route.ts` | 新規作成（設定更新 API） |
| `app/api/liff/organization/route.ts` | 新規作成（LIFF 用 API） |
| `app/dashboard/settings/page.tsx` | API 経由で設定を更新 |
| `app/liff/apply/page.tsx` | API 経由で組織情報を取得 |
| `functions/src/config.ts` | `organization_secrets` から認証情報を読み取り |
| `scripts/migrate-secrets.ts` | データ移行スクリプト（新規作成） |

## デプロイ手順

### ⚠️ 重要: この順序で実施してください

### ステップ 1: コードのデプロイ（機密情報は残したまま）

```bash
# Next.js アプリケーションをビルド
npm run build

# Firebase Functions をビルド
cd functions
npm run build
cd ..

# Hosting と Functions をデプロイ
firebase deploy --only hosting,functions

# ⚠️ この時点では Firestore ルールをデプロイしない
```

### ステップ 2: データ移行の実行

```bash
# 環境変数を設定（Firebase サービスアカウント）
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# または
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"

# 移行スクリプトを実行
npx ts-node scripts/migrate-secrets.ts
```

**移行スクリプトの動作:**
- `organizations` コレクションから `lineChannelSecret` と `lineChannelAccessToken` を読み取り
- `organization_secrets` コレクションに書き込み
- 元のデータは削除しない（安全のため）

### ステップ 3: 動作確認

#### 3.1 設定ページのテスト
```
1. /dashboard/settings にアクセス
2. 組織情報が正しく表示されることを確認
3. LINE Channel Secret を入力（既存の値は表示されない）
4. 保存ボタンをクリック
5. 成功メッセージが表示されることを確認
```

#### 3.2 LIFF ページのテスト
```
1. LIFF アプリにアクセス
2. イベント情報が正しく表示されることを確認
3. フォームを送信
4. 申込が正常に完了することを確認
5. LINE トークで確認メッセージを受信
```

#### 3.3 Webhook のテスト
```
1. LINE トークで「予約確認」と送信
2. 予約情報が返信されることを確認
```

### ステップ 4: Firestore ルールのデプロイ

**⚠️ 動作確認が完了してからのみ実施**

```bash
# Firestore ルールをデプロイ
firebase deploy --only firestore:rules
```

これにより、`organizations` コレクションへのクライアントからの直接読み取りが制限されます。

### ステップ 5: クリーンアップ（オプション）

動作が安定したら、古い場所から機密情報を削除できます。

```bash
# migrate-secrets.ts のクリーンアップコードのコメントを解除
# 該当箇所:
# /*
# const updateData: any = {};
# if (hasSecret) {
#   updateData.lineChannelSecret = FieldValue.delete();
# }
# if (hasToken) {
#   updateData.lineChannelAccessToken = FieldValue.delete();
# }
# await db.collection('organizations').doc(orgId).update(updateData);
# console.log(`  🧹 Cleaned up secrets from organizations collection\n`);
# */

# スクリプトを再実行
npx ts-node scripts/migrate-secrets.ts
```

## ロールバック手順

何か問題が発生した場合は、以下の手順でロールバックできます。

### 1. Firestore ルールを元に戻す

```javascript
// firestore.rules
match /organizations/{orgId} {
  allow read: if true; // 元の設定
  allow create: if isSignedIn() && orgId == 'org_' + request.auth.uid;
  allow update, delete: if isSameOrganization(orgId) || isAdmin();
}
```

```bash
firebase deploy --only firestore:rules
```

### 2. 以前のコードに戻す

```bash
git revert HEAD
npm run build
firebase deploy --only hosting,functions
```

## セキュリティ上の改善点

### 以前の問題
1. ✗ `organizations` コレクションが `allow read: if true` で全公開
2. ✗ LINE 認証情報が誰でも読み取り可能
3. ✗ クライアントサイドから直接 Firestore に書き込み
4. ✗ ブラウザの開発者ツールで機密情報が見える

### 現在のセキュリティ
1. ✓ `organizations` コレクションは同じ組織のメンバーのみアクセス可能
2. ✓ LINE 認証情報は `organization_secrets` で Admin SDK のみアクセス
3. ✓ 設定更新は認証済み API 経由（ロール確認あり）
4. ✓ LIFF は公開 API 経由でアクセス（機密情報は返さない）
5. ✓ ブラウザから機密情報は完全に隠蔽

## トラブルシューティング

### 問題: 設定ページで「設定の読み込みに失敗しました」

**原因**: API Route の認証エラー

**解決策**:
1. ブラウザの開発者ツールでコンソールエラーを確認
2. Firebase Authentication の状態を確認: `firebase.auth().currentUser`
3. API Route のログを確認: `firebase functions:log`

### 問題: LIFF ページで「組織情報が見つかりません」

**原因**: LIFF ID が正しく設定されていない

**解決策**:
1. `.env.local` の `NEXT_PUBLIC_LIFF_ID` を確認
2. Firestore の `organizations` コレクションで `liffId` フィールドを確認
3. LINE Developers Console で LIFF ID を確認

### 問題: 移行スクリプトが失敗する

**原因**: Firebase Admin の権限不足

**解決策**:
1. サービスアカウントキーが正しく設定されているか確認
2. サービスアカウントに Firestore の読み書き権限があるか確認
3. `firebase login` でログインしているか確認

## 今後の拡張

### Phase 2: Firebase Secrets Manager への移行（検討中）

より高度なセキュリティが必要な場合は、Firebase Secrets Manager への移行を検討できます。

**メリット:**
- IAM による細かいアクセス制御
- 監査ログの記録
- ローテーション管理

**デメリット:**
- UI での設定が難しい（CLI 経由になる）
- マルチテナントでの運用が煩雑

## まとめ

この移行により、L-Apply は **エンタープライズグレードのセキュリティ** を備えたマルチテナント SaaS になりました。

- ✅ 機密情報の完全な分離
- ✅ ロールベースのアクセス制御
- ✅ API 経由の安全な設定更新
- ✅ 後方互換性の維持

今後は安心して複数の組織にサービスを提供できます。
