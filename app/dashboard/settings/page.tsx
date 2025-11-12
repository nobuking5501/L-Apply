'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle } from 'lucide-react';
import type { Organization } from '@/types';

export default function SettingsPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);

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
        const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
        if (orgDoc.exists()) {
          const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
          setOrganization(orgData);

          // Set form values
          setOrgName(orgData.name || '');
          setLineChannelId(orgData.lineChannelId || '');
          setLineChannelSecret(orgData.lineChannelSecret || '');
          setLineAccessToken(orgData.lineChannelAccessToken || '');
          setLiffId(orgData.liffId || '');
          setCompanyName(orgData.companyName || '');
          setPrimaryColor(orgData.primaryColor || '#3B82F6');
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.organizationId) return;

    setSaving(true);
    setSuccess(false);

    try {
      const orgRef = doc(db, 'organizations', userData.organizationId);
      await updateDoc(orgRef, {
        name: orgName,
        lineChannelId,
        lineChannelSecret,
        lineChannelAccessToken: lineAccessToken,
        liffId,
        companyName,
        primaryColor,
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setSaving(false);
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
                placeholder="••••••••••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lineAccessToken">LINE Channel Access Token</Label>
              <Input
                id="lineAccessToken"
                type="password"
                value={lineAccessToken}
                onChange={(e) => setLineAccessToken(e.target.value)}
                placeholder="••••••••••••••••"
              />
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
