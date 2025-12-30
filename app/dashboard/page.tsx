'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Send, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Event, Application, StepDelivery, Organization } from '@/types';

export default function DashboardPage() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [showLineSetupWarning, setShowLineSetupWarning] = useState(false);
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
    if (!userData?.organizationId || !user) return;

    const fetchDashboardData = async () => {
      try {
        const orgId = userData.organizationId;

        // Fetch organization data to check LINE setup
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data() as Organization;
          setOrganization(orgData);

          // Check if LINE credentials are set up
          const hasLineSetup = !!(orgData.lineChannelId && orgData.liffId);

          // デバッグログ
          console.log('=== LINE Setup Debug ===');
          console.log('Organization ID:', userData.organizationId);
          console.log('lineChannelId:', orgData.lineChannelId);
          console.log('liffId:', orgData.liffId);
          console.log('hasLineSetup:', hasLineSetup);

          // Initially set warning based on organization data
          let shouldShowWarning = !hasLineSetup;
          console.log('Initial shouldShowWarning:', shouldShowWarning);

          // Check secrets via API
          if (user) {
            try {
              const idToken = await user.getIdToken();
              const response = await fetch('/api/settings', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                const hasSecrets = data.secretsMetadata?.hasChannelSecret &&
                                   data.secretsMetadata?.hasChannelAccessToken;

                // Show warning if any LINE credential is missing
                shouldShowWarning = !hasLineSetup || !hasSecrets;
              }
            } catch (error) {
              console.error('Error checking LINE setup:', error);
            }
          }

          // Set the warning state (will be true if org data incomplete OR API check failed/returned incomplete)
          console.log('Final shouldShowWarning:', shouldShowWarning);
          console.log('======================');
          setShowLineSetupWarning(shouldShowWarning);
        }

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
  }, [userData, user]);

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
    <div className="relative space-y-8">
      {/* LINE Setup Blocking Overlay */}
      {showLineSetupWarning && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 border-amber-300 bg-white shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  LINE連携の設定が必要です
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  L-Applyの機能を使用するには、設定画面でLINE Messaging APIの認証情報を設定する必要があります。
                  <br /><br />
                  設定が完了するまで、ダッシュボードの機能はご利用いただけません。
                </p>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                >
                  設定画面を開く
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
