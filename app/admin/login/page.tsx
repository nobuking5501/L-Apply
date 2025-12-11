'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Force dynamic rendering for admin login page
export const dynamic = 'force-dynamic';

const ADMIN_ACCESS_KEY = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY || '';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  const [hasValidKey, setHasValidKey] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ステップ1: アクセスキーチェック
  useEffect(() => {
    const keyParam = searchParams.get('key');
    const storedKey = sessionStorage.getItem('admin_access_key');

    console.log('🔑 Admin Access Key Debug:', {
      expectedKey: ADMIN_ACCESS_KEY,
      expectedKeyLength: ADMIN_ACCESS_KEY.length,
      keyParam,
      keyParamLength: keyParam?.length,
      match: keyParam === ADMIN_ACCESS_KEY,
    });

    if (keyParam && keyParam === ADMIN_ACCESS_KEY) {
      // URLパラメータにキーがある場合、セッションに保存
      sessionStorage.setItem('admin_access_key', keyParam);
      setHasValidKey(true);
    } else if (storedKey === ADMIN_ACCESS_KEY) {
      // セッションに保存済みの場合
      setHasValidKey(true);
    } else {
      // キーがない、または間違っている
      setHasValidKey(false);
    }
  }, [searchParams]);

  // 既にログイン済みで管理者の場合は /admin へリダイレクト
  useEffect(() => {
    if (!loading && user && userData) {
      if (userData.role === 'admin' && hasValidKey) {
        router.push('/admin');
      } else if (userData.role !== 'admin') {
        // 管理者以外は /dashboard へ
        router.push('/dashboard');
      }
    }
  }, [user, userData, loading, hasValidKey, router]);

  // アクセスキーがない場合は404風の画面を表示
  if (!hasValidKey) {
    // デバッグ情報を表示（一時的）
    const keyParam = searchParams.get('key');
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-2xl p-8">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
          <p className="text-gray-600 mt-4">ページが見つかりません</p>

          {/* デバッグ情報 */}
          <div className="mt-8 p-4 bg-white rounded-lg shadow text-left text-xs">
            <p className="font-bold mb-2">Debug Info:</p>
            <p>Expected Key: {ADMIN_ACCESS_KEY || '(empty)'}</p>
            <p>Expected Length: {ADMIN_ACCESS_KEY.length}</p>
            <p>URL Key: {keyParam || '(none)'}</p>
            <p>URL Key Length: {keyParam?.length || 0}</p>
            <p>Match: {String(keyParam === ADMIN_ACCESS_KEY)}</p>
          </div>

          <a
            href="/"
            className="mt-6 inline-block text-blue-600 hover:text-blue-800 text-sm"
          >
            ← トップページに戻る
          </a>
        </div>
      </div>
    );
  }

  // ステップ2: 管理者認証
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Firebase Authentication でログイン
      await signInWithEmailAndPassword(auth, email, password);

      // AuthContext が userData を取得するまで少し待つ
      // useEffect でリダイレクト処理される
    } catch (err: any) {
      console.error('Admin login error:', err);

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else if (err.code === 'auth/too-many-requests') {
        setError('ログイン試行回数が多すぎます。しばらく待ってから再度お試しください');
      } else {
        setError('ログインに失敗しました');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        {/* 管理者専用の見た目 */}
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">管理者ログイン</h1>
          <p className="text-sm text-gray-600 mt-2">
            ⚠️ このページは管理者専用です
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              管理者メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="admin@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="••••••••"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? '認証中...' : '管理者としてログイン'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-xs text-gray-500">
            一般ユーザーの方は{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              こちらからログイン
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">読み込み中...</div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
