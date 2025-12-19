'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Organization {
  id: string;
  name?: string;
  email?: string;
  liffId: string;
  disabled?: boolean;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  subscription: {
    plan: 'test' | 'monitor' | 'regular' | 'pro';
    status: 'active' | 'trial' | 'canceled' | 'past_due';
    limits: {
      maxEvents: number;
      maxStepDeliveries: number;
      maxReminders: number;
      maxApplicationsPerMonth: number;
    };
  };
  usage: {
    eventsCount: number;
    stepDeliveriesCount: number;
    remindersCount: number;
    applicationsThisMonth: number;
  };
  createdAt: any;
}

export default function OrganizationsPageClient() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'test' | 'monitor' | 'regular' | 'pro'>('all');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'organizations'));
      const snapshot = await getDocs(q);

      const orgs: Organization[] = [];

      // Fetch organizations and their owner information
      const fetchPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Fetch owner information from users collection
        let ownerName = '';
        let ownerEmail = '';
        if (data.ownerId) {
          try {
            const userDoc = await getDocs(
              query(collection(db, 'users'), where('uid', '==', data.ownerId))
            );
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              ownerName = userData.displayName || '';
              ownerEmail = userData.email || '';
            }
          } catch (err) {
            console.error('Failed to fetch owner info for', doc.id, err);
          }
        }

        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          liffId: data.liffId || '',
          disabled: data.disabled || false,
          ownerId: data.ownerId || '',
          ownerName,
          ownerEmail,
          subscription: data.subscription || {
            plan: 'test',
            status: 'trial',
            limits: {
              maxEvents: 3,
              maxStepDeliveries: 3,
              maxReminders: 3,
              maxApplicationsPerMonth: 10,
            },
          },
          usage: data.usage || {
            eventsCount: 0,
            stepDeliveriesCount: 0,
            remindersCount: 0,
            applicationsThisMonth: 0,
          },
          createdAt: data.createdAt,
        };
      });

      const organizationsData = await Promise.all(fetchPromises);
      setOrganizations(organizationsData);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('組織情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter((org) =>
    filter === 'all' ? true : org.subscription.plan === filter
  );

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
      case 'unlimited':
        return 'bg-yellow-100 text-yellow-800 font-bold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'test':
        return 'フリー';
      case 'monitor':
        return 'モニター';
      case 'regular':
        return '正規';
      case 'pro':
        return 'プロ';
      case 'unlimited':
        return '無制限';
      default:
        return plan;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '有効';
      case 'trial':
        return 'トライアル';
      case 'canceled':
        return 'キャンセル';
      case 'past_due':
        return '支払い遅延';
      default:
        return status;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">組織一覧</h1>
        <div className="text-sm text-gray-500">全{organizations.length}組織</div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて ({organizations.length})
          </button>
          <button
            onClick={() => setFilter('test')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'test'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            フリー ({organizations.filter((o) => o.subscription.plan === 'test').length})
          </button>
          <button
            onClick={() => setFilter('monitor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'monitor'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            モニター ({organizations.filter((o) => o.subscription.plan === 'monitor').length})
          </button>
          <button
            onClick={() => setFilter('regular')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'regular'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            正規 ({organizations.filter((o) => o.subscription.plan === 'regular').length})
          </button>
          <button
            onClick={() => setFilter('pro')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pro'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            プロ ({organizations.filter((o) => o.subscription.plan === 'pro').length})
          </button>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                氏名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                プラン
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                利用状況
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrganizations.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {org.ownerName || org.name || '(未設定)'}
                      </div>
                      {org.ownerEmail && <div className="text-sm text-gray-500">{org.ownerEmail}</div>}
                      <div className="text-xs text-gray-400">ID: {org.id}</div>
                    </div>
                    {org.disabled && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        無効
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadgeColor(
                      org.subscription.plan
                    )}`}
                  >
                    {getPlanLabel(org.subscription.plan)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                      org.subscription.status
                    )}`}
                  >
                    {getStatusLabel(org.subscription.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>申込: {org.usage.applicationsThisMonth}/{org.subscription.limits.maxApplicationsPerMonth}</div>
                  <div>イベント: {org.usage.eventsCount}/{org.subscription.limits.maxEvents}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {org.createdAt?.toDate?.()?.toLocaleDateString?.('ja-JP') || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          該当する組織がありません
        </div>
      )}
    </div>
  );
}
