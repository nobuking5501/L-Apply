'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Organization {
  id: string;
  name?: string;
  email?: string;
  liffId: string;
  lineChannelAccessToken: string;
  lineChannelSecret: string;
  disabled?: boolean;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  lineDisplayName?: string;
  lineUserId?: string;
  subscription: {
    plan: 'test' | 'monitor';
    status: 'active' | 'trial' | 'canceled' | 'past_due';
    limits: {
      maxEvents: number;
      maxStepDeliveries: number;
      maxReminders: number;
      maxApplicationsPerMonth: number;
    };
    trialEndsAt: any;
    currentPeriodStart: any;
    currentPeriodEnd: any;
  };
  usage: {
    eventsCount: number;
    stepDeliveriesCount: number;
    remindersCount: number;
    applicationsThisMonth: number;
    lastResetAt: any;
  };
  addons?: {
    [key: string]: {
      purchased: boolean;
      purchasedAt?: any;
      stripePaymentIntentId?: string;
      amountPaid?: number;
      manuallyEnabled?: boolean;
      enabledBy?: string;
      enabledAt?: any;
    };
  };
  createdAt: any;
  updatedAt: any;
}

function getPlanLimits(plan: string) {
  switch (plan) {
    case 'test':
      return {
        maxEvents: 1,
        maxStepDeliveries: 0,
        maxReminders: 0,
        maxApplicationsPerMonth: 10,
      };
    case 'monitor':
      return {
        maxEvents: 10,
        maxStepDeliveries: 3,
        maxReminders: 10,
        maxApplicationsPerMonth: 300,
      };
    default:
      return {
        maxEvents: 1,
        maxStepDeliveries: 0,
        maxReminders: 0,
        maxApplicationsPerMonth: 10,
      };
  }
}

