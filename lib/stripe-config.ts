// Stripe Configuration for L-Apply
// プランごとの価格設定とStripe Price ID

export interface StripePlan {
  id: 'monitor';
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

export interface StripeAddon {
  id: 'support';
  name: string;
  price: number;
  stripePriceId: string;
  description: string;
  isOneTime: boolean;
}

// Stripe Price IDs (これらはStripeダッシュボードで作成済み)
// https://dashboard.stripe.com/test/products
export const STRIPE_PLANS: Record<string, StripePlan> = {
  monitor: {
    id: 'monitor',
    name: 'モニタープラン',
    price: 1980,
    stripePriceId: 'price_1Sjr1nACE7iiZLQmcQjUuR7d', // モニタープラン
    features: [
      'イベント管理: 最大10件',
      'ステップ配信: 最大3件',
      'リマインダー: 最大10件',
      '月間申込受付: 最大300件',
      'LINE連携機能',
      '自動返信機能',
    ],
    limits: {
      maxEvents: 10,
      maxStepDeliveries: 3,
      maxReminders: 10,
      maxApplicationsPerMonth: 300,
    },
  },
};

// 追加サービス（オプション）
export const STRIPE_ADDONS: Record<string, StripeAddon> = {
  support: {
    id: 'support',
    name: 'サポートサービス',
    price: 15000,
    stripePriceId: 'price_1Sjr2CACE7iiZLQmHyCF6f3D', // サポートサービス
    description: '初回設定サポート - LINE連携の設定、基本的な使い方のレクチャーなど',
    isOneTime: true,
  },
};

// 利用可能なプランのリスト
export const AVAILABLE_PLANS = ['monitor'] as const;

// プランIDからプラン情報を取得
export function getPlanConfig(planId: string): StripePlan | null {
  return STRIPE_PLANS[planId] || null;
}

// アドオンIDからアドオン情報を取得
export function getAddonConfig(addonId: string): StripeAddon | null {
  return STRIPE_ADDONS[addonId] || null;
}

// 価格を日本円でフォーマット
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}
