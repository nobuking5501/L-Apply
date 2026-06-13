'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plug,
  Key,
  Copy,
  CheckCircle,
  Trash2,
  Plus,
  AlertCircle,
  Terminal,
  Phone,
  Search,
  Link as LinkIcon,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  isActive: boolean;
  createdAt: string | null;
  lastUsedAt: string | null;
}

export default function ApiIntegrationPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIdToken = async () => {
    if (!user) return null;
    return user.getIdToken();
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch('/api/dashboard/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch('/api/dashboard/api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeyValue(data.key);
        setNewKeyName('');
        await fetchKeys();
      } else {
        const err = await res.json();
        alert(err.error ?? 'APIキーの作成に失敗しました');
      }
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm('このAPIキーを無効化しますか？この操作は取り消せません。')) return;
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch(`/api/dashboard/api-keys?id=${keyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) await fetchKeys();
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const eventsEndpoint = `${baseUrl}/api/external/events`;
  const applicationsEndpoint = `${baseUrl}/api/external/applications`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">外部API連携</h2>
        <p className="text-sm text-gray-600 mt-1">
          AI電話秘書など外部アプリからL-Applyを操作するためのAPI情報です
        </p>
      </div>

      {/* New key reveal banner */}
      {newKeyValue && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-800">APIキーを発行しました</p>
                <p className="text-sm text-green-700 mt-1">
                  このキーは一度しか表示されません。必ずコピーして安全な場所に保存してください。
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <code className="flex-1 min-w-0 bg-white border border-green-200 rounded px-3 py-2 text-sm font-mono break-all">
                    {newKeyValue}
                  </code>
                  <Button
                    size="sm"
                    className="flex-shrink-0 bg-green-600 hover:bg-green-700"
                    onClick={() => copyText(newKeyValue, 'new-key')}
                  >
                    {copiedId === 'new-key' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setNewKeyValue(null)}
            >
              閉じる
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Key management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            APIキー管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="キー名（例：AI電話秘書）"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createKey()}
              className="max-w-xs"
            />
            <Button
              onClick={createKey}
              disabled={creating || !newKeyName.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              {creating ? '発行中...' : '新規発行'}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">読み込み中...</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              APIキーがありません。上のフォームから発行できます。
            </p>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{k.name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {k.prefix}••••••••••••••••••
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      発行:{' '}
                      {k.createdAt
                        ? new Date(k.createdAt).toLocaleDateString('ja-JP')
                        : '-'}
                      {k.lastUsedAt &&
                        ` | 最終利用: ${new Date(k.lastUsedAt).toLocaleDateString('ja-JP')}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeKey(k.id)}
                    className="ml-3 flex-shrink-0 text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            接続情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">ベースURL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded">
                {baseUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyText(baseUrl, 'base-url')}
              >
                {copiedId === 'base-url' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">認証ヘッダー</p>
            <code className="block text-sm bg-gray-100 px-3 py-2 rounded">
              X-API-Key: lappy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Available endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            利用できる連携機能
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GET events */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 bg-blue-50 px-4 py-2.5 border-b">
              <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                GET
              </span>
              <code className="text-sm break-all">/api/external/events</code>
              <span className="ml-auto text-sm text-blue-700 flex items-center gap-1">
                <Search className="h-3 w-3" />
                空き状況確認・代替日程提案
              </span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                公開中のイベント一覧と各日程の残席数を返します。
                AI電話秘書はこのAPIで「〇月〇日は空きがあります」「満席ですが△月△日なら空きがあります」と案内できます。
              </p>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  リクエスト例
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto leading-relaxed">
{`curl -X GET \\
  ${eventsEndpoint} \\
  -H "X-API-Key: lappy_your_key_here"`}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() =>
                      copyText(
                        `curl -X GET \\\n  ${eventsEndpoint} \\\n  -H "X-API-Key: lappy_your_key_here"`,
                        'curl-events'
                      )
                    }
                  >
                    {copiedId === 'curl-events' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  レスポンス例
                </p>
                <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "events": [
    {
      "id": "evt_abc123",
      "title": "体験セミナー",
      "location": "東京会場",
      "slots": [
        {
          "id": "slot_001",
          "date": "2026-07-10",
          "time": "10:00",
          "startAt": "2026-07-10T01:00:00.000Z",
          "capacity": 10,
          "applicationCount": 7,
          "availableCount": 3,
          "isAvailable": true,
          "isFuture": true
        }
      ],
      "nextAvailableSlot": { ... }
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* POST applications */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 bg-green-50 px-4 py-2.5 border-b">
              <span className="text-xs font-bold bg-green-600 text-white px-2 py-0.5 rounded">
                POST
              </span>
              <code className="text-sm break-all">/api/external/applications</code>
              <span className="ml-auto text-sm text-green-700 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                電話申込み登録
              </span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                電話で受け付けた申込みをL-Applyに登録します。
                登録後は管理画面の申込者一覧に「電話申込み」として表示されます。
                満席の場合は 409 エラーが返るので、代替日程をAIが案内できます。
              </p>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  リクエストボディ
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border px-2 py-1.5 text-left font-medium">フィールド</th>
                        <th className="border px-2 py-1.5 text-left font-medium">型</th>
                        <th className="border px-2 py-1.5 text-left font-medium">必須</th>
                        <th className="border px-2 py-1.5 text-left font-medium">説明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['eventId', 'string', '必須', 'イベントID（/events レスポンスの id）'],
                        ['slotId', 'string', '必須', 'スロットID（slots[].id）'],
                        ['slotAt', 'string', '必須', 'ISO 8601形式の日時（例: 2026-07-10T10:00:00+09:00）'],
                        ['applicantName', 'string', '必須', '申込者の氏名'],
                        ['applicantPhone', 'string', '任意', '電話番号'],
                        ['notes', 'string', '任意', '備考・メモ'],
                      ].map(([field, type, req, desc]) => (
                        <tr key={field}>
                          <td className="border px-2 py-1.5 font-mono">{field}</td>
                          <td className="border px-2 py-1.5 text-gray-500">{type}</td>
                          <td className="border px-2 py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs ${
                                req === '必須'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {req}
                            </span>
                          </td>
                          <td className="border px-2 py-1.5 text-gray-600">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  リクエスト例
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto leading-relaxed">
{`curl -X POST \\
  ${applicationsEndpoint} \\
  -H "X-API-Key: lappy_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventId": "evt_abc123",
    "slotId": "slot_001",
    "slotAt": "2026-07-10T10:00:00+09:00",
    "applicantName": "山田太郎",
    "applicantPhone": "090-1234-5678",
    "notes": "電話にて受付"
  }'`}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() =>
                      copyText(
                        `curl -X POST \\\n  ${applicationsEndpoint} \\\n  -H "X-API-Key: lappy_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"eventId":"evt_abc123","slotId":"slot_001","slotAt":"2026-07-10T10:00:00+09:00","applicantName":"山田太郎","applicantPhone":"090-1234-5678"}'`,
                        'curl-apply'
                      )
                    }
                  >
                    {copiedId === 'curl-apply' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  レスポンス例（成功 201）
                </p>
                <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "applicationId": "app_xyz789",
  "message": "申込みを受け付けました"
}`}
                </pre>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  レスポンス例（満席 409）
                </p>
                <pre className="bg-gray-900 text-red-400 rounded p-3 text-xs overflow-x-auto leading-relaxed">
{`{
  "error": "この日程は満席です",
  "availableCount": 0,
  "capacity": 10,
  "applicationCount": 10
}`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI phone secretary flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            AI電話秘書との連携フロー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-gray-700">
            {[
              ['電話着信', 'AI電話秘書が電話を受け、申込希望の日程を確認'],
              [
                '空き確認',
                `GET /api/external/events を呼び出してスロット一覧と availableCount を確認`,
              ],
              [
                '案内',
                '空きあり → 「〇月〇日は申込み可能です」\n満席 → nextAvailableSlot を使って「△月△日なら空きがあります」と案内',
              ],
              [
                '申込み登録',
                `POST /api/external/applications で申込みを登録。201 返却で完了。`,
              ],
              ['管理画面反映', '申込者一覧に「電話申込み」バッジ付きで即時表示'],
            ].map(([step, desc], i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <span className="font-medium">{step}</span>
                  <p className="text-gray-500 mt-0.5 whitespace-pre-line">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 space-y-1">
              <p className="font-medium">注意事項</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>APIキーは秘密情報です。第三者に共有しないでください</li>
                <li>電話申込みはLINEリマインダーの送信対象外です</li>
                <li>満席の日程への登録はエラー（409）になります</li>
                <li>APIキーは組織ごとに最大5つまで発行できます</li>
                <li>
                  APIキーの平文は発行時の1回のみ表示されます。紛失した場合は再発行してください
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
