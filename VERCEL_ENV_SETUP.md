# Vercel 環境変数設定手順

## 必要な環境変数

### 1. Stripe Webhook Secret の取得方法

1. **Stripe Dashboard にアクセス**:
   ```
   https://dashboard.stripe.com/test/webhooks
   ```

2. **Webhook エンドポイントを確認**:
   - 既存のWebhookエンドポイントを選択
   - または、新規作成する場合:
     - "Add endpoint" をクリック
     - URL: `https://<your-vercel-domain>/api/stripe/webhook`
     - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

3. **Signing Secret をコピー**:
   - Webhook詳細ページの "Signing secret" セクション
   - "Reveal" をクリックして表示
   - `whsec_...` で始まる文字列をコピー

---

## Vercel での環境変数設定

### 手順:

1. **Vercel Dashboard にアクセス**:
   ```
   https://vercel.com/dashboard
   ```

2. **L-Apply プロジェクトを選択**

3. **Settings → Environment Variables に移動**

4. **以下の環境変数を追加**:

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `STRIPE_SECRET_KEY` | `sk_test_51RLUWALx84xZL0YK...` | Production, Preview, Development |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (次のステップで取得) | Production, Preview, Development |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (必要な場合) | Production, Preview, Development |

5. **保存後、再デプロイ**:
   - Deployments タブに移動
   - 最新のデプロイを選択
   - "Redeploy" ボタンをクリック

---

## 確認事項

- ✅ STRIPE_SECRET_KEY: 受け取り済み
- ❓ STRIPE_WEBHOOK_SECRET: 要取得
- ❓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 必要かどうか確認

---

**最終更新**: 2025-11-30
