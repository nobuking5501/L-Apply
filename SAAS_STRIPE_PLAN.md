# L-Apply SaaS化 & Stripe決済導入プラン

## 🎯 ビジネスモデルの整理

### 想定する顧客
- セミナー主催者
- スクール運営者
- コーチング事業者
- コンサルティング会社

### 提供する価値
- LINE公式アカウントでの予約管理
- 自動リマインド機能
- ステップ配信機能
- 申込者データ管理

---

## 💰 推奨する料金プラン

### プランA: シンプル構成

| プラン | 月額 | 機能 |
|--------|------|------|
| **Free** | ¥0 | 月10件まで、基本機能のみ |
| **Starter** | ¥3,980 | 月100件まで、全機能 |
| **Professional** | ¥9,800 | 月500件まで、全機能 + サポート |
| **Enterprise** | ¥29,800 | 無制限、全機能 + 専任サポート |

### プランB: 従量課金

- 基本料金: ¥2,980/月
- 申込1件あたり: ¥50
- 初期費用: ¥0

---

## 🏗️ システムアーキテクチャ

### 現在の構成（既存）
```
組織A (organization_id: org-001)
  └─ LINE Channel A
  └─ LIFF App A
  └─ 申込データ A

組織B (organization_id: org-002)
  └─ LINE Channel B
  └─ LIFF App B
  └─ 申込データ B
```

### 追加が必要な構成
```
組織A
  ├─ Stripe Customer ID
  ├─ Stripe Subscription ID
  ├─ プラン: Professional
  ├─ 状態: active / canceled / past_due
  └─ 使用量: 今月45件

組織B
  ├─ Stripe Customer ID
  ├─ Stripe Subscription ID
  ├─ プラン: Starter
  ├─ 状態: active
  └─ 使用量: 今月12件
```

---

## 📊 Firestore データ構造（追加）

### organizations コレクション（拡張）

```typescript
{
  organizationId: "org-001",
  name: "株式会社サンプル",
  email: "admin@example.com",

  // LINE設定（既存）
  lineChannelAccessToken: "xxx",
  lineChannelSecret: "xxx",
  liffId: "xxx",

  // Stripe関連（新規）
  stripe: {
    customerId: "cus_xxxxx",        // Stripe Customer ID
    subscriptionId: "sub_xxxxx",    // Stripe Subscription ID
    subscriptionStatus: "active",    // active, canceled, past_due, etc.
    plan: "professional",            // free, starter, professional, enterprise
    currentPeriodStart: Timestamp,
    currentPeriodEnd: Timestamp,
    cancelAtPeriodEnd: false,
  },

  // 使用量制限（新規）
  limits: {
    maxApplicationsPerMonth: 500,
    currentMonthApplications: 45,
    monthStartDate: Timestamp,
  },

  // 作成・更新日時
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### subscriptions コレクション（新規）

```typescript
{
  subscriptionId: "sub_xxxxx",
  organizationId: "org-001",
  customerId: "cus_xxxxx",
  status: "active",
  plan: "professional",
  amount: 9800,
  currency: "jpy",
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### billing_events コレクション（新規）

```typescript
{
  eventId: "evt_xxxxx",
  organizationId: "org-001",
  type: "subscription.created",  // subscription.updated, invoice.paid, etc.
  data: {...},                   // Stripeのイベントデータ
  createdAt: Timestamp,
}
```

---

## 🔧 実装方法

### フェーズ1: Stripe基本統合（1-2週間）

#### 1.1 Stripeアカウント設定
```bash
# Stripeダッシュボードで
1. アカウント作成
2. APIキー取得（本番用 & テスト用）
3. Webhook設定
```

#### 1.2 環境変数追加
```env
# Vercel環境変数に追加
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 1.3 必要なパッケージインストール
```bash
npm install stripe @stripe/stripe-js
```

#### 1.4 API Routes作成（Next.js）

**`/api/stripe/create-checkout-session.ts`**
```typescript
// 新規登録時のCheckoutセッション作成
import Stripe from 'stripe';

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: 'price_xxxxx', // Stripeで作成したPrice ID
        quantity: 1,
      },
    ],
    success_url: `${req.headers.origin}/dashboard?success=true`,
    cancel_url: `${req.headers.origin}/pricing`,
    metadata: {
      organizationId: req.body.organizationId,
    },
  });

  res.json({ sessionId: session.id });
}
```

**`/api/stripe/webhook.ts`**
```typescript
// Stripeからのイベント受信
import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // イベント処理
  switch (event.type) {
    case 'checkout.session.completed':
      // サブスクリプション作成完了
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'invoice.paid':
      // 支払い成功
      await handleInvoicePaid(event.data.object);
      break;
    case 'customer.subscription.deleted':
      // サブスクリプション解約
      await handleSubscriptionDeleted(event.data.object);
      break;
  }

  res.json({ received: true });
}
```

**`/api/stripe/customer-portal.ts`**
```typescript
// カスタマーポータル（プラン変更・解約）
export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.billingPortal.sessions.create({
    customer: req.body.customerId,
    return_url: `${req.headers.origin}/dashboard`,
  });

  res.json({ url: session.url });
}
```

---

### フェーズ2: フロントエンド実装（1週間）

#### 2.1 料金ページ作成

**`/app/pricing/page.tsx`**
```typescript
import { loadStripe } from '@stripe/stripe-js';

