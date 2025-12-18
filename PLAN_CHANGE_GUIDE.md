# プラン変更ガイド

**最終更新**: 2025-12-18

このガイドでは、L-Applyのサブスクリプションプランを変更する手順を説明します。

---

## ✅ プラン変更の柔軟性

### 対応可能な変更：

- ✅ **料金の変更** - 980円 → 1,200円など
- ✅ **制限値の変更** - イベント10件 → 15件など
- ✅ **プラン名の変更** - モニタープラン → スタータープランなど
- ✅ **新プランの追加** - エンタープライズプランなど
- ✅ **プランの削除** - 不要なプランの廃止
- ✅ **機能説明の変更** - features配列の更新

### なぜ簡単なのか？

プラン情報が**2箇所のみ**に集約されているため、変更が容易です：

1. **フロントエンド**: `lib/stripe-config.ts` - UI表示用
2. **バックエンド**: `functions/src/utils/admin-firestore.ts` - 制限チェック用

---

## 📋 変更が必要なファイル

### 1️⃣ フロントエンド（UI表示用）

**ファイル**: `lib/stripe-config.ts`

このファイルでプラン情報を定義しています：

```typescript
export const STRIPE_PLANS: Record<string, StripePlan> = {
  monitor: {
    id: 'monitor',
    name: 'モニタープラン',           // ← プラン名
    price: 980,                        // ← 月額料金（円）
    stripePriceId: 'price_1ScS53Lx84xZL0YKFO15KkWI', // ← Stripe Price ID
    features: [                        // ← UI表示用の機能説明
      'イベント管理: 最大10件',
      'ステップ配信: 最大3件',
      'リマインド: 最大5件',
      '月間申込受付: 最大100件',
    ],
    limits: {                          // ← 実際の制限値
      maxEvents: 10,
      maxStepDeliveries: 3,
      maxReminders: 5,
      maxApplicationsPerMonth: 100,
    },
  },
  // regular, pro も同様
};
```

**変更対象**:
- `name` - プラン名
- `price` - 月額料金
- `stripePriceId` - Stripe Price ID（Stripe Dashboardで作成後に設定）
- `features` - ユーザーに表示される機能説明
- `limits` - 実際の制限値

### 2️⃣ バックエンド（制限チェック用）

**ファイル**: `functions/src/utils/admin-firestore.ts`

**変更箇所1**: `getPlanLimits()` 関数（374-412行目）

```typescript
function getPlanLimits(plan: SubscriptionPlan) {
  switch (plan) {
    case 'monitor':
      return {
        maxEvents: 10,                    // ← イベント作成上限
        maxStepDeliveries: 3,             // ← ステップ配信上限
        maxReminders: 5,                  // ← リマインダー上限
        maxApplicationsPerMonth: 100,     // ← 月間申込上限
      };
    // regular, pro も同様
  }
}
```

**変更箇所2**: `getPlanPrice()` 関数（417-430行目）

```typescript
function getPlanPrice(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'monitor':
      return 980;    // ← 月額料金（円）
    case 'regular':
      return 1980;
    case 'pro':
      return 4980;
    default:
      return 0;
  }
}
```

**変更対象**:
- 制限値（maxEvents, maxStepDeliveries, maxReminders, maxApplicationsPerMonth）
- 料金（getPlanPrice）

### 3️⃣ TypeScript型定義（新プラン追加時のみ）

**ファイル**: `functions/src/utils/admin-firestore.ts`（6行目）

```typescript
export type SubscriptionPlan = 'test' | 'monitor' | 'regular' | 'pro';
//                                      ^^^^^^   ^^^^^^^^  ^^^^^^^  ^^^^
//                                      新プラン追加時はここに追加
```

---

## 🔧 変更手順

### パターン1: 既存プランの料金・制限値を変更する

#### 例：モニタープランの料金を980円→1,200円に変更、イベント上限を10→15に変更

1. **Stripe Dashboardで新しい価格を作成**
   ```
   1. https://dashboard.stripe.com/test/products を開く
   2. 既存の「モニタープラン」商品を選択
   3. 「Add another price」をクリック
   4. 月額 ¥1,200 を設定
   5. 作成後にPrice ID（例：price_xxxxx）をコピー
   ```

