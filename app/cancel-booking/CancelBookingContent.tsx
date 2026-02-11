'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CancelBookingContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  const userId = searchParams.get('userId');
  const orgId = searchParams.get('orgId');

  useEffect(() => {
    if (!userId || !orgId) {
      setError('無効なリンクです。ユーザーIDまたは組織IDが見つかりません。');
      setLoading(false);
      return;
    }

    fetchApplications();
  }, [userId, orgId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cancel-by-link?userId=${userId}&orgId=${orgId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '申込の取得に失敗しました');
      }

      setApplications(data.applications || []);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (applicationId: string) => {
    if (!confirm('本当にこの予約をキャンセルしますか？')) {
      return;
    }

    try {
      setCanceling(applicationId);
      setCancelSuccess(null);
      const response = await fetch(`/api/cancel-by-link?applicationId=${applicationId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'キャンセルに失敗しました');
      }

      setCancelSuccess(applicationId);
      // Remove canceled application from list
      setApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (err: any) {
      alert(`エラー: ${err.message}`);
    } finally {
      setCanceling(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">エラー</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-blue-600 text-5xl mb-4">ℹ️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">予約がありません</h1>
            <p className="text-gray-600">キャンセル可能な予約が見つかりませんでした。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">予約のキャンセル</h1>

          {cancelSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">✅ 予約をキャンセルしました</p>
            </div>
          )}

          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">予約日時</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(app.slotAt).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {app.plan && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">プラン</p>
                      <p className="text-sm font-medium text-gray-900">{app.plan}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleCancel(app.id)}
                  disabled={canceling === app.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    canceling === app.id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {canceling === app.id ? 'キャンセル中...' : 'この予約をキャンセル'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ キャンセルした予約は元に戻せません。
              <br />
              再度予約する場合は、LINEから新しく申込をしてください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