export default function PricingPage() {
  const handleSubscribe = async (plan: string) => {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });

    const { sessionId } = await response.json();
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    await stripe.redirectToCheckout({ sessionId });
  };

  return (
    <div>
      <h1>料金プラン</h1>

      <div className="plans">
        <div className="plan">
          <h2>Starter</h2>
          <p>¥3,980/月</p>
          <button onClick={() => handleSubscribe('starter')}>
            今すぐ始める
          </button>
        </div>

        <div className="plan">
          <h2>Professional</h2>
          <p>¥9,800/月</p>
          <button onClick={() => handleSubscribe('professional')}>
            今すぐ始める
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 ダッシュボードに支払い管理追加

**`/app/dashboard/billing/page.tsx`**
```typescript
export default function BillingPage() {
  const handleManageBilling = async () => {
    const response = await fetch('/api/stripe/customer-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: 'cus_xxxxx' }),
    });

    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <div>
      <h1>請求管理</h1>
      <p>現在のプラン: Professional</p>
      <p>次回請求日: 2025/12/16</p>
      <button onClick={handleManageBilling}>
        プランを変更・解約する
      </button>
    </div>
  );
}
```

---

### フェーズ3: 使用量制限実装（1週間）

#### 3.1 申込時の制限チェック

**`functions/src/apply-prod.ts`** (修正)
```typescript
// 申込前に使用量をチェック
const org = await getOrganization(organizationId);

if (org.limits.currentMonthApplications >= org.limits.maxApplicationsPerMonth) {
  return res.status(403).json({
    error: 'Monthly application limit reached',
    message: 'プランの上限に達しました。プランをアップグレードしてください。',
  });
}

// 申込処理...
// 成功したらカウントアップ
await incrementMonthlyApplicationCount(organizationId);
```

#### 3.2 使用量リセット（Cloud Scheduler）

```typescript
// 毎月1日0時に実行
export const resetMonthlyUsage = onSchedule('0 0 1 * *', async () => {
  const orgs = await getAllOrganizations();

  for (const org of orgs) {
    await updateOrganization(org.id, {
      'limits.currentMonthApplications': 0,
      'limits.monthStartDate': Timestamp.now(),
    });
  }
});
```

---

### フェーズ4: 組織登録フロー（1週間）

#### 4.1 新規登録ページ

```
1. メールアドレス入力
2. 組織情報入力
3. プラン選択
4. Stripe Checkout
5. 支払い完了
6. 組織作成 + LINE設定手順案内
```

#### 4.2 オンボーディングフロー

```
1. LINE Developers でチャンネル作成
2. Channel Secret / Access Token 入力
3. LIFF アプリ作成
4. LIFF ID 入力
5. Webhook URL 設定
6. 完了！
```

---

## 🚀 開発スケジュール（推奨）

### Week 1-2: Stripe基本統合
- [ ] Stripeアカウント設定
- [ ] APIキー取得
- [ ] Webhook設定
- [ ] API Routes実装
- [ ] Firestoreスキーマ追加

### Week 3: フロントエンド
- [ ] 料金ページ作成
- [ ] Checkout フロー実装
- [ ] ダッシュボードに請求管理追加
- [ ] カスタマーポータル統合

### Week 4: 使用量制限
- [ ] 申込時の制限チェック
- [ ] 使用量カウント実装
- [ ] 月次リセット機能
- [ ] アラート通知（上限に近づいたら）

### Week 5: テスト
- [ ] Stripeテストモードで検証
- [ ] 各プランのテスト
- [ ] Webhook動作確認
- [ ] エラーハンドリング確認

### Week 6: 本番リリース
- [ ] 本番APIキーに切り替え
- [ ] 料金ページ公開
- [ ] マーケティング開始

---

## 💡 その他の検討事項

### セキュリティ
- [ ] 組織IDとユーザー認証の紐付け
- [ ] APIエンドポイントの認証
- [ ] Stripe Webhookの署名検証

### 運用
- [ ] 請求失敗時の処理（リトライ、サービス停止）
- [ ] プランダウングレード時の処理
- [ ] 解約時のデータ保持期間

### マーケティング
- [ ] 無料トライアル（14日間）
- [ ] クーポン機能
- [ ] 紹介プログラム

### サポート
- [ ] ヘルプドキュメント
- [ ] チャットサポート
- [ ] オンボーディング支援

---

## 📈 期待される成果

### 収益予測（6ヶ月後）

| 項目 | 数値 |
|------|------|
| 有料顧客数 | 50社 |
| 平均単価 | ¥7,000/月 |
| 月間売上 | ¥350,000 |
| 年間売上予測 | ¥4,200,000 |

---

## 🎯 次のステップ

1. **今すぐ**: Stripeアカウントを作成
2. **今週中**: フェーズ1の実装開始
3. **来月**: ベータ版リリース（限定顧客）
4. **2ヶ月後**: 正式リリース

---

**質問や相談があれば教えてください！**
一緒に実装を進めましょう。
