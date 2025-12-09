// Stripe Configuration for L-Apply
// プランごとの価格設定とStripe Price ID

export interface StripePlan {
  id: 'monitor' | 'regular' | 'pro';
  name: string;
  price: number;
  stripePriceId: string;
  features: string[];
  limits: {
    maxEvents: number;
    maxStepDeliveries: number;
    maxReminders: number;
    maxApplicationsPerMonth: number;
  };
}

// Stripe Price IDs (これらはStripeダッシュボードで作成後に更新してください)
// https://dashboard.stripe.com/test/products
export const STRIPE_PLANS: Record<string, StripePlan> = {
  monitor: {
    id: 'monitor',
    name: 'モニタープラン',
    price: 980,
    stripePriceId: 'price_1ScS53Lx84xZL0YKFO15KkWI', // モニタープラン
    features: [
      'イベント管理: 最大10件',
      'ステップ配信: 最大3件',
      'リマインド: 最大5件',
      '月間申込受付: 最大100件',
    ],
    limits: {
      maxEvents: 10,
      maxStepDeliveries: 3,
      maxReminders: 5,
      maxApplicationsPerMonth: 100,
    },
  },
  regular: {
    id: 'regular',
    name: '正規プラン',
    price: 1980,
    stripePriceId: 'price_1ScS56Lx84xZL0YK77mbec5Q', // 正規プラン
    features: [
      'イベント管理: 最大10件',
      'ステップ配信: 最大3件',
      'リマインド: 最大10件',
      '月間申込受付: 最大300件',
    ],
    limits: {
      maxEvents: 10,
      maxStepDeliveries: 3,
      maxReminders: 10,
      maxApplicationsPerMonth: 300,
    },
  },
  pro: {
    id: 'pro',
    name: 'プロプラン',
    price: 4980,
    stripePriceId: 'price_1ScS59Lx84xZL0YKwSLdHLKJ', // プロプラン
    features: [
      'イベント管理: 最大50件',
      'ステップ配信: 最大10件',
      'リマインド: 最大50件',
      '月間申込受付: 最大1,000件',
    ],
    limits: {
      maxEvents: 50,
      maxStepDeliveries: 10,
      maxReminders: 50,
      maxApplicationsPerMonth: 1000,
    },
  },
};

// 利用可能なプランのリスト
export const AVAILABLE_PLANS = ['monitor', 'regular', 'pro'] as const;

// プランIDからプラン情報を取得
export function getPlanConfig(planId: string): StripePlan | null {
  return STRIPE_PLANS[planId] || null;
}

// 価格を日本円でフォーマット
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}
