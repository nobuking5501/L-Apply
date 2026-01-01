'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EnableAddonPage() {
  const [organizationId, setOrganizationId] = useState('org_FBJtNjU9xpdfgkinWm9Ut5C0nUc2');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnable = async () => {
    if (!organizationId.trim()) {
      setError('Organization ID is required');
      return;
    }

    if (!adminKey.trim()) {
      setError('Admin key is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/enable-addon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organizationId.trim(),
          adminKey: adminKey.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable addon');
      }

      setResult(data);
      setError(null);
    } catch (err) {
      console.error('Error enabling addon:', err);
      setError(err instanceof Error ? err.message : 'Failed to enable addon');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">管理者ツール: サポートアドオン有効化</CardTitle>
            <CardDescription>
              購入フローで問題が発生した場合に、手動でサポートアドオンを有効化します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-medium">
                ⚠️ このツールは管理者専用です。実行前に決済が完了していることを確認してください。
              </p>
            </div>

            {/* Organization ID */}
            <div className="space-y-2">
              <Label htmlFor="orgId">組織ID</Label>
              <Input
                id="orgId"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="org_xxxxxxxxxxxxx"
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Firestoreまたはユーザーのダッシュボードから取得できます
              </p>
            </div>

            {/* Admin Key */}
            <div className="space-y-2">
              <Label htmlFor="adminKey">管理者キー</Label>
              <Input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="環境変数 ADMIN_SECRET_KEY の値"
              />
              <p className="text-xs text-gray-500">
                Vercelの環境変数 ADMIN_SECRET_KEY に設定されている値を入力してください
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900 font-medium">❌ {error}</p>
              </div>
            )}

            {/* Success Display */}
            {result && result.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-green-900 font-medium">
                  ✅ {result.message}
                </p>
                {result.organization && (
                  <div className="text-xs text-green-800 mt-2">
                    <p>組織ID: {result.organization.id}</p>
                    <p>組織名: {result.organization.name}</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm text-green-900 font-medium">次のステップ:</p>
                  <ol className="list-decimal list-inside text-sm text-green-800 mt-2 space-y-1">
                    <li>ユーザーにブラウザをリフレッシュしてもらう</li>
                    <li>/dashboard/settings にアクセスできるようになります</li>
                    <li>購入フローの問題を調査する</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <Button
              onClick={handleEnable}
              disabled={loading || !organizationId.trim() || !adminKey.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  処理中...
                </>
              ) : (
                'サポートアドオンを有効化'
              )}
            </Button>

            {/* Instructions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">使い方:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>対象の組織IDを確認して入力</li>
                <li>Vercelの環境変数から ADMIN_SECRET_KEY を取得して入力</li>
                <li>「サポートアドオンを有効化」ボタンをクリック</li>
                <li>成功したら、ユーザーにブラウザをリフレッシュしてもらう</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
