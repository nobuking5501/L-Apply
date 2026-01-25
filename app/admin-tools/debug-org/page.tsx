'use client';

import { useState } from 'react';

interface DebugResult {
  organization?: any;
  secrets?: any;
  activeEvents?: any[];
  subscription?: any;
  issues: string[];
}

export default function DebugOrgPage() {
  const [orgId, setOrgId] = useState('org_XOVcuVO7o6Op6idItDHsqiBgdBD3');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDebug = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/debug-organization?orgId=${encodeURIComponent(orgId)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to debug organization');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">組織デバッグツール</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            組織ID
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="org_xxxxx"
            />
            <button
              onClick={handleDebug}
              disabled={loading || !orgId}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '確認中...' : '確認'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">エラー</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Issues Summary */}
            {result.issues.length > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-red-800 mb-4">❌ 問題が見つかりました</h2>
                <ul className="space-y-2">
                  {result.issues.map((issue, index) => (
                    <li key={index} className="text-red-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-800">✅ 問題は見つかりませんでした</h2>
                <p className="text-green-700 mt-2">組織の設定は正常です。</p>
              </div>
            )}

            {/* Organization Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">1. 組織情報</h2>
              {result.organization ? (
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-600">名前:</span>
                    <span>{result.organization.name || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-600">LIFF ID:</span>
                    <span className={result.organization.liffId ? 'text-green-600' : 'text-red-600'}>
                      {result.organization.liffId || '❌ 未設定'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-600">LINE Channel ID:</span>
                    <span>{result.organization.lineChannelId || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-red-600">❌ 組織が見つかりません</p>
              )}
            </div>

            {/* Secrets */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">2. 認証情報 (organization_secrets)</h2>
              {result.secrets ? (
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-600">Access Token:</span>
                    <span className={result.secrets.hasAccessToken ? 'text-green-600' : 'text-red-600'}>
                      {result.secrets.hasAccessToken ? '✅ 設定済み' : '❌ 未設定'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-600">Channel Secret:</span>
                    <span className={result.secrets.hasChannelSecret ? 'text-green-600' : 'text-red-600'}>
                      {result.secrets.hasChannelSecret ? '✅ 設定済み' : '❌ 未設定'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-red-600">❌ 認証情報が見つかりません</p>
              )}
            </div>

            {/* Active Events */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">3. アクティブなイベント</h2>
              {result.activeEvents && result.activeEvents.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-green-600 font-semibold">
                    ✅ {result.activeEvents.length}件のアクティブなイベント
                  </p>
                  {result.activeEvents.map((event, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <p className="text-sm text-gray-600">開催場所: {event.location}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">予約枠:</p>
                        {event.slots && event.slots.length > 0 ? (
                          <ul className="text-sm text-gray-600 ml-4">
                            {event.slots.map((slot: any, idx: number) => {
                              const current = slot.currentCapacity || 0;
                              const max = slot.maxCapacity || 0;
                              const isFull = current >= max;
                              return (
                                <li key={idx} className={isFull ? 'text-red-600' : 'text-green-600'}>
                                  {slot.date} {slot.time} - {current}/{max}
                                  {isFull && ' (満席)'}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-red-600 text-sm ml-4">予約枠がありません</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-600">❌ アクティブなイベントがありません</p>
              )}
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">4. サブスクリプション</h2>
              {result.subscription ? (
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-600">プラン:</span>
                    <span>{result.subscription.tier || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-600">ステータス:</span>
                    <span>{result.subscription.status || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-600">申込上限:</span>
                    <span>{result.subscription.applicationLimit || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-600">現在の申込数:</span>
                    <span className={
                      result.subscription.currentApplicationCount >= result.subscription.applicationLimit
                        ? 'text-red-600 font-bold'
                        : 'text-green-600'
                    }>
                      {result.subscription.currentApplicationCount || 0}
                    </span>
                  </div>
                  {result.subscription.currentApplicationCount >= result.subscription.applicationLimit && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-700 font-semibold">⚠️ 申込上限に達しています</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-yellow-600">⚠️ サブスクリプション情報がありません</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
