'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { StepDelivery } from '@/types';

// Step message configuration from backend
const STEP_MESSAGES = [
  {
    step: 1,
    delayDays: 1,
    title: 'セミナー翌日',
    description: '個別相談の案内（初回）',
  },
  {
    step: 2,
    delayDays: 3,
    title: 'セミナー3日後',
    description: '個別相談の案内（リマインド）',
  },
  {
    step: 3,
    delayDays: 7,
    title: 'セミナー7日後',
    description: '個別相談の案内（最終）',
  },
];

export default function StepDeliveryPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<StepDelivery[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    skipped: 0,
  });

  useEffect(() => {
    if (!userData?.organizationId) return;

    const fetchDeliveries = async () => {
      try {
        const deliveriesQuery = query(
          collection(db, 'step_deliveries'),
          where('organizationId', '==', userData.organizationId),
          orderBy('scheduledAt', 'desc')
        );
        const snapshot = await getDocs(deliveriesQuery);
        const deliveriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as StepDelivery[];

        setDeliveries(deliveriesData);

        // Calculate stats
        const stats = {
          total: deliveriesData.length,
          pending: deliveriesData.filter((d) => d.status === 'pending').length,
          sent: deliveriesData.filter((d) => d.status === 'sent').length,
          skipped: deliveriesData.filter((d) => d.status === 'skipped').length,
        };
        setStats(stats);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, [userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: '総配信数',
      value: stats.total,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '配信待ち',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: '配信済み',
      value: stats.sent,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'スキップ',
      value: stats.skipped,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ステップ配信設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          セミナー後の自動配信メッセージを管理します
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Step Templates */}
      <Card>
        <CardHeader>
          <CardTitle>配信ステップ設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {STEP_MESSAGES.map((step) => (
              <div
                key={step.step}
                className="flex items-start p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold mr-4">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    セミナー日時の{step.delayDays}日後に配信
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {deliveries.filter((d) => d.stepNumber === step.step && d.status === 'sent')
                      .length}
                  </div>
                  <div className="text-xs text-gray-500">配信済み</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>注意:</strong>{' '}
              ステップ配信のメッセージ内容を変更する場合は、functions/src/config/step-messages.ts
              ファイルを編集し、再デプロイしてください。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>最近の配信履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              配信履歴がありません
            </p>
          ) : (
            <div className="space-y-3">
              {deliveries.slice(0, 10).map((delivery) => {
                const scheduledDate = delivery.scheduledAt?.toDate
                  ? delivery.scheduledAt.toDate().toLocaleString('ja-JP')
                  : '未設定';
                const sentDate = delivery.sentAt?.toDate
                  ? delivery.sentAt.toDate().toLocaleString('ja-JP')
                  : '-';

                return (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">
                          ステップ {delivery.stepNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            delivery.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : delivery.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {delivery.status === 'sent'
                            ? '配信済み'
                            : delivery.status === 'pending'
                            ? '配信待ち'
                            : 'スキップ'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        配信予定: {scheduledDate}
                      </div>
                      {delivery.sentAt && (
                        <div className="text-xs text-gray-500">配信日時: {sentDate}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
