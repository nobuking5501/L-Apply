'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/stripe-config';

interface SupportServiceOverlayProps {
  organizationId: string;
  onPurchaseStart?: () => void;
}

export default function SupportServiceOverlay({
  organizationId,
  onPurchaseStart
}: SupportServiceOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (onPurchaseStart) {
      onPurchaseStart();
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Support Overlay] 🎯 Creating checkout session...');
      console.log('[Support Overlay] 🎯 Organization ID:', organizationId);

      const response = await fetch('/api/stripe/create-addon-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          addonId: 'support',
          usePopup: true, // ポップアップモードを指定
        }),
      });

      console.log('[Support Overlay] 🎯 Checkout API response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      console.log('[Support Overlay] Checkout URL received, opening popup...');

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
        console.warn('[Support Overlay] Popup blocked, falling back to redirect');
        window.location.href = url;
        return;
      }

      console.log('[Support Overlay] Popup opened successfully');
      setLoading(false);

      // ポップアップが閉じられたら、決済完了を確認
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          console.log('[Support Overlay] Popup closed, navigating to settings page with addon_purchased flag...');
          // Webhookの処理を待ってから設定ページに遷移（addon_purchased=trueパラメータ付き）
          // このパラメータにより、設定ページのリトライロジックが起動する
          setTimeout(() => {
            console.log('[Support Overlay] Redirecting to /dashboard/settings?addon_purchased=true');
            window.location.href = '/dashboard/settings?addon_purchased=true';
          }, 3000); // 3秒待機してWebhookの処理を確保
        }
      }, 500);
    } catch (err) {
      console.error('[Support Overlay] Purchase error:', err);
      setError(err instanceof Error ? err.message : '決済の開始に失敗しました');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 lg:left-64 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 rounded-full p-4">
              <svg
                className="w-16 h-16 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            サポートサービスのご案内
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-6">
            設定ページをご利用いただくには、<br />
            <strong className="text-blue-600">サポートサービス</strong>のご購入が必要です
          </p>

          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-bold text-gray-900 mb-4">サポートサービスに含まれるもの：</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
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
                <span className="text-gray-700">
                  <strong>初回設定サポート</strong> - LINE連携の設定をサポートいたします
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
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
                <span className="text-gray-700">
                  <strong>基本的な使い方のレクチャー</strong> - システムの使い方を丁寧にご説明します
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
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
                <span className="text-gray-700">
                  <strong>設定ページへのアクセス</strong> - 購入後、すぐに設定ページをご利用いただけます
                </span>
              </li>
            </ul>
          </div>

          {/* Price */}
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-2">一回限りのお支払い</div>
            <div className="text-4xl font-bold text-gray-900">
              {formatPrice(15000)}
              <span className="text-lg font-normal text-gray-500 ml-2">（税込）</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 rounded-lg font-semibold"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                処理中...
              </>
            ) : (
              <>
                サポートサービスを購入する
              </>
            )}
          </Button>

          {/* Note */}
          <p className="text-xs text-gray-500 mt-4">
            ※ お支払いは安全なStripe決済システムを使用しています
          </p>
        </div>
      </div>
    </div>
  );
}