2. **lib/stripe-config.ts を編集**
   ```typescript
   monitor: {
     id: 'monitor',
     name: 'モニタープラン',
     price: 1200,  // ← 980 から 1200 に変更
     stripePriceId: 'price_xxxxx',  // ← 新しいPrice IDに変更
     features: [
       'イベント管理: 最大15件',  // ← 10 から 15 に変更
       'ステップ配信: 最大3件',
       'リマインド: 最大5件',
       '月間申込受付: 最大100件',
     ],
     limits: {
       maxEvents: 15,  // ← 10 から 15 に変更
       maxStepDeliveries: 3,
       maxReminders: 5,
       maxApplicationsPerMonth: 100,
     },
   },
   ```

3. **functions/src/utils/admin-firestore.ts を編集**

   **getPlanLimits() 関数**:
   ```typescript
   case 'monitor':
     return {
       maxEvents: 15,  // ← 10 から 15 に変更
       maxStepDeliveries: 3,
       maxReminders: 5,
       maxApplicationsPerMonth: 100,
     };
   ```

   **getPlanPrice() 関数**:
   ```typescript
   case 'monitor':
     return 1200;  // ← 980 から 1200 に変更
   ```

4. **デプロイ**
   ```bash
   # Next.jsをデプロイ（Vercel）
   git add .
   git commit -m "Update monitor plan: ¥1,200, maxEvents 15"
   git push

   # Firebase Functionsをデプロイ
   cd functions
   npm run deploy
   ```

---

### パターン2: 新しいプランを追加する

#### 例：エンタープライズプラン（¥9,800/月）を追加

1. **Stripe Dashboardで商品・価格を作成**
   ```
   1. https://dashboard.stripe.com/test/products を開く
   2. 「Add product」をクリック
   3. Product name: エンタープライズプラン
   4. Price: ¥9,800/月
   5. 作成後にPrice ID（例：price_enterprise_xxxxx）をコピー
   ```

2. **TypeScript型定義を追加**（`functions/src/utils/admin-firestore.ts:6`）
   ```typescript
   export type SubscriptionPlan = 'test' | 'monitor' | 'regular' | 'pro' | 'enterprise';
   //                                                                       ^^^^^^^^^^
   //                                                                       追加
   ```

3. **lib/stripe-config.ts を編集**

   **型定義を更新**:
   ```typescript
   export interface StripePlan {
     id: 'monitor' | 'regular' | 'pro' | 'enterprise';  // ← 追加
     // ...
   }
   ```

   **プラン情報を追加**:
   ```typescript
   export const STRIPE_PLANS: Record<string, StripePlan> = {
     monitor: { /* 既存 */ },
     regular: { /* 既存 */ },
     pro: { /* 既存 */ },
     enterprise: {  // ← 新規追加
       id: 'enterprise',
       name: 'エンタープライズプラン',
       price: 9800,
       stripePriceId: 'price_enterprise_xxxxx',
       features: [
         'イベント管理: 無制限',
         'ステップ配信: 無制限',
         'リマインド: 無制限',
         '月間申込受付: 無制限',
         '専用サポート',
       ],
       limits: {
         maxEvents: 9999,
         maxStepDeliveries: 9999,
         maxReminders: 9999,
         maxApplicationsPerMonth: 99999,
       },
     },
   };
   ```

   **利用可能プランリストに追加**:
   ```typescript
   export const AVAILABLE_PLANS = ['monitor', 'regular', 'pro', 'enterprise'] as const;
   //                                                              ^^^^^^^^^^
   //                                                              追加
   ```

4. **functions/src/utils/admin-firestore.ts を編集**

   **getPlanLimits() に追加**:
   ```typescript
   function getPlanLimits(plan: SubscriptionPlan) {
     switch (plan) {
       case 'test':
         return { /* 既存 */ };
       case 'monitor':
         return { /* 既存 */ };
       case 'regular':
         return { /* 既存 */ };
       case 'pro':
         return { /* 既存 */ };
       case 'enterprise':  // ← 新規追加
         return {
           maxEvents: 9999,
           maxStepDeliveries: 9999,
           maxReminders: 9999,
           maxApplicationsPerMonth: 99999,
         };
       default:
         return { /* 既存 */ };
     }
   }
   ```

   **getPlanPrice() に追加**:
   ```typescript
   function getPlanPrice(plan: SubscriptionPlan): number {
     switch (plan) {
       case 'test':
         return 0;
       case 'monitor':
         return 980;
       case 'regular':
         return 1980;
       case 'pro':
         return 4980;
       case 'enterprise':  // ← 新規追加
         return 9800;
       default:
         return 0;
     }
   }
   ```

   **admin stats の型定義を更新**（48-55行目）:
   ```typescript
   export interface AdminStats {
     totalOrganizations: number;
     organizationsByPlan: {
       test: number;
       monitor: number;
       regular: number;
       pro: number;
       enterprise: number;  // ← 追加
     };
     // ...
   }
   ```

   **getAdminStats() 関数を更新**（300-339行目）:
   ```typescript
   const stats: AdminStats = {
     totalOrganizations: organizations.length,
     organizationsByPlan: {
       test: 0,
       monitor: 0,
       regular: 0,
       pro: 0,
       enterprise: 0,  // ← 追加
     },
     // ...
   };
   ```

