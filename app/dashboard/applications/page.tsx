'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Mail, Phone, Calendar, MapPin, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Application, Event } from '@/types';

interface LineUser {
  userId: string;
  displayName: string;
}

export default function ApplicationsPage() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showLineSetupWarning, setShowLineSetupWarning] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [lineUsers, setLineUsers] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!userData?.organizationId) return;

    const fetchData = async () => {
      try {
        // Fetch applications
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('organizationId', '==', userData.organizationId),
          orderBy('createdAt', 'desc')
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsData = applicationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];

        // Fetch events
        const eventsQuery = query(
          collection(db, 'events'),
          where('organizationId', '==', userData.organizationId)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];

        // Get unique userIds from applications
        const userIds = [...new Set(applicationsData.map(app => app.userId).filter((id): id is string => !!id))];

        // Fetch LINE users for these userIds
        const lineUsersMap = new Map<string, string>();
        for (const userId of userIds) {
          try {
            const userDoc = await getDoc(doc(db, 'line_users', userId));
            if (userDoc.exists()) {
              const data = userDoc.data();
              lineUsersMap.set(userId, data.displayName || userId);
            }
          } catch (error) {
            console.error(`Error fetching LINE user ${userId}:`, error);
          }
        }

        setApplications(applicationsData);
        setEvents(eventsData);
        setLineUsers(lineUsersMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  // Check LINE setup status
  useEffect(() => {
    if (!userData?.organizationId || !user) return;

    const checkLineSetup = async () => {
      try {
        // Fetch organization data
        const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
        if (!orgDoc.exists()) return;

        const orgData = orgDoc.data();
        const hasLineSetup = !!(orgData.lineChannelId && orgData.liffId);

        // Initially set warning based on organization data
        let shouldShowWarning = !hasLineSetup;

        // Check secrets via API
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

            shouldShowWarning = !hasLineSetup || !hasSecrets;
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        }

        // Set the warning state
        setShowLineSetupWarning(shouldShowWarning);
      } catch (error) {
        console.error('Error checking LINE setup:', error);
      }
    };

    checkLineSetup();
  }, [userData, user]);

  const getEventTitle = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    return event?.title || 'イベント不明';
  };

  const getDisplayName = (application: Application) => {
    if (application.name) {
      return application.name;
    }
    if (application.userId) {
      return lineUsers.get(application.userId) || application.userId;
    }
    return '名前なし';
  };

  const handleExportCSV = () => {
    // Create CSV content (support both LINE and dashboard applications)
    const headers = ['名前/ユーザーID', 'メールアドレス', '電話番号', 'イベント/プラン', '開催日時', '申込日時', 'ステータス'];
    const rows = filteredApplications.map((app) => {
      const normalizedStatus = app.status === 'applied' ? '申込済' :
                               app.status === 'canceled' ? 'キャンセル' :
                               app.status === 'confirmed' ? '確認済' :
                               app.status === 'cancelled' ? 'キャンセル' : '保留中';
      return [
        getDisplayName(app),
        app.email || '',
        app.phone || '',
        app.eventId ? getEventTitle(app.eventId) : (app.plan || ''),
        app.slotAt?.toDate ? app.slotAt.toDate().toLocaleString('ja-JP') : '',
        app.createdAt?.toDate ? app.createdAt.toDate().toLocaleString('ja-JP') : '',
        normalizedStatus,
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filter applications (support both LINE and dashboard applications)
  const filteredApplications = applications.filter((app) => {
    const displayName = getDisplayName(app);
    const matchesSearch =
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (app.phone?.includes(searchTerm) ?? false) ||
      (app.plan?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    // Map 'applied' to 'pending' and 'canceled' to 'cancelled' for legacy data
    const normalizedStatus = app.status === 'applied' ? 'pending' :
                             app.status === 'canceled' ? 'cancelled' :
                             app.status;
    const matchesStatus = filterStatus === 'all' || normalizedStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

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
    <div className="relative space-y-6">
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
                  申込管理機能を使用するには、設定画面でLINE Messaging APIの認証情報を設定する必要があります。
                  <br /><br />
                  設定が完了するまで、申込管理機能はご利用いただけません。
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">申込者管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            全ての申込者を確認・管理できます
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          CSVエクスポート
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">総申込数</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {applications.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">確認済</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {applications.filter((a) => a.status === 'confirmed' || a.status === 'applied').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">保留中</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {applications.filter((a) => a.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">キャンセル</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {applications.filter((a) => a.status === 'cancelled' || a.status === 'canceled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="名前、メール、電話番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                全て
              </Button>
              <Button
                variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('confirmed')}
              >
                確認済
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                保留中
              </Button>
              <Button
                variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('cancelled')}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            申込一覧 ({filteredApplications.length}件)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {searchTerm || filterStatus !== 'all'
                ? '検索条件に一致する申込がありません'
                : '申込がありません'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((application) => {
                const slotDate = application.slotAt?.toDate
                  ? application.slotAt.toDate().toLocaleString('ja-JP')
                  : '未設定';
                const createdDate = application.createdAt?.toDate
                  ? application.createdAt.toDate().toLocaleString('ja-JP')
                  : '未設定';

                // Support both LINE and dashboard applications
                const displayName = getDisplayName(application);
                const displayEvent = application.eventId
                  ? getEventTitle(application.eventId)
                  : (application.plan || 'イベント/プラン不明');

                const normalizedStatus = application.status === 'applied' ? 'pending' :
                                       application.status === 'canceled' ? 'cancelled' :
                                       application.status;
                const isConfirmed = application.status === 'confirmed' || application.status === 'applied';
                const isCancelled = application.status === 'cancelled' || application.status === 'canceled';

                return (
                  <div
                    key={application.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">
                          {displayName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {displayEvent}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isConfirmed
                            ? 'bg-green-100 text-green-800'
                            : isCancelled
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {isConfirmed
                          ? '確認済'
                          : isCancelled
                          ? 'キャンセル'
                          : '保留中'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {application.email && (
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {application.email}
                        </div>
                      )}
                      {application.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {application.phone}
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        開催日時: {slotDate}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        申込日時: {createdDate}
                      </div>
                      {application.notes && (
                        <div className="flex items-center text-gray-600 md:col-span-2">
                          <span className="font-medium mr-2">備考:</span>
                          {application.notes}
                        </div>
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
