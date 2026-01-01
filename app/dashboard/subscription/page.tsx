'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { STRIPE_PLANS, STRIPE_ADDONS, formatPrice } from '@/lib/stripe-config';
import Link from 'next/link';

interface Organization {
  id: string;
  subscription?: {
    plan: string;
    status: string;
    limits: {
      maxEvents: number;
      maxStepDeliveries: number;
      maxReminders: number;
      maxApplicationsPerMonth: number;
    };
  };
  usage?: {
    eventsCount: number;
    stepDeliveriesCount: number;
    remindersCount: number;
    applicationsThisMonth: number;
  };
  addons?: {
    [key: string]: {
      purchased: boolean;
      purchasedAt?: any;
      stripePaymentIntentId?: string;
      amountPaid?: number;
    };
  };
}

export default function SubscriptionPage() {
  const { userData } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingOrg, setFetchingOrg] = useState(true);

  useEffect(() => {
    if (userData?.organizationId) {
      fetchOrganization();
    }
  }, [userData]);

  const fetchOrganization = async () => {
    if (!userData?.organizationId) return;

    try {
      setFetchingOrg(true);
      const docRef = doc(db, 'organizations', userData.organizationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setOrganization({
          id: docSnap.id,
          ...docSnap.data(),
        } as Organization);
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError('組織情報の取得に失敗しました');
    } finally {
      setFetchingOrg(false);
    }
  };

  const currentPlan = organization?.subscription?.plan || 'test';
  const currentStatus = organization?.subscription?.status || 'trial';

  const handleUpgrade = async (planId: string) => {
    if (!organization) {
      alert('組織情報が見つかりません');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Subscription] 🎯 Creating checkout session...');
      console.log('[Subscription] 🎯 Organization ID:', organization.id);
      console.log('[Subscription] 🎯 Plan ID:', planId);

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organization.id,
          planId,
          usePopup: true, // ポップアップモードを指定
        }),
      });

      console.log('[Subscription] 🎯 Checkout API response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      console.log('[Subscription] Checkout URL received, opening popup...');

      // ポップアップで決済ページを開く（ポップアップブロック対策：ユーザーアクションから直接呼び出し）
      const popupWidth = 800;
      const popupHeight = 900;
      const left = (window.screen.width - popupWidth) / 2;
      const top = (window.screen.height - popupHeight) / 2;

      const popup = window.open(
        url,
        'stripe_checkout',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        // ポップアップがブロックされた場合は通常のリダイレクト
        console.warn('[Subscription] Popup blocked, falling back to redirect');
        window.location.href = url;
        return;
      }

      console.log('[Subscription] Popup opened successfully');
      setLoading(false);

      // ポップアップが閉じられたら、決済完了を確認
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          console.log('[Subscription] Popup closed, reloading page to check subscription status...');
          // ポップアップが閉じられたら、サブスクリプションページをリロードして状態を確認
          setTimeout(() => {
            console.log('[Subscription] Reloading subscription page');
            window.location.reload();
          }, 1000); // 1秒待機してWebhookの処理を確保
        }
      }, 500);
    } catch (err) {
      console.error('[Subscription] Upgrade error:', err);
      setError(err instanceof Error ? err.message : '決済の開始に失敗しました');
      setLoading(false);
    }
  };

  const handlePurchaseAddon = async (addonId: string) => {
    if (!organization) {
      alert('組織情報が見つかりません');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/create-addon-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organization.id,
          addonId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err instanceof Error ? err.message : '決済の開始に失敗しました');
      setLoading(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'test':
        return 'bg-gray-100 text-gray-800';
      case 'monitor':
        return 'bg-blue-100 text-blue-800';
      case 'regular':
        return 'bg-green-100 text-green-800';
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'test':
        return 'フリープラン';
      case 'monitor':
        return 'モニタープラン';
      case 'regular':
        return '正規プラン';
      case 'pro':
        return 'プロプラン';
      default:
        return plan;
    }
  };

  if (fetchingOrg) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">組織情報を読み込んでいます...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">組織情報が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">サポートプラン</h1>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">現在のプラン</div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-gray-900">
                  {getPlanName(currentPlan)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(
                    currentPlan
                  )}`}
                >
                  {currentStatus === 'active' ? '有効' : currentStatus === 'trial' ? 'トライアル' : currentStatus}
                </span>
              </div>
            </div>
            {currentPlan !== 'test' && (
              <div className="text-right">
                <div className="text-sm text-gray-500">月額料金</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(STRIPE_PLANS[currentPlan]?.price || 0)}
                  <span className="text-sm font-normal text-gray-500">/月</span>
                </div>
              </div>
            )}
          </div>

          {organization.subscription && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-gray-500">イベント</div>
                <div className="text-sm font-medium text-gray-900">
                  {organization.usage?.eventsCount || 0} /{' '}
                  {organization.subscription.limits.maxEvents}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">ステップ配信</div>
                <div className="text-sm font-medium text-gray-900">
                  {organization.usage?.stepDeliveriesCount || 0} /{' '}
                  {organization.subscription.limits.maxStepDeliveries}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">リマインド</div>
                <div className="text-sm font-medium text-gray-900">
                  {organization.usage?.remindersCount || 0} /{' '}
                  {organization.subscription.limits.maxReminders}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">今月の申込</div>
                <div className="text-sm font-medium text-gray-900">
                  {organization.usage?.applicationsThisMonth || 0} /{' '}
                  {organization.subscription.limits.maxApplicationsPerMonth}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">利用可能なプラン</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(STRIPE_PLANS).map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            // フリープラン（test）からのみアップグレード可能
            // すでに契約中のプランには再度アップグレードできない
            const canUpgrade = currentPlan === 'test' && !isCurrentPlan;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  isCurrentPlan ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        現在のプラン
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                      <span className="text-lg font-normal text-gray-500">/月</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!canUpgrade || loading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : canUpgrade
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isCurrentPlan
                      ? '現在のプラン'
                      : canUpgrade
                      ? loading
                        ? '処理中...'
                        : 'このプランにアップグレード'
                      : 'アップグレード不可'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add-ons Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">追加サービス</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(STRIPE_ADDONS).map((addon) => {
            const isPurchased = organization?.addons?.[addon.id]?.purchased === true;

            return (
              <div
                key={addon.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  isPurchased ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{addon.name}</h3>
                    {isPurchased && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        購入済み
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-6">{addon.description}</p>

                  <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatPrice(addon.price)}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {addon.isOneTime ? '（一回限り）' : '/月'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchaseAddon(addon.id)}
                    disabled={isPurchased || loading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isPurchased
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isPurchased
                      ? '購入済み'
                      : loading
                      ? '処理中...'
                      : '購入する'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Back to Dashboard */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
