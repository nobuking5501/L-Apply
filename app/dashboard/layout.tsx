'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Send,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  MessageSquare,
  Calendar,
  CreditCard,
  Bell,
} from 'lucide-react';

const navigation = [
  { name: 'ホーム', href: '/dashboard', icon: LayoutDashboard },
  { name: 'イベント管理', href: '/dashboard/events', icon: Calendar },
  { name: 'ステップ配信監視', href: '/dashboard/step-delivery', icon: Send },
  { name: 'ステップ配信設定', href: '/dashboard/step-messages', icon: MessageSquare },
  { name: 'リマインダー設定', href: '/dashboard/reminders', icon: Bell },
  { name: '自動返信設定', href: '/dashboard/auto-replies', icon: MessageSquare },
  { name: '申込者管理', href: '/dashboard/applications', icon: Users },
  { name: 'サブスクリプション', href: '/dashboard/subscription', icon: CreditCard },
  { name: '設定', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
            lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                L-Apply
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User info at bottom */}
            <div className="border-t p-4">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium">{userData?.displayName || 'ユーザー'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* User menu dropdown */}
                {userMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-lg shadow-lg">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top header */}
          <header className="bg-white shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex-1 lg:flex-none">
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigation.find((item) => item.href === pathname)?.name || 'ダッシュボード'}
                </h1>
              </div>

              {/* Desktop user menu */}
              <div className="hidden lg:block">
                <div className="text-sm text-gray-600">
                  {userData?.organizationId && (
                    <span className="mr-4">組織ID: {userData.organizationId}</span>
                  )}
                  <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {userData?.role || 'member'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
