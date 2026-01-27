'use client';

import { useState } from 'react';

export default function FixOrgApplicationsPage() {
  const [orgId, setOrgId] = useState('org_XOVcuVO7o6Op6idItDHsqiBgdBD3');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFix = async () => {
    if (!orgId.trim()) {
      alert('組織IDを入力してください');
      return;
    }

    if (!confirm(`組織 ${orgId} の申込データを修正しますか？\n\nこの操作は元に戻せません。`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/fix-org-applications?orgId=${encodeURIComponent(orgId)}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">申込データ修正ツール</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-yellow-800 mb-2">⚠️ 注意</h2>
        <p className="text-sm text-yellow-700">
          このツールは、organizationIdが設定されていない申込データを修正します。
          <br />
          実行前に必ずバックアップを取得してください。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">組織ID</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="組織IDを入力"
          />
          <button
            onClick={handleFix}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '処理中...' : '修正実行'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">❌ エラー</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {result.success ? '✅ 修正完了' : '❌ 修正失敗'}
          </h2>

          {result.organization && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">組織情報</h3>
              <dl className="text-sm space-y-1">
                <div>
                  <dt className="inline font-medium">ID:</dt>
                  <dd className="inline ml-2">{result.organization.id}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">名前:</dt>
                  <dd className="inline ml-2">{result.organization.name || '(なし)'}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">ユーザー数:</dt>
                  <dd className="inline ml-2">{result.users.length}人</dd>
                </div>
              </dl>
            </div>
          )}

          {result.users && result.users.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">ユーザー一覧</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                {result.users.map((user: any) => (
                  <li key={user.userId}>
                    {user.displayName || '名前なし'} ({user.userId})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">修正結果</h3>
            <dl className="text-sm space-y-1">
              <div>
                <dt className="inline font-medium">修正した申込:</dt>
                <dd className="inline ml-2">{result.fixedCount}件</dd>
              </div>
              <div>
                <dt className="inline font-medium">既に設定済み:</dt>
                <dd className="inline ml-2">{result.alreadyFixedCount}件</dd>
              </div>
              <div>
                <dt className="inline font-medium">合計:</dt>
                <dd className="inline ml-2">{result.totalCount}件</dd>
              </div>
            </dl>
          </div>

          {result.fixedApplications && result.fixedApplications.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">修正した申込</h3>
              <div className="text-sm space-y-2">
                {result.fixedApplications.map((app: any) => (
                  <div key={app.applicationId} className="p-3 bg-gray-50 rounded border">
                    <div>申込ID: {app.applicationId}</div>
                    <div>ユーザーID: {app.userId}</div>
                    <div>ステータス: {app.status}</div>
                    <div>予約日時: {new Date(app.slotAt).toLocaleString('ja-JP')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.fixedCount > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ 修正が完了しました。これでキャンセル機能が正常に動作するはずです。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
