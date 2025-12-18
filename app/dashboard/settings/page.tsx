'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import type { Organization } from '@/types';

export default function SettingsPage() {
  const { user, userData } = useAuth(); // Get user from AuthContext
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [lineChannelId, setLineChannelId] = useState('');
  const [lineChannelSecret, setLineChannelSecret] = useState('');
  const [lineAccessToken, setLineAccessToken] = useState('');
  const [liffId, setLiffId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');

  useEffect(() => {
    if (!userData?.organizationId) return;

    const fetchOrganization = async () => {
      try {
        // Read public organization info directly from Firestore (allowed by security rules)
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));

        if (orgDoc.exists()) {
          const orgData = { id: orgDoc.id, ...orgDoc.data() } as any;
          setOrganization(orgData);

          // Support both old structure (settings.branding) and new structure (root level)
          const settings = orgData.settings || {};
          const branding = settings.branding || {};

          // DEBUG: Log the data to see what we're getting
          console.log('=== DEBUG: Organization Data ===');
          console.log('Full orgData:', orgData);
          console.log('settings:', settings);
          console.log('branding:', branding);
          console.log('lineChannelId from root:', orgData.lineChannelId);
          console.log('lineChannelId from settings:', settings.lineChannelId);
          console.log('lineChannelId from branding:', branding.lineChannelId);
          console.log('liffId from root:', orgData.liffId);
          console.log('liffId from settings:', settings.liffId);
          console.log('liffId from branding:', branding.liffId);
          console.log('companyName from root:', orgData.companyName);
          console.log('companyName from branding:', branding.companyName);

          // Set form values - check all possible locations for backward compatibility
          setOrgName(orgData.name || '');
          setLineChannelId(orgData.lineChannelId || settings.lineChannelId || branding.lineChannelId || '');
          setLineChannelSecret(''); // Secrets are in organization_secrets, not shown
          setLineAccessToken(''); // Secrets are in organization_secrets, not shown
          setLiffId(orgData.liffId || settings.liffId || branding.liffId || '');
          setCompanyName(orgData.companyName || branding.companyName || '');
          setPrimaryColor(orgData.primaryColor || branding.primaryColor || '#3B82F6');

          // DEBUG: Log what we set
          console.log('=== DEBUG: Set Values ===');
          console.log('Set lineChannelId:', orgData.lineChannelId || settings.lineChannelId || branding.lineChannelId || '');
          console.log('Set liffId:', orgData.liffId || settings.liffId || branding.liffId || '');
          console.log('Set companyName:', orgData.companyName || branding.companyName || '');
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        alert('設定の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.organizationId || !user) return;

    setSaving(true);
    setSuccess(false);

    try {
      // Get ID token for authentication from AuthContext user
      const idToken = await user.getIdToken();

      // Prepare update data (trim values to prevent issues with spaces)
      const updateData: any = {
        name: orgName.trim(),
        lineChannelId: lineChannelId.trim(),
        liffId: liffId.trim(),
        companyName: companyName.trim(),
        primaryColor,
      };

      // Only include secrets if they've been changed (not empty)
      if (lineChannelSecret) {
        updateData.lineChannelSecret = lineChannelSecret;
      }
      if (lineAccessToken) {
        updateData.lineChannelAccessToken = lineAccessToken;
      }

      // Update settings via API
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Clear secret fields after successful save
      setLineChannelSecret('');
      setLineAccessToken('');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('設定の保存に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(label);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('コピーに失敗しました');
    }
  };

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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          組織の設定とLINE連携を管理します
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          設定を保存しました
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle>組織情報</CardTitle>
            <CardDescription>組織の基本情報を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">組織名</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">会社名（表示用）</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="株式会社サンプル"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgId">組織ID（読み取り専用）</Label>
              <Input
                id="orgId"
                value={userData?.organizationId || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">プラン（読み取り専用）</Label>
              <Input
                id="plan"
                value={organization?.plan || 'free'}
                disabled
                className="bg-gray-50 capitalize"
              />
            </div>
          </CardContent>
        </Card>

        {/* LINE Integration */}
        <Card>
          <CardHeader>
            <CardTitle>LINE連携設定</CardTitle>
            <CardDescription>
              LINE Messaging APIの認証情報を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>取得方法:</strong>{' '}
                LINE Developersコンソールで取得できます。
                <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                  LINE Developers →
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lineChannelId">LINE Channel ID</Label>
              <Input
                id="lineChannelId"
                type="text"
                value={lineChannelId}
                onChange={(e) => setLineChannelId(e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lineChannelSecret">LINE Channel Secret</Label>
              <Input
                id="lineChannelSecret"
                type="password"
                value={lineChannelSecret}
                onChange={(e) => setLineChannelSecret(e.target.value)}
                placeholder="変更する場合のみ入力"
              />
              <p className="text-xs text-gray-500">
                セキュリティのため、既存の値は表示されません。変更する場合のみ入力してください。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lineAccessToken">LINE Channel Access Token</Label>
              <Input
                id="lineAccessToken"
                type="password"
                value={lineAccessToken}
                onChange={(e) => setLineAccessToken(e.target.value)}
                placeholder="変更する場合のみ入力"
              />
              <p className="text-xs text-gray-500">
                セキュリティのため、既存の値は表示されません。変更する場合のみ入力してください。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="liffId">LIFF ID</Label>
              <Input
                id="liffId"
                type="text"
                value={liffId}
                onChange={(e) => setLiffId(e.target.value)}
                placeholder="2008405494-nKEy7Pl0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Endpoint URLs (read-only, only shown if LIFF ID is set) */}
        {liffId && (
          <Card>
            <CardHeader>
              <CardTitle>LINE設定URL</CardTitle>
              <CardDescription>
                LINE Developers Consoleとリッチメニューの設定に使用するURLです
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>💡 使い方:</strong>{' '}
                  以下のURLをコピーして、それぞれの場所に設定してください
                </p>
              </div>

              {/* LIFF Endpoint URL */}
              <div className="space-y-2">
                <Label>1. LIFF Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={`https://l-apply.vercel.app/liff/apply?liffId=${liffId}`}
                    readOnly
                    className="bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyUrl(`https://l-apply.vercel.app/liff/apply?liffId=${liffId}`, 'endpoint')}
                  >
                    {copiedUrl === 'endpoint' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  📍 <strong>設定場所:</strong> LINE Developers Console → LIFF → Endpoint URL
                </p>
              </div>

              {/* LIFF URL (for Rich Menu) */}
              <div className="space-y-2">
                <Label>2. LIFF URL（リッチメニュー用）</Label>
                <div className="flex gap-2">
                  <Input
                    value={`https://liff.line.me/${liffId}`}
                    readOnly
                    className="bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyUrl(`https://liff.line.me/${liffId}`, 'liff')}
                  >
                    {copiedUrl === 'liff' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  📍 <strong>設定場所:</strong> LINE Official Account Manager → リッチメニュー → アクション
                </p>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label>3. Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value="https://asia-northeast1-l-apply.cloudfunctions.net/webhook"
                    readOnly
                    className="bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyUrl('https://asia-northeast1-l-apply.cloudfunctions.net/webhook', 'webhook')}
                  >
                    {copiedUrl === 'webhook' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  📍 <strong>設定場所:</strong> LINE Developers Console → Messaging API → Webhook URL
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>ブランディング</CardTitle>
            <CardDescription>
              申込フォームの見た目をカスタマイズします
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">プライマリーカラー</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg" style={{ borderColor: primaryColor }}>
              <h4 className="font-semibold" style={{ color: primaryColor }}>
                プレビュー
              </h4>
              <p className="text-sm text-gray-600 mt-2">
                このカラーが申込フォームのアクセントカラーとして使用されます
              </p>
              <Button
                type="button"
                className="mt-4"
                style={{ backgroundColor: primaryColor }}
              >
                サンプルボタン
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              '保存中...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                設定を保存
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
