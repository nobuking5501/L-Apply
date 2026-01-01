'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Force dynamic rendering for useSearchParams
export const dynamic = 'force-dynamic';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const sessionId = searchParams.get('session_id');

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ User authenticated:', user.uid);
        setAuthReady(true);
      } else {
        console.log('⚠️ User not authenticated yet');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionId) {
      completeSubscription();
    }
  }, [sessionId]);

  const completeSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call server-side API to complete subscription
      // Server handles Firestore updates with Admin SDK (no auth required)
      const response = await fetch('/api/stripe/complete-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete subscription');
      }

      const result = await response.json();
      console.log('Subscription completed:', result);

      // Wait for authentication to be ready before showing success
      const checkAuth = setInterval(() => {
        if (auth.currentUser) {
          clearInterval(checkAuth);
          setAuthReady(true);
          setLoading(false);
        }
      }, 500);

      // Fallback: show success after 3 seconds even if auth not ready
      // This ensures users can always proceed
      setTimeout(() => {
        clearInterval(checkAuth);
        setAuthReady(true); // Force enable links after timeout
        setLoading(false);
      }, 3000);
    } catch (err) {
      console.error('Error completing subscription:', err);
      setError(err instanceof Error ? err.message : 'サブスクリプションの完了に失敗しました');
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
            href="/dashboard/subscription"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            サポートプラン管理に戻る
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
              href="/dashboard/subscription"
              className="block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
            >
              サポートプラン管理に戻る
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
          <p className="text-gray-600">サブスクリプションの設定を完了しています</p>
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
          サポートプランが正常にアップグレードされました。
          <br />
          新しいプランの機能をお楽しみください。
        </p>

        {!authReady && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-sm text-blue-700">アカウント情報を確認しています...</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {authReady ? (
            <>
              <Link
                href="/dashboard"
                className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                ダッシュボードに戻る
              </Link>
              <Link
                href="/dashboard/subscription"
                className="block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
              >
                サポートプラン管理を表示
              </Link>
            </>
          ) : (
            <>
              <button
                disabled
                className="block w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
              >
                ダッシュボードに戻る
              </button>
              <button
                disabled
                className="block w-full bg-gray-200 text-gray-400 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
              >
                サポートプラン管理を表示
              </button>
            </>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            ご不明な点がございましたら、サポートまでお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
