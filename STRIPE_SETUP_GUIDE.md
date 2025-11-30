# Stripe 決済統合セットアップガイド

このガイドでは、L-Apply に Stripe 決済を統合する手順を説明します。

## 📋 前提条件

- Stripeアカウント（テストモード）
- Firebase プロジェクトへのアクセス
- 開発環境が正常に動作していること

## 🔧 セットアップ手順

### 1. Stripe アカウントの準備

1. [Stripe Dashboard](https://dashboard.stripe.com/register) にアクセス
2. アカウントを作成（まだの場合）
3. **テストモード**に切り替え（画面右上のトグル）

### 2. API キーの取得

1. Stripe Dashboard で「開発者」→「API キー」を開く
2. 以下の2つのキーをコピー：
   - **公開可能キー** (pk_test_...)
   - **シークレットキー** (sk_test_...)

3. `.env.local` ファイルを更新：

```env
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_あなたのシークレットキー
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_あなたの公開可能キー
STRIPE_WEBHOOK_SECRET=whsec_あなたのWebhookシークレット（後で設定）
```

### 3. Stripe 商品と価格の作成

以下の3つのプランを Stripe Dashboard で作成します：

#### プラン1: モニタープラン
1. 「商品」→「商品を追加」
2. 商品名: `モニタープラン`
3. 価格: `¥980`
4. 請求期間: `月次`
5. 作成後、**Price ID** (`price_xxxxx`) をコピー

#### プラン2: 正規プラン
1. 「商品」→「商品を追加」
2. 商品名: `正規プラン`
3. 価格: `¥1,980`
4. 請求期間: `月次`
5. 作成後、**Price ID** (`price_xxxxx`) をコピー

#### プラン3: プロプラン
1. 「商品」→「商品を追加」
2. 商品名: `プロプラン`
3. 価格: `¥4,980`
4. 請求期間: `月次`
5. 作成後、**Price ID** (`price_xxxxx`) をコピー

### 4. Price ID の設定

取得した Price ID を `lib/stripe-config.ts` に設定：

```typescript
export const STRIPE_PLANS: Record<string, StripePlan> = {
  monitor: {
    // ...
    stripePriceId: 'price_あなたのモニタープランのID', // ← ここを更新
  },
  regular: {
    // ...
    stripePriceId: 'price_あなたの正規プランのID', // ← ここを更新
  },
  pro: {
    // ...
    stripePriceId: 'price_あなたのプロプランのID', // ← ここを更新
  },
};
```

### 5. Webhook の設定

#### ローカル開発の場合（Stripe CLI を使用）

1. Stripe CLI をインストール：
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe
   ```

2. Stripe CLI でログイン：
   ```bash
   stripe login
   ```

3. Webhook をフォワード：
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. 表示される `whsec_xxxxx` を `.env.local` に設定：
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_表示されたシークレット
   ```

#### 本番環境の場合

1. Stripe Dashboard で「開発者」→「Webhook」を開く
2. 「エンドポイントを追加」をクリック
3. エンドポイント URL: `https://yourdomain.com/api/stripe/webhook`
4. イベントを選択：
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. 作成後、**署名シークレット**をコピーして `.env.local` に設定

### 6. 開発サーバーの再起動

環境変数を更新した後、開発サーバーを再起動：

```bash
# 既存のサーバーを停止して
npm run dev
```

## 🧪 テスト方法

### 1. サブスクリプションページへアクセス

```
http://localhost:3000/dashboard/subscription
```

### 2. テストカードで決済

プランをクリックして、以下のテストカード情報を使用：

- **カード番号**: `4242 4242 4242 4242`
- **有効期限**: 任意の未来の日付（例: `12/25`）
- **CVC**: 任意の3桁（例: `123`）
- **郵便番号**: 任意

### 3. 決済完了の確認

1. 決済成功ページにリダイレクトされる
2. ダッシュボードでプランが更新されている
3. Stripe Dashboard で支払いが記録されている
4. Firebase Console で `subscription` フィールドが更新されている

## 📊 管理機能

### 管理画面でプランを確認

```
http://localhost:3000/admin/organizations
```

管理者は以下の操作が可能：
- 組織のプランを手動で変更
- サブスクリプションのステータスを確認
- 利用状況を監視

## 🚨 トラブルシューティング

### エラー: "STRIPE_SECRET_KEY is not set"

→ `.env.local` に正しい API キーが設定されているか確認

### エラー: "Invalid price ID"

→ `lib/stripe-config.ts` の Price ID が正しいか確認

### Webhook が動作しない

→ Stripe CLI が実行中か確認（ローカル開発の場合）

### 決済後にプランが更新されない

→ Webhook のログを確認：
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook --print-json
```

## 📝 次のステップ

- [ ] Stripe アカウントを本番モードに切り替え
- [ ] 本番用の API キーを取得
- [ ] 本番用の Webhook を設定
- [ ] 請求書の発行設定
- [ ] 顧客ポータルの実装（サブスクリプションキャンセル用）
- [ ] メール通知の設定

## 🔗 参考リンク

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
