'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, TrendingUp, AlertCircle, MapPin, Clock, PhoneCall, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { Event, Application, Organization } from '@/types';

interface SlotStats {
  slotId: string;
  date: string;
  time: string;
  capacity: number;
  appliedCount: number;
  phoneCount: number;
  lineCount: number;
  availableCount: number;
  isFull: boolean;
}

interface EventWithStats {
  event: Event;
  slots: SlotStats[];
  totalApplied: number;
  totalCapacity: number;
}

export default function DashboardPage() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [showLineSetupWarning, setShowLineSetupWarning] = useState(false);
  const [stats, setStats] = useState({
    activeEventApplications: 0,
    totalCapacity: 0,
    monthlyApplications: 0,
  });
  const [eventsWithStats, setEventsWithStats] = useState<EventWithStats[]>([]);

  useEffect(() => {
    if (!userData?.organizationId || !user) return;

    const fetchDashboardData = async () => {
      try {
        const orgId = userData.organizationId;

        const orgDoc = await getDoc(doc(db, 'organizations', orgId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data() as Organization;
          setOrganization(orgData);

          const hasLineSetup = !!(orgData.lineChannelId && orgData.liffId);
          let shouldShowWarning = !hasLineSetup;

          try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/settings', {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${idToken}` },
            });
            if (response.ok) {
              const data = await response.json();
              const hasSecrets = data.secretsMetadata?.hasChannelSecret &&
                                 data.secretsMetadata?.hasChannelAccessToken;
              shouldShowWarning = !hasLineSetup || !hasSecrets;
            }
          } catch (error) {
            console.error('Error checking LINE setup:', error);
          }

          setShowLineSetupWarning(shouldShowWarning);
        }

        const [eventsSnapshot, applicationsSnapshot] = await Promise.all([
          getDocs(query(
            collection(db, 'events'),
            where('organizationId', '==', orgId),
            where('isActive', '==', true)
          )),
          getDocs(query(
            collection(db, 'applications'),
            where('organizationId', '==', orgId),
            orderBy('createdAt', 'desc')
          )),
        ]);

        const events = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];

        const applications = applicationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];

        // スロットごとの申込数を集計（キャンセル除外）
        const slotAppliedMap = new Map<string, { total: number; phone: number; line: number }>();
        for (const app of applications) {
          const isCanceled = app.status === 'canceled' || app.status === 'cancelled';
          if (isCanceled || !app.slotId) continue;

          const current = slotAppliedMap.get(app.slotId) ?? { total: 0, phone: 0, line: 0 };
          current.total += 1;
          if ((app as any).source === 'phone') {
            current.phone += 1;
          } else {
            current.line += 1;
          }
          slotAppliedMap.set(app.slotId, current);
        }

        // イベントごとの統計を組み立て
        const built: EventWithStats[] = events.map((event) => {
          const slots: SlotStats[] = (event.slots || []).map((slot) => {
            const counts = slotAppliedMap.get(slot.id) ?? { total: 0, phone: 0, line: 0 };
            const capacity = slot.maxCapacity || 0;
            return {
              slotId: slot.id,
              date: slot.date ?? '',
              time: slot.time ?? '',
              capacity,
              appliedCount: counts.total,
              phoneCount: counts.phone,
              lineCount: counts.line,
              availableCount: Math.max(0, capacity - counts.total),
              isFull: capacity > 0 && counts.total >= capacity,
            };
          });

          const totalApplied = slots.reduce((s, sl) => s + sl.appliedCount, 0);
          const totalCapacity = slots.reduce((s, sl) => s + sl.capacity, 0);

          return { event, slots, totalApplied, totalCapacity };
        });

        setEventsWithStats(built);

        // サマリー統計
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const activeEventIds = new Set(events.map((e) => e.id));

        const activeEventApps = applications.filter(
          (app) =>
            app.eventId &&
            activeEventIds.has(app.eventId) &&
            app.status !== 'cancelled' &&
            app.status !== 'canceled'
        );

        const monthlyApps = applications.filter(
          (app) => app.createdAt?.toDate?.() >= firstDayOfMonth
        );

        const totalCapacity = built.reduce((s, e) => s + e.totalCapacity, 0);

        setStats({
          activeEventApplications: activeEventApps.length,
          totalCapacity,
          monthlyApplications: monthlyApps.length,
        });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">公開中イベントの申込者数</p>
                <div className="flex items-baseline mt-2 gap-1">
                  <p className="text-3xl font-bold text-gray-900">{stats.activeEventApplications}</p>
                  <p className="text-lg text-gray-400">/ {stats.totalCapacity}</p>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今月の総申込者数</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.monthlyApplications}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* イベント別空き状況 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            公開中イベントの空き状況
            <span className="text-sm font-normal text-gray-500">({eventsWithStats.length}件)</span>
          </h3>
          <Link href="/dashboard/applications" className="text-sm text-blue-600 hover:underline">
            申込者一覧 →
          </Link>
        </div>

        {eventsWithStats.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-gray-500">公開中のイベントがありません</p>
              <Link
                href="/dashboard/events"
                className="inline-block mt-3 text-sm text-blue-600 hover:underline"
              >
                イベントを作成する →
              </Link>
            </CardContent>
          </Card>
        ) : (
          eventsWithStats.map(({ event, slots, totalApplied, totalCapacity }) => (
            <Card key={event.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    {event.location && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {totalApplied}
                      <span className="text-gray-400 font-normal"> / {totalCapacity}名</span>
                    </p>
                    <p className="text-xs text-gray-500">合計申込 / 定員</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {slots.length === 0 ? (
                  <p className="text-xs text-gray-400">日程が設定されていません</p>
                ) : (
                  slots.map((slot) => {
                    const pct = slot.capacity > 0
                      ? Math.min(100, Math.round((slot.appliedCount / slot.capacity) * 100))
                      : 0;
                    const barColor =
                      pct >= 100 ? 'bg-red-500' :
                      pct >= 80  ? 'bg-orange-400' :
                      'bg-blue-500';

                    return (
                      <div key={slot.slotId} className="border rounded-lg p-3 bg-gray-50">
                        {/* 日時・残席ヘッダー */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {slot.date} {slot.time}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            slot.isFull
                              ? 'bg-red-100 text-red-700'
                              : slot.availableCount <= 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {slot.isFull ? '満席' : `残り ${slot.availableCount} 名`}
                          </span>
                        </div>

                        {/* プログレスバー */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className={`${barColor} h-2 rounded-full transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* 申込数内訳 */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3 text-green-600" />
                              LINE {slot.lineCount}名
                            </span>
                            <span className="flex items-center gap-1">
                              <PhoneCall className="h-3 w-3 text-orange-500" />
                              電話 {slot.phoneCount}名
                            </span>
                          </div>
                          <span className="text-gray-600 font-medium">
                            {slot.appliedCount} / {slot.capacity}名
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