5. **サブスクリプションページの表示順序を調整**（オプション）

   `app/dashboard/subscription/page.tsx:231` を編集:
   ```typescript
   {Object.values(STRIPE_PLANS)
     .sort((a, b) => a.price - b.price)  // ← 価格順にソート
     .map((plan) => {
       // カード表示
     })}
   ```

6. **デプロイ**
   ```bash
   # 型チェック
   npm run build

   # Next.jsをデプロイ（Vercel）
   git add .
   git commit -m "Add enterprise plan: ¥9,800/month"
   git push

   # Firebase Functionsをデプロイ
   cd functions
   npm run deploy
   ```

---

### パターン3: プランを削除する

#### 例：モニタープランを廃止する

1. **Stripe Dashboardで価格をアーカイブ**
   ```
   1. https://dashboard.stripe.com/test/products を開く
   2. 「モニタープラン」商品を選択
   3. 該当の価格の「...」メニューから「Archive」を選択
   ```

2. **lib/stripe-config.ts から削除**
   ```typescript
   export const STRIPE_PLANS: Record<string, StripePlan> = {
     // monitor: { /* 削除 */ },  ← コメントアウトまたは削除
     regular: { /* 既存 */ },
     pro: { /* 既存 */ },
   };

   export const AVAILABLE_PLANS = ['regular', 'pro'] as const;
   //                              ^^^^^^^^  削除
   ```

3. **functions/src/utils/admin-firestore.ts は残す**

   **重要**: 既存の契約者がいる可能性があるため、バックエンドの定義は残してください：
   ```typescript
   function getPlanLimits(plan: SubscriptionPlan) {
     switch (plan) {
       case 'monitor':  // ← 残す（既存契約者用）
         return {
           maxEvents: 10,
           maxStepDeliveries: 3,
           maxReminders: 5,
           maxApplicationsPerMonth: 100,
         };
       // ...
     }
   }
   ```

4. **型定義も残す**
   ```typescript
   export type SubscriptionPlan = 'test' | 'monitor' | 'regular' | 'pro';
   //                                      ^^^^^^^^
   //                                      既存契約者用に残す
   ```

5. **デプロイ**
   ```bash
   git add .
   git commit -m "Remove monitor plan from available plans"
   git push
   ```

**結果**:
- 新規申込では選択できなくなる
- 既存契約者は引き続き利用可能

---

## 🔍 変更箇所の一覧（チェックリスト）

### ✅ 料金・制限値の変更

- [ ] Stripe Dashboard - 新しい価格を作成
- [ ] `lib/stripe-config.ts` - STRIPE_PLANS配列
  - [ ] price（料金）
  - [ ] stripePriceId（新しいPrice ID）
  - [ ] features（UI表示文言）
  - [ ] limits（制限値）
- [ ] `functions/src/utils/admin-firestore.ts`
  - [ ] getPlanLimits() 関数
  - [ ] getPlanPrice() 関数

### ✅ 新プラン追加

- [ ] Stripe Dashboard - 商品・価格を作成
- [ ] `functions/src/utils/admin-firestore.ts`
  - [ ] SubscriptionPlan 型定義
  - [ ] getPlanLimits() 関数
  - [ ] getPlanPrice() 関数
  - [ ] AdminStats 型定義
  - [ ] getAdminStats() 関数の初期値
- [ ] `lib/stripe-config.ts`
  - [ ] StripePlan 型定義
  - [ ] STRIPE_PLANS配列
  - [ ] AVAILABLE_PLANS配列

### ✅ プラン削除

