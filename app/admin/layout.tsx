'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [hasAccessKey, setHasAccessKey] = useState(false);

  const isActive = (path: string) => pathname === path;

  // アクセスキーのチェック（ログインページ以外）
  useEffect(() => {
    if (pathname !== '/admin/login') {
      const storedKey = sessionStorage.getItem('admin_access_key');
      const expectedKey = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY || '';
      const match = storedKey === expectedKey;
      console.log('🔑 Admin Layout - Access Key Check:', {
        pathname,
        storedKey,
        expectedKey,
        expectedKeyLength: expectedKey.length,
        match,
      });
      setHasAccessKey(match);
    } else {
      // ログインページの場合は true に設定
      setHasAccessKey(true);
    }
  }, [pathname]);

  // 認証チェック（ログインページ以外）
  useEffect(() => {
    // ログインページはスキップ
    if (pathname === '/admin/login') {
      return;
    }

    if (!loading) {
      if (!user) {
        // 未ログインの場合、管理者ログインページへ
        router.push('/admin/login');
      } else if (userData && userData.role !== 'admin') {
        // 管理者以外は dashboard へリダイレクト
        router.push('/dashboard');
      }
      // 一時的: hasAccessKey チェックを無効化
      // else if (!hasAccessKey) {
      //   router.push('/dashboard');
      // }
    }
  }, [user, userData, loading, pathname, router]);

  // ログインページはレイアウトなしで表示
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 認証チェック中または権限なし
  // 一時的: hasAccessKey チェックを無効化
  if (loading || !user || !userData || userData.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-gray-500">認証確認中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">L-Apply 管理画面</h1>
            </div>
            <div className="text-sm text-gray-500">
              管理者専用ダッシュボード
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/admin"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                isActive('/admin')
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ダッシュボード
            </Link>
            <Link
              href="/admin/organizations"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                pathname?.startsWith('/admin/organizations')
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              組織一覧
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
