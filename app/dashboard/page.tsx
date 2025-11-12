'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Send, TrendingUp } from 'lucide-react';
import type { Event, Application, StepDelivery } from '@/types';

export default function DashboardPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalApplications: 0,
    monthlyApplications: 0,
    totalDeliveries: 0,
    pendingDeliveries: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (!userData?.organizationId) return;

    const fetchDashboardData = async () => {
      try {
        const orgId = userData.organizationId;

        // Fetch events
        const eventsQuery = query(
          collection(db, 'events'),
          where('organizationId', '==', orgId)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const events = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];

        const activeEvents = events.filter((e) => e.isActive);

        // Fetch applications
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('organizationId', '==', orgId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applications = applicationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];

        // Calculate monthly applications
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyApps = applications.filter(
          (app) => app.createdAt?.toDate() >= firstDayOfMonth
        );

        // Fetch step deliveries
        const deliveriesQuery = query(
          collection(db, 'step_deliveries'),
          where('organizationId', '==', orgId)
        );
        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        const deliveries = deliveriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as StepDelivery[];

        const pendingDeliveries = deliveries.filter((d) => d.status === 'pending');

        setStats({
          totalEvents: events.length,
          activeEvents: activeEvents.length,
          totalApplications: applications.length,
          monthlyApplications: monthlyApps.length,
          totalDeliveries: deliveries.length,
          pendingDeliveries: pendingDeliveries.length,
        });

        setRecentEvents(activeEvents.slice(0, 5));
        setRecentApplications(applications.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      title: 'アクティブイベント',
      value: stats.activeEvents,
      total: stats.totalEvents,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '今月の申込',
      value: stats.monthlyApplications,
      total: stats.totalApplications,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '配信待ち',
      value: stats.pendingDeliveries,
      total: stats.totalDeliveries,
      icon: Send,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: '総申込数',
      value: stats.totalApplications,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-baseline mt-2">
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      {stat.total !== undefined && (
                        <p className="ml-2 text-sm text-gray-500">/ {stat.total}</p>
                      )}
                    </div>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>最近のイベント</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                イベントがありません
              </p>
            ) : (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        event.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {event.isActive ? 'アクティブ' : '非アクティブ'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>最近の申込</CardTitle>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                申込がありません
              </p>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {application.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{application.email}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        application.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : application.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {application.status === 'confirmed'
                        ? '確認済'
                        : application.status === 'cancelled'
                        ? 'キャンセル'
                        : '保留中'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            L-Applyへようこそ！
          </h3>
          <p className="text-sm text-gray-700">
            このダッシュボードでは、イベントの管理、申込者の確認、ステップ配信の設定などが行えます。
            左側のメニューから各機能にアクセスできます。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
