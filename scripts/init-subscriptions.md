# 既存組織のサブスクリプション情報初期化ガイド

## 概要

既存の組織データにサブスクリプション情報（プラン、使用量など）を追加するためのスクリプトです。

## 実行方法

### 方法1: Firebase Functions経由（推奨）

1. **functions/src/index.ts に関数を追加**

```typescript
export { initSubscriptions } from './init-subscriptions';
```

2. **デプロイ**

```bash
cd functions
npm run deploy
```

3. **実行**

```bash
curl -X POST https://asia-northeast1-l-apply.cloudfunctions.net/initSubscriptions \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-secure-admin-secret-change-this" \
  -d '{}'
```

### 方法2: ローカルで実行

1. **Firebase Admin SDKの設定**

サービスアカウントキーが `functions/` ディレクトリにあることを確認。

2. **スクリプトを実行**

```bash
cd functions
npx ts-node -r tsconfig-paths/register src/init-subscriptions-local.ts
```

## 初期化される内容

各組織に以下の情報が追加されます:

```typescript
{
  subscription: {
    plan: 'test',              // デフォルトはテストプラン
    status: 'trial',           // トライアルステータス
    limits: {
      maxEvents: 3,
      maxStepDeliveries: 3,
      maxReminders: 3,
      maxApplicationsPerMonth: 10,
    },
    trialEndsAt: Timestamp,    // 14日後
    currentPeriodStart: Timestamp,
    currentPeriodEnd: Timestamp,
  },
  usage: {
    eventsCount: 0,
    stepDeliveriesCount: 0,
    remindersCount: 0,
    applicationsThisMonth: 0,
    lastResetAt: Timestamp,
  }
}
```

## 注意事項

1. **既存のサブスクリプション情報は上書きされません**
   - すでに `subscription` フィールドが存在する組織はスキップされます

2. **実行は1回のみ**
   - このスクリプトは既存組織の初期化のためのものです
   - 新規組織は自動的にサブスクリプション情報が設定されます

3. **バックアップ推奨**
   - 実行前に Firestore のバックアップを取ることを推奨します

## トラブルシューティング

### エラー: "Unauthorized"

管理者シークレットが正しく設定されているか確認してください:

```bash
# .env.local を確認
cat .env.local | grep ADMIN_SECRET
```

### エラー: "Organization data is empty"

組織データが正しく存在するか確認してください:

```bash
# Firebase Console で organizations コレクションを確認
```

## 実行後の確認

1. **Firebase Console でデータを確認**

```
Firestore Database > organizations > [任意の組織ID]
```

2. **管理画面で確認**

```
http://localhost:3000/admin
```

全組織が表示され、プランとステータスが正しく設定されていることを確認します。
