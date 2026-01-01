'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Force dynamic rendering for useSearchParams
export const dynamic = 'force-dynamic';

export default function AddonSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [waitingForAuth, setWaitingForAuth] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      completeAddonPurchase();
    }
  }, [sessionId]);

  // Wait for Firebase auth to be ready before redirecting
  useEffect(() => {
    if (loading) return; // Wait for purchase completion first

    console.log('🔐 Waiting for Firebase auth to be ready...');

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Auth confirmed, user:', user.uid);
        setWaitingForAuth(false);
      } else {
        console.log('⚠️ No authenticated user detected');
      }
    });

    // Timeout: if auth doesn't confirm within 10 seconds, proceed anyway
    const authTimeout = setTimeout(() => {
      console.log('⏱️ Auth timeout - proceeding with redirect');
      setWaitingForAuth(false);
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, [loading]);

  // Start countdown and redirect when auth is ready
  useEffect(() => {
    if (!loading && !error && !waitingForAuth) {
      console.log('🚀 Starting countdown for redirect...');

      // Start countdown
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
  }, [loading, error, waitingForAuth, router]);

  const verifyAddonPurchase = async (organizationId: string, retryCount = 0): Promise<boolean> => {
    const MAX_RETRIES = 10;
    const RETRY_DELAY = 1000; // 1 second

    try {
      console.log(`🔍 [Retry ${retryCount + 1}/${MAX_RETRIES}] Verifying addon purchase for org:`, organizationId);

      // Fetch organization data from Firestore to verify purchase
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const orgRef = doc(db, 'organizations', organizationId);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const orgData = orgSnap.data();
        const isPurchased = orgData?.addons?.support?.purchased === true;

        if (isPurchased) {
          console.log('✅ Purchase verified! addons.support.purchased = true');
          return true;
        } else {
          console.log(`⏳ Purchase not yet reflected in Firestore (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          console.log('Current addons data:', orgData?.addons);
        }
      } else {
        console.error('❌ Organization document not found');
      }

      // If not verified and retries remaining, wait and try again
      if (retryCount < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return verifyAddonPurchase(organizationId, retryCount + 1);
      }

      // Max retries reached
      console.error('❌ Max retries reached, purchase not verified');
      return false;
    } catch (err) {
      console.error('❌ Error verifying addon purchase:', err);

      // If error and retries remaining, try again
      if (retryCount < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return verifyAddonPurchase(organizationId, retryCount + 1);
      }

      return false;
    }
  };

  const completeAddonPurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🛒 Starting addon purchase completion...');

      // Call server-side API to complete purchase
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
      console.log('✅ Addon purchase API call completed:', result);

      // IMPORTANT: Verify that the purchase was actually written to Firestore
      // This prevents race conditions where the page redirects before data is available
      if (result.organizationId) {
        console.log('🔍 Verifying purchase data in Firestore...');
        const isVerified = await verifyAddonPurchase(result.organizationId);

        if (!isVerified) {
          throw new Error('購入データの反映を確認できませんでした。時間をおいて設定ページを確認してください。');
        }

        console.log('✅ Purchase verified in Firestore, ready to redirect');
      }

      // Wait a moment before showing success
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error('❌ Error completing addon purchase:', err);
      setError(err instanceof Error ? err.message : 'アドオン購入の完了に失敗しました');
      setLoading(false);
      setWaitingForAuth(false); // Skip auth wait on error
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

  if (loading || waitingForAuth) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">処理中...</h1>
          <p className="text-gray-600">
            {loading ? 'サポートサービスの購入を完了しています' : '認証情報を確認しています'}
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
          設定ページに自動的に移動します。
        </p>

        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">{countdown}</div>
            <p className="text-sm text-blue-700">秒後に設定ページに移動します</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            自動的に移動しない場合は、
            <Link href="/dashboard/settings" className="text-blue-600 hover:underline ml-1">
              こちらをクリック
            </Link>
            してください。
          </p>
        </div>
      </div>
    </div>
  );
}
