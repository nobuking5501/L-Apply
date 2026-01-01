'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering for useSearchParams
export const dynamic = 'force-dynamic';

export default function AddonSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPopup = searchParams.get('popup') === 'true';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(isPopup ? 3 : 5); // ポップアップは3秒、通常は5秒
  const sessionId = searchParams.get('session_id');

  // Execute purchase completion immediately when sessionId is available
  // NO AUTH REQUIRED - server handles everything via Stripe session metadata
  useEffect(() => {
    if (sessionId && loading) {
      console.log('🚀 [Payment Success] SessionId available, starting purchase completion');
      completeAddonPurchase();
    }
  }, [sessionId]);

  // Start countdown and redirect/close when purchase completion is done
  useEffect(() => {
    if (!loading && !error) {
      if (isPopup) {
        console.log('✅ [Popup Mode] Purchase complete, closing window in 3 seconds...');

        // ポップアップモードの場合は、短いカウントダウン後にウィンドウを閉じる
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // 3秒後にウィンドウを閉じる
        const closeTimer = setTimeout(() => {
          console.log('✅ [Popup Mode] Closing window...');
          window.close();
        }, 3000);

        return () => {
          clearInterval(countdownInterval);
          clearTimeout(closeTimer);
        };
      } else {
        console.log('🚀 Starting countdown for redirect...');

        // 通常モード: リダイレクト
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Redirect after 5 seconds using window.location for full page reload
        // Add query parameter to signal successful purchase
        const redirectTimer = setTimeout(() => {
          console.log('🔄 Redirecting to settings page with addon_purchased flag...');
          window.location.href = '/dashboard/settings?addon_purchased=true';
        }, 5000);

        return () => {
          clearInterval(countdownInterval);
          clearTimeout(redirectTimer);
        };
      }
    }
  }, [loading, error, isPopup, router]);

  const completeAddonPurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🛒 [Payment Success] Starting addon purchase completion...');
      console.log('🛒 [Payment Success] Session ID:', sessionId);

      // Call server-side API - NO AUTH REQUIRED
      // Server will get organizationId from Stripe session metadata
      console.log('📡 [Payment Success] Calling server API...');
      const response = await fetch('/api/stripe/complete-addon-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      console.log('📡 [Payment Success] Server response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ [Payment Success] Server API failed:', data);
        throw new Error(data.error || 'サーバーでの処理に失敗しました');
      }

      const result = await response.json();
      console.log('✅ [Payment Success] Server API success:', result);
      console.log('✅ [Payment Success] Organization ID:', result.organizationId);
      console.log('✅ [Payment Success] Addon:', result.addonId);

      // Wait a bit for Firestore write to propagate
      setTimeout(() => {
        console.log('✅ [Payment Success] Purchase completion finished, ready to close/redirect');
        setLoading(false);
      }, 1000);

    } catch (err) {
      console.error('❌ [Payment Success] Error completing addon purchase:', err);
      console.error('❌ [Payment Success] Error details:', {
        message: err instanceof Error ? err.message : String(err),
        sessionId,
      });

      setError(err instanceof Error ? err.message : 'アドオン購入の完了に失敗しました');
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラー</h1>
          <p className="text-red-600 mb-6">セッションIDが見つかりません</p>
          <Link
            href="/dashboard/settings"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            設定ページに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium"
            >
              再試行
            </button>
            <Link
              href="/dashboard/settings"
              className="block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
            >
              設定ページに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">処理中...</h1>
          <p className="text-gray-600">
            サポートサービスの購入を完了しています
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <svg
              className="w-16 h-16 text-green-600"
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
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          お支払いが完了しました！
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          サポートサービスの購入が正常に完了しました。
          <br />
          {isPopup ? 'このウィンドウは自動的に閉じます。' : '設定ページに自動的に移動します。'}
        </p>

        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">{countdown}</div>
            <p className="text-sm text-blue-700">
              {isPopup ? '秒後にウィンドウを閉じます' : '秒後に設定ページに移動します'}
            </p>
          </div>
        </div>

        {!isPopup && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              自動的に移動しない場合は、
              <Link href="/dashboard/settings" className="text-blue-600 hover:underline ml-1">
                こちらをクリック
              </Link>
              してください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
