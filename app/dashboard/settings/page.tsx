'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import type { Organization } from '@/types';
import SupportServiceOverlay from '@/components/SupportServiceOverlay';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, userData } = useAuth(); // Get user from AuthContext
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [hasPurchasedSupport, setHasPurchasedSupport] = useState(false);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [lineChannelId, setLineChannelId] = useState('');
  const [lineChannelSecret, setLineChannelSecret] = useState('');
  const [lineAccessToken, setLineAccessToken] = useState('');
  const [liffId, setLiffId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');

  // Secrets metadata state
  const [secretsMetadata, setSecretsMetadata] = useState<any>(null);
  const [showFullSecret, setShowFullSecret] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);

  useEffect(() => {
    if (!userData?.organizationId || !user) return;

    const fetchOrganization = async () => {
      try {
        // Try to fetch from API first to get both organization data and secrets metadata
        const idToken = await user.getIdToken();
        const response = await fetch('/api/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings from API');
        }

        const data = await response.json();

        if (data.success && data.organization) {
          const orgData = data.organization;
          setOrganization(orgData);

          // Set form values
          setOrgName(orgData.name || '');
          setLineChannelId(orgData.lineChannelId || '');
          setLineChannelSecret(''); // Secrets are never shown, only for updating
          setLineAccessToken(''); // Secrets are never shown, only for updating
          setLiffId(orgData.liffId || '');
          setCompanyName(orgData.companyName || '');
          setPrimaryColor(orgData.primaryColor || '#3B82F6');

          // Set secrets metadata (for display purposes)
          if (data.secretsMetadata) {
            setSecretsMetadata(data.secretsMetadata);
          }

          // Check if support addon is purchased
          setHasPurchasedSupport(orgData.addons?.support?.purchased === true);
        }
      } catch (error) {
        console.error('Error fetching organization from API, falling back to Firestore:', error);

        // Fallback: Fetch directly from Firestore using client SDK
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');

          const orgRef = doc(db, 'organizations', userData.organizationId);
          const orgSnap = await getDoc(orgRef);

          if (orgSnap.exists()) {
            const orgData = orgSnap.data();
            setOrganization({
              id: orgSnap.id,
              name: orgData.name,
              companyName: orgData.companyName,
              primaryColor: orgData.primaryColor,
              liffId: orgData.liffId,
              lineChannelId: orgData.lineChannelId,
              plan: orgData.plan,
              ownerId: orgData.ownerId,
              createdAt: orgData.createdAt,
              addons: orgData.addons || {},
            } as Organization);

            // Set form values
            setOrgName(orgData.name || '');
            setLineChannelId(orgData.lineChannelId || '');
            setLineChannelSecret('');
            setLineAccessToken('');
            setLiffId(orgData.liffId || '');
            setCompanyName(orgData.companyName || '');
            setPrimaryColor(orgData.primaryColor || '#3B82F6');

            // Check if support addon is purchased (from Firestore)
            setHasPurchasedSupport(orgData.addons?.support?.purchased === true);

            console.log('✅ Fallback: Organization data fetched from Firestore, hasPurchasedSupport:', orgData.addons?.support?.purchased === true);

            // Fetch secrets metadata from organization_secrets collection
            // Note: This will fail with permission error (by design), which is handled below
            try {
              const secretsRef = doc(db, 'organization_secrets', userData.organizationId);
              const secretsSnap = await getDoc(secretsRef);

              if (secretsSnap.exists()) {
                const secretsData = secretsSnap.data();
                const channelSecret = secretsData?.lineChannelSecret || '';
                const channelAccessToken = secretsData?.lineChannelAccessToken || '';

                // Helper function to mask string (same as API)
                const maskString = (str: string): string => {
                  if (!str) return '';
                  if (str.length <= 16) {
                    return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
                  }
                  return `${str.substring(0, 8)}...${str.substring(str.length - 8)}`;
                };

                setSecretsMetadata({
                  hasChannelSecret: !!channelSecret,
                  hasChannelAccessToken: !!channelAccessToken,
                  channelSecretMasked: channelSecret ? maskString(channelSecret) : '',
                  channelAccessTokenMasked: channelAccessToken ? maskString(channelAccessToken) : '',
                  channelSecretLength: channelSecret ? channelSecret.length : 0,
                  channelAccessTokenLength: channelAccessToken ? channelAccessToken.length : 0,
                  secretsUpdatedAt: secretsData?.updatedAt || null,
                });

                console.log('✅ Fallback: Secrets metadata fetched from Firestore');
              } else {
                // No secrets document, set empty metadata
                setSecretsMetadata({
                  hasChannelSecret: false,
                  hasChannelAccessToken: false,
                  channelSecretMasked: '',
                  channelAccessTokenMasked: '',
                  channelSecretLength: 0,
                  channelAccessTokenLength: 0,
                  secretsUpdatedAt: null,
                });
                console.log('ℹ️ Fallback: No secrets document found (not yet configured)');
              }
            } catch (secretsError: any) {
              // Permission error is expected - organization_secrets is server-side only
              if (secretsError?.code === 'permission-denied') {
                console.log('ℹ️ Secrets metadata not accessible from client (server-side only for security)');
              } else {
                console.warn('Could not fetch secrets metadata:', secretsError?.message || secretsError);
              }

              // Set empty metadata (secrets will show as "not configured")
              setSecretsMetadata({
                hasChannelSecret: false,
                hasChannelAccessToken: false,
                channelSecretMasked: '',
                channelAccessTokenMasked: '',
                channelSecretLength: 0,
                channelAccessTokenLength: 0,
                secretsUpdatedAt: null,
              });
            }
          }
        } catch (firestoreError) {
          console.error('Error fetching from Firestore:', firestoreError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [userData, user]);

  const handleTestConnection = async () => {
    if (!user) return;

    setTestingConnection(true);
    setConnectionResult(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/line/verify-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      setConnectionResult(result);

      // Auto-hide success message after 5 seconds
      if (result.success) {
        setTimeout(() => setConnectionResult(null), 5000);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionResult({
        success: false,
        message: '接続テストに失敗しました。',
      });
    } finally {
      setTestingConnection(false);
    }
  };

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

      // Check if secrets need to be updated
      const hasSecretUpdates = lineChannelSecret || lineAccessToken;

      // Only include secrets if they've been changed (not empty)
      if (lineChannelSecret) {
        updateData.lineChannelSecret = lineChannelSecret;
      }
      if (lineAccessToken) {
        updateData.lineChannelAccessToken = lineAccessToken;
      }

      // Try to update settings via API first
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        console.log('✅ Settings saved via API');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        // Clear secret fields after successful save
        setLineChannelSecret('');
        setLineAccessToken('');
      } catch (apiError) {
        console.error('API save failed, using Firestore fallback:', apiError);

        // Fallback: Save directly to Firestore
        if (hasSecretUpdates) {
          alert('⚠️ セキュリティ上の理由により、LINE認証情報の更新にはサーバーAPIが必要です。\n\n他の設定のみ保存します。');
        }

        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        // Update public organization info only (no secrets)
        const orgRef = doc(db, 'organizations', userData.organizationId);
        await updateDoc(orgRef, {
          name: orgName.trim(),
          lineChannelId: lineChannelId.trim(),
          liffId: liffId.trim(),
          companyName: companyName.trim(),
          primaryColor,
          updatedAt: Timestamp.now(),
        });

        console.log('✅ Settings saved via Firestore (public info only)');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        // Don't clear secret fields if they weren't saved
        if (!hasSecretUpdates) {
          setLineChannelSecret('');
          setLineAccessToken('');
        }
      }
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
    <div className="space-y-6 max-w-3xl relative">
      {/* Warning Banner - shown above overlay (shown if user is authenticated and hasn't purchased support) */}
      {!hasPurchasedSupport && userData?.organizationId && (
        <div className="fixed top-16 left-0 lg:left-64 right-0 z-[60] bg-amber-50 border-b-2 border-amber-400 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">設定ページのご利用にはサポートサービスが必要です</h3>
                  <p className="text-xs text-amber-800 mt-1">LINE連携の初期設定サポートと使い方レクチャーが含まれます</p>
                </div>
              </div>
              <Link
                href="/dashboard/subscription"
                className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md"
              >
                サポートプランを見る
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Support Service Overlay */}
      {!hasPurchasedSupport && userData?.organizationId && (
        <SupportServiceOverlay organizationId={userData.organizationId} />
      )}

      {/* Main Content - blurred when overlay is shown */}
      <div className={!hasPurchasedSupport ? 'filter blur-sm pointer-events-none select-none' : ''}>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="lineChannelSecret">LINE Channel Secret</Label>
                {secretsMetadata && (
                  <div className="text-xs text-gray-500">
                    {secretsMetadata.hasChannelSecret ? (
                      <span className="text-green-600 font-medium">✅ 設定済み ({secretsMetadata.channelSecretLength}文字)</span>
                    ) : (
                      <span className="text-amber-600 font-medium">❌ 未設定</span>
                    )}
                  </div>
                )}
              </div>
              {secretsMetadata?.hasChannelSecret && secretsMetadata.channelSecretMasked && (
                <div className="bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                  <p className="text-xs text-gray-600 font-mono">
                    {secretsMetadata.channelSecretMasked}
                  </p>
                  {secretsMetadata.secretsUpdatedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      最終更新: {new Date(secretsMetadata.secretsUpdatedAt._seconds * 1000).toLocaleString('ja-JP')}
                    </p>
                  )}
                </div>
              )}
              <Input
                id="lineChannelSecret"
                type={showFullSecret ? "text" : "password"}
                value={lineChannelSecret}
                onChange={(e) => {
                  setLineChannelSecret(e.target.value);
                  if (showFullSecret) {
                    setTimeout(() => setShowFullSecret(false), 5000);
                  }
                }}
                placeholder="変更する場合のみ入力"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  変更する場合のみ入力してください
                </p>
                {lineChannelSecret && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFullSecret(!showFullSecret);
                      if (!showFullSecret) {
                        setTimeout(() => setShowFullSecret(false), 5000);
                      }
                    }}
                    className="text-xs"
                  >
                    {showFullSecret ? '🙈 非表示' : '👁️ 表示 (5秒間)'}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lineAccessToken">LINE Channel Access Token</Label>
                {secretsMetadata && (
                  <div className="text-xs text-gray-500">
                    {secretsMetadata.hasChannelAccessToken ? (
                      <span className="text-green-600 font-medium">✅ 設定済み ({secretsMetadata.channelAccessTokenLength}文字)</span>
                    ) : (
                      <span className="text-amber-600 font-medium">❌ 未設定</span>
                    )}
                  </div>
                )}
              </div>
              {secretsMetadata?.hasChannelAccessToken && secretsMetadata.channelAccessTokenMasked && (
                <div className="bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                  <p className="text-xs text-gray-600 font-mono">
                    {secretsMetadata.channelAccessTokenMasked}
                  </p>
                  {secretsMetadata.secretsUpdatedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      最終更新: {new Date(secretsMetadata.secretsUpdatedAt._seconds * 1000).toLocaleString('ja-JP')}
                    </p>
                  )}
                </div>
              )}
              <Input
                id="lineAccessToken"
                type={showFullToken ? "text" : "password"}
                value={lineAccessToken}
                onChange={(e) => {
                  setLineAccessToken(e.target.value);
                  if (showFullToken) {
                    setTimeout(() => setShowFullToken(false), 5000);
                  }
                }}
                placeholder="変更する場合のみ入力"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  変更する場合のみ入力してください
                </p>
                {lineAccessToken && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFullToken(!showFullToken);
                      if (!showFullToken) {
                        setTimeout(() => setShowFullToken(false), 5000);
                      }
                    }}
                    className="text-xs"
                  >
                    {showFullToken ? '🙈 非表示' : '👁️ 表示 (5秒間)'}
                  </Button>
                )}
              </div>
            </div>

            {/* Connection Test */}
            {secretsMetadata?.hasChannelAccessToken && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full"
                >
                  {testingConnection ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      接続テスト中...
                    </>
                  ) : (
                    <>
                      🔌 LINE API 接続テスト
                    </>
                  )}
                </Button>

                {connectionResult && (
                  <div className={`mt-3 p-3 rounded-md border ${
                    connectionResult.success
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="text-sm font-medium">{connectionResult.message}</p>
                    {connectionResult.botInfo && (
                      <div className="mt-2 text-xs">
                        <p>ボット名: {connectionResult.botInfo.displayName}</p>
                        {connectionResult.botInfo.basicId && (
                          <p>Basic ID: {connectionResult.botInfo.basicId}</p>
                        )}
                      </div>
                    )}
                    {connectionResult.details && (
                      <p className="text-xs mt-1">{connectionResult.details}</p>
                    )}
                  </div>
                )}
              </div>
            )}

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
    </div>
  );
}