- [ ] Stripe Dashboard - 価格をアーカイブ
- [ ] `lib/stripe-config.ts` - STRIPE_PLANS配列から削除
- [ ] `lib/stripe-config.ts` - AVAILABLE_PLANS配列から削除
- [ ] `functions/src/utils/admin-firestore.ts` - **削除しない**（既存契約者用）

---

## 🧪 テスト手順

プラン変更後は必ずテストしてください：

### 1. ローカル環境でのテスト

```bash
# 型チェック
npm run build

# エラーがないか確認
cd functions
npm run build
```

### 2. サブスクリプションページの確認

1. ダッシュボードにログイン
2. サイドバーの「サブスクリプション」をクリック
3. プランカードが正しく表示されるか確認：
   - プラン名
   - 料金
   - 機能説明
   - アップグレードボタン

### 3. Stripe Checkoutの確認

1. サブスクリプションページで「このプランにアップグレード」をクリック
2. Stripe Checkout画面が開くか確認
3. 料金が正しく表示されているか確認

### 4. 制限チェックの確認

**イベント作成制限**:
1. イベント管理ページで新規作成
2. 上限に達したら適切なエラーメッセージが表示されるか確認

**申込制限**:
1. 申込を上限まで実行
2. 上限超過時に適切なエラーが返却されるか確認

---

## 💡 ベストプラクティス

### ✅ 推奨事項

1. **料金変更時は新しい価格を作成**
   - 既存契約者の価格は変更しない
   - 新しい価格を作成して新規契約者のみ適用

2. **段階的なロールアウト**
   - テスト環境で十分に検証
   - 本番環境では少数ユーザーから開始

3. **既存契約者への配慮**
   - プラン削除時もバックエンド定義は残す
   - 段階的な移行期間を設ける

4. **ドキュメント更新**
   - プラン変更時は利用規約も更新
   - ユーザーへの事前通知

### ⚠️ 注意事項

1. **制限値の不整合に注意**
   - フロントエンド（UI表示）とバックエンド（実際の制限）を必ず一致させる
   - 両方のファイルを同時に更新

2. **Stripe Price IDの確認**
   - 本番環境とテスト環境でPrice IDが異なる
   - 環境に応じて正しいPrice IDを設定

3. **型安全性**
   - TypeScript型定義を必ず更新
   - ビルドエラーがないか確認

---

## 📊 現在のプラン構成

### プラン一覧（2025-12-18時点）

| プラン | 月額 | イベント | 申込/月 | リマインダー | ステップ配信 | Stripe Price ID |
|--------|------|----------|---------|-------------|-------------|-----------------|
| test | ¥0 | 1 | 10 | 0 | 0 | - |
| monitor | ¥980 | 10 | 100 | 5 | 3 | price_1ScS53Lx84xZL0YKFO15KkWI |
| regular | ¥1,980 | 10 | 300 | 10 | 3 | price_1ScS56Lx84xZL0YK77mbec5Q |
| pro | ¥4,980 | 50 | 1,000 | 50 | 10 | price_1ScS59Lx84xZL0YKwSLdHLKJ |

---

## 🆘 トラブルシューティング

### Q: プラン変更後に型エラーが出る

A: TypeScript型定義を更新してください：
- `functions/src/utils/admin-firestore.ts:6` - SubscriptionPlan型
- `lib/stripe-config.ts:5` - StripePlan型

### Q: Stripe Checkoutで古い料金が表示される

A:
1. `lib/stripe-config.ts` の `stripePriceId` が新しいPrice IDに更新されているか確認
2. Vercelにデプロイされているか確認（`git push`）

### Q: 制限チェックが正しく動作しない

A:
1. `functions/src/utils/admin-firestore.ts` の `getPlanLimits()` が更新されているか確認
2. Firebase Functionsがデプロイされているか確認（`firebase deploy --only functions`）

---

## 📝 変更履歴テンプレート

プラン変更時は以下のフォーマットでコミットメッセージを記録してください：

```
Update subscription plans

Changes:
- Monitor plan: ¥980 → ¥1,200, maxEvents 10 → 15
- Add enterprise plan: ¥9,800/month (unlimited)
- Remove starter plan (archived)

Files modified:
- lib/stripe-config.ts
- functions/src/utils/admin-firestore.ts

Stripe Price IDs:
- monitor: price_xxxxx (new)
- enterprise: price_enterprise_xxxxx (new)
```

---

**最終更新**: 2025-12-18
**メンテナンス担当**: 開発チーム
