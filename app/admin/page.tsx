'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminStats {
  totalOrganizations: number;
  organizationsByPlan: {
    test: number;
    monitor: number;
  };
  organizationsByStatus: {
    active: number;
    trial: number;
    canceled: number;
    past_due: number;
  };
  totalRevenue: number;
  monthlyRecurringRevenue: number;
}

const PLAN_PRICES: Record<string, number> = {
  test: 0,
  monitor: 1980,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'organizations'));
      const snapshot = await getDocs(q);

      const stats: AdminStats = {
        totalOrganizations: 0,
        organizationsByPlan: {
          test: 0,
          monitor: 0,
        },
        organizationsByStatus: {
          active: 0,
          trial: 0,
          canceled: 0,
          past_due: 0,
        },
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
      };

      snapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalOrganizations++;

        const plan = data.subscription?.plan || 'test';
        const status = data.subscription?.status || 'trial';

        if (plan in stats.organizationsByPlan) {
          stats.organizationsByPlan[plan as keyof typeof stats.organizationsByPlan]++;
        }

        if (status in stats.organizationsByStatus) {
          stats.organizationsByStatus[status as keyof typeof stats.organizationsByStatus]++;
        }

        if (status === 'active') {
          const price = PLAN_PRICES[plan] || 0;
          stats.monthlyRecurringRevenue += price;
        }
      });

      stats.totalRevenue = stats.monthlyRecurringRevenue;
      setStats(stats);
    } catch (err) {
      setError('統計情報の取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">総組織数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.totalOrganizations}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">有効組織</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {stats.organizationsByStatus.active}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">トライアル</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {stats.organizationsByStatus.trial}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">月次経常収益 (MRR)</div>
          <div className="mt-2 text-3xl font-bold text-purple-600">
            ¥{stats.monthlyRecurringRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">プラン別組織数</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">フリープラン</div>
            <div className="mt-1 text-2xl font-bold text-gray-700">
              {stats.organizationsByPlan.test}
            </div>
            <div className="mt-1 text-xs text-gray-500">¥0/月</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">モニタープラン</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">
              {stats.organizationsByPlan.monitor}
            </div>
            <div className="mt-1 text-xs text-gray-500">¥1,980/月</div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ステータス別組織数</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">有効</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {stats.organizationsByStatus.active}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">トライアル</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">
              {stats.organizationsByStatus.trial}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">キャンセル</div>
            <div className="mt-1 text-2xl font-bold text-gray-600">
              {stats.organizationsByStatus.canceled}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">支払い遅延</div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {stats.organizationsByStatus.past_due}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="space-y-2">
          <Link
            href="/admin/organizations"
            className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            → 全組織を表示
          </Link>
        </div>
      </div>
    </div>
  );
}
