'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering for useSearchParams
export const dynamic = 'force-dynamic';

export default function AddonSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      completeAddonPurchase();
    }
  }, [sessionId]);

  const completeAddonPurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session data from API
      const response = await fetch('/api/stripe/complete-addon-purchase', {
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
        throw new Error(data.error || 'Failed to complete addon purchase');
      }

      const result = await response.json();
      console.log('Addon purchase data received:', result);

      // Update Firestore from client-side (has proper permissions)
      const { doc, getDoc, setDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const orgRef = doc(db, 'organizations', result.organizationId);

      // Get current organization data to preserve existing addons
      const orgSnap = await getDoc(orgRef);
      const existingAddons = orgSnap.exists() ? (orgSnap.data().addons || {}) : {};

      // Update organization document with addon purchase (using setDoc with merge for safety)
      await setDoc(orgRef, {
        addons: {
          ...existingAddons,
          [result.addonId]: {
            purchased: true,
            purchasedAt: Timestamp.now(),
            stripePaymentIntentId: result.stripePaymentIntentId,
            amountPaid: result.amountPaid,
          },
        },
        updatedAt: Timestamp.now(),
      }, { merge: true });

      console.log('Addon purchase completed for organization:', result.organizationId);

      // Wait a moment before showing success message
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error completing addon purchase:', err);
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
          <p className="text-gray-600">サポートサービスの購入を完了しています</p>
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
          設定ページから各種設定を行うことができます。
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/settings"
            className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            設定ページに進む
          </Link>
          <Link
            href="/dashboard"
            className="block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
          >
            ダッシュボードに戻る
          </Link>
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