export default function OrganizationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [params.id]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'organizations', params.id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Organization not found');
      }

      const data = docSnap.data();

      // Fetch owner user information
      let ownerName = '';
      let ownerEmail = '';
      if (data.ownerId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', data.ownerId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            ownerName = userData.displayName || '';
            ownerEmail = userData.email || '';
          }
        } catch (err) {
          console.error('Failed to fetch owner info:', err);
        }
      }

      setOrganization({
        id: docSnap.id,
        name: data.name || '',
        email: data.email || '',
        liffId: data.liffId || '',
        lineChannelAccessToken: data.lineChannelAccessToken || '',
        lineChannelSecret: data.lineChannelSecret || '',
        disabled: data.disabled || false,
        ownerId: data.ownerId || '',
        ownerName,
        ownerEmail,
        lineDisplayName: data.lineDisplayName || '',
        lineUserId: data.lineUserId || '',
        subscription: data.subscription || {
          plan: 'test',
          status: 'trial',
          limits: getPlanLimits('test'),
          trialEndsAt: null,
          currentPeriodStart: Timestamp.now(),
          currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        },
        usage: data.usage || {
          eventsCount: 0,
          stepDeliveriesCount: 0,
          remindersCount: 0,
          applicationsThisMonth: 0,
          lastResetAt: Timestamp.now(),
        },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    } catch (err) {
      setError('組織情報の取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (newPlan: string) => {
    if (!confirm(`プランを${newPlan}に変更しますか？`)) {
      return;
    }

    try {
      setUpdating(true);
      const docRef = doc(db, 'organizations', params.id);
      const newLimits = getPlanLimits(newPlan);

      await updateDoc(docRef, {
        'subscription.plan': newPlan,
        'subscription.limits': newLimits,
        updatedAt: Timestamp.now(),
      });

      await fetchOrganization();
      alert('プランを更新しました');
    } catch (err) {
      alert('プランの更新に失敗しました');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`ステータスを${newStatus}に変更しますか？`)) {
      return;
    }

    try {
      setUpdating(true);
      const docRef = doc(db, 'organizations', params.id);

      await updateDoc(docRef, {
        'subscription.status': newStatus,
        updatedAt: Timestamp.now(),
      });

      await fetchOrganization();
      alert('ステータスを更新しました');
    } catch (err) {
      alert('ステータスの更新に失敗しました');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const toggleDisabled = async () => {
    const newDisabled = !organization?.disabled;
    const action = newDisabled ? '無効化' : '有効化';

    if (!confirm(`このアカウントを${action}しますか？\n\n${newDisabled ? 'アカウントが無効化されると、ユーザーはログインできなくなります。' : 'アカウントを再度有効化します。'}`)) {
      return;
    }

    try {
      setUpdating(true);
      const docRef = doc(db, 'organizations', params.id);

      await updateDoc(docRef, {
        disabled: newDisabled,
        updatedAt: Timestamp.now(),
      });

      await fetchOrganization();
      alert(`アカウントを${action}しました`);
    } catch (err) {
      alert(`アカウントの${action}に失敗しました`);
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const toggleAddon = async (addonId: string) => {
    if (!organization) return;

    const currentState = organization.addons?.[addonId];
    const isEnabled = currentState?.purchased || currentState?.manuallyEnabled;
    const action = isEnabled ? '無効化' : '有効化';

    if (!confirm(`サポートサービスを${action}しますか？`)) {
      return;
    }

    try {
      setUpdating(true);
      const docRef = doc(db, 'organizations', params.id);

      if (isEnabled) {
        // 無効化
        await updateDoc(docRef, {
          [`addons.${addonId}`]: {
            purchased: false,
            manuallyEnabled: false,
          },
          updatedAt: Timestamp.now(),
        });
      } else {
        // 有効化
        await updateDoc(docRef, {
          [`addons.${addonId}`]: {
            purchased: false,
            manuallyEnabled: true,
            enabledBy: 'admin',
            enabledAt: Timestamp.now(),
          },
          updatedAt: Timestamp.now(),
        });
      }

      await fetchOrganization();
      alert(`サポートサービスを${action}しました`);
    } catch (err) {
      alert(`サポートサービスの${action}に失敗しました`);
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrganization = async () => {
    if (!confirm('⚠️ このアカウントを完全に削除しますか？\n\nこの操作は取り消せません。組織のすべてのデータが削除されます。')) {
      return;
    }

    if (!confirm('本当に削除しますか？\n\n削除を実行するには「OK」をクリックしてください。')) {
      return;
    }

    try {
      setUpdating(true);
      const docRef = doc(db, 'organizations', params.id);

      await deleteDoc(docRef);

      alert('アカウントを削除しました');
      router.push('/admin/organizations');
    } catch (err) {
      alert('アカウントの削除に失敗しました');
      console.error(err);
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error || '組織が見つかりません'}</p>
        <button
          onClick={() => router.push('/admin/organizations')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← 組織一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/admin/organizations')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            ← 組織一覧に戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-900">組織詳細</h1>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
          {organization.disabled && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
              無効化されています
            </span>
          )}
          {!organization.disabled && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              有効
            </span>
          )}
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">組織ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{organization.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">氏名</dt>
            <dd className="mt-1 text-sm text-gray-900">{organization.ownerName || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
            <dd className="mt-1 text-sm text-gray-900">{organization.ownerEmail || organization.email || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">LINE名</dt>
            <dd className="mt-1 text-sm text-gray-900">{organization.lineDisplayName || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">LINE URL</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {organization.lineUserId ? (
                <a
                  href={`https://line.me/R/ti/p/${organization.lineUserId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://line.me/R/ti/p/{organization.lineUserId}
                </a>
              ) : (
                '-'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">LIFF ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{organization.liffId}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">作成日</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {organization.createdAt ? new Date(organization.createdAt).toLocaleString('ja-JP') : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">更新日</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {organization.updatedAt ? new Date(organization.updatedAt).toLocaleString('ja-JP') : '-'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Subscription Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">サブスクリプション情報</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">プラン</dt>
            <dd className="mt-1">
              <span className="text-lg font-bold text-gray-900">
                {organization.subscription.plan}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">ステータス</dt>
            <dd className="mt-1">
              <span className="text-lg font-bold text-gray-900">
                {organization.subscription.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">課金期間開始</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {organization.subscription.currentPeriodStart
                ? new Date(organization.subscription.currentPeriodStart).toLocaleDateString('ja-JP')
                : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">課金期間終了</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {organization.subscription.currentPeriodEnd
                ? new Date(organization.subscription.currentPeriodEnd).toLocaleDateString('ja-JP')
                : '-'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">プラン変更</label>
            <div className="flex space-x-2">
              <button
                onClick={() => updatePlan('test')}
                disabled={updating || organization.subscription.plan === 'test'}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                フリー (¥0/月)
              </button>
              <button
                onClick={() => updatePlan('monitor')}
                disabled={updating || organization.subscription.plan === 'monitor'}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                モニター (¥1,980/月)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス変更</label>
            <div className="flex space-x-2">
              <button
                onClick={() => updateStatus('active')}
                disabled={updating || organization.subscription.status === 'active'}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                有効
              </button>
              <button
                onClick={() => updateStatus('trial')}
                disabled={updating || organization.subscription.status === 'trial'}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                トライアル
              </button>
              <button
                onClick={() => updateStatus('canceled')}
                disabled={updating || organization.subscription.status === 'canceled'}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage & Limits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">利用状況と制限</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">イベント数</div>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width: `${Math.min(
                        (organization.usage.eventsCount / organization.subscription.limits.maxEvents) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="ml-4 text-sm font-medium text-gray-900">
                {organization.usage.eventsCount} / {organization.subscription.limits.maxEvents}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">ステップ配信数</div>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600"
                    style={{
                      width: `${Math.min(
                        (organization.usage.stepDeliveriesCount /
                          organization.subscription.limits.maxStepDeliveries) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="ml-4 text-sm font-medium text-gray-900">
                {organization.usage.stepDeliveriesCount} /{' '}
                {organization.subscription.limits.maxStepDeliveries}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">リマインド数</div>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600"
                    style={{
                      width: `${Math.min(
                        (organization.usage.remindersCount /
                          organization.subscription.limits.maxReminders) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="ml-4 text-sm font-medium text-gray-900">
                {organization.usage.remindersCount} / {organization.subscription.limits.maxReminders}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">今月の申込数</div>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-600"
                    style={{
                      width: `${Math.min(
                        (organization.usage.applicationsThisMonth /
                          organization.subscription.limits.maxApplicationsPerMonth) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="ml-4 text-sm font-medium text-gray-900">
                {organization.usage.applicationsThisMonth} /{' '}
                {organization.subscription.limits.maxApplicationsPerMonth}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add-ons Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">アドオン管理</h2>
        <div className="space-y-4">
          {/* Support Service Addon */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-base font-medium text-gray-900">サポートサービス</h3>
                  {(() => {
                    const supportAddon = organization.addons?.['support'];
                    const isPurchased = supportAddon?.purchased === true;
                    const isManuallyEnabled = supportAddon?.manuallyEnabled === true;
                    const isEnabled = isPurchased || isManuallyEnabled;

                    return (
                      <>
                        {isEnabled && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            有効
                          </span>
                        )}
                        {!isEnabled && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            無効
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <p className="text-sm text-gray-600">
                  初回設定サポート - LINE連携の設定、基本的な使い方のレクチャーなど
                </p>
                {organization.addons?.['support'] && (
                  <div className="mt-2 space-y-1">
                    {organization.addons['support'].purchased && (
                      <p className="text-xs text-gray-500">
                        💳 購入済み (¥{organization.addons['support'].amountPaid?.toLocaleString() || '15,000'})
                        {organization.addons['support'].purchasedAt && (
                          <span className="ml-2">
                            {new Date(organization.addons['support'].purchasedAt.seconds * 1000).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </p>
                    )}
                    {organization.addons['support'].manuallyEnabled && (
                      <p className="text-xs text-gray-500">
                        🛠️ 管理者による手動有効化
                        {organization.addons['support'].enabledAt && (
                          <span className="ml-2">
                            {new Date(organization.addons['support'].enabledAt.seconds * 1000).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleAddon('support')}
                disabled={updating}
                className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  organization.addons?.['support']?.purchased || organization.addons?.['support']?.manuallyEnabled
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {organization.addons?.['support']?.purchased || organization.addons?.['support']?.manuallyEnabled
                  ? '無効化'
                  : '有効化'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow border-2 border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">危険ゾーン</h2>
        <div className="space-y-4">
          {/* Enable/Disable Account */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                アカウントを{organization.disabled ? '有効化' : '無効化'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {organization.disabled
                  ? 'このアカウントを再度有効化します。ユーザーはログインして利用できるようになります。'
                  : 'このアカウントを無効化します。ユーザーはログインできなくなります。'}
              </p>
            </div>
            <button
              onClick={toggleDisabled}
              disabled={updating}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                organization.disabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {organization.disabled ? '有効化' : '無効化'}
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">アカウントを削除</h3>
              <p className="text-sm text-gray-600 mt-1">
                このアカウントとすべての関連データを完全に削除します。この操作は取り消せません。
              </p>
            </div>
            <button
              onClick={deleteOrganization}
              disabled={updating}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
