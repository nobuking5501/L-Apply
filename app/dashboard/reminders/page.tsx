'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Save, Bell, Clock, Trash2, Sparkles } from 'lucide-react';

interface ReminderTemplate {
  id?: string;
  organizationId: string;
  reminderType: string;
  delayDays: number;
  timeOfDay: string; // Format: "HH:mm"
  message: string;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

export default function RemindersPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null);

  const emptyTemplate: Omit<ReminderTemplate, 'id' | 'organizationId' | 'createdAt'> = {
    reminderType: 'custom',
    delayDays: 1,
    timeOfDay: '09:00',
    message: '',
    isActive: true,
  };

  const [formData, setFormData] = useState(emptyTemplate);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // メッセージテンプレート（ひな形）
  const messageTemplates = [
    {
      id: 't-24h',
      name: 'T-24h リマインダー（24時間前）',
      delayDays: 1,
      timeOfDay: '14:00',
      message: `⏰ 【リマインダー】明日{time}から開始です

{plan}

🔗 参加方法
[参加方法をここに記載してください]

ご都合が悪い場合は「キャンセル」と返信ください。`,
    },
    {
      id: 'day-of-morning',
      name: '当日朝リマインダー（朝8時）',
      delayDays: 0,
      timeOfDay: '08:00',
      message: `🔔 【本日開催】{time}スタートです

{plan}

🔗 参加方法
[参加方法をここに記載してください]

5分前には準備をお願いします！`,
    },
    {
      id: 'day-of-1hour',
      name: '当日1時間前リマインダー',
      delayDays: 0,
      timeOfDay: '13:00', // 14:00開始の1時間前を想定
      message: `⏰ あと1時間で開始です！

{plan}

開始時刻: {time}

🔗 参加方法
[参加方法をここに記載してください]

準備をお願いします！`,
    },
    {
      id: 't-3days',
      name: '3日前リマインダー',
      delayDays: 3,
      timeOfDay: '10:00',
      message: `📅 3日後のイベントのお知らせ

{plan}

📅 日時: {time}開始

イベントを楽しみにお待ちください！

参加方法の詳細は、前日にお送りします。`,
    },
    {
      id: 't-7days',
      name: '1週間前リマインダー',
      delayDays: 7,
      timeOfDay: '10:00',
      message: `📢 来週のイベントのご案内

{plan}

📅 日時: {time}開始

ご予定の確認をお願いします。

当日お会いできることを楽しみにしております！`,
    },
    {
      id: 'preparation',
      name: '事前準備リマインダー',
      delayDays: 2,
      timeOfDay: '18:00',
      message: `📝 【事前準備のお願い】

{plan}

開催日時: {time}

【事前にご準備いただきたいこと】
✅ Zoomのインストール・動作確認
✅ 静かな環境の確保
✅ メモ・筆記用具の準備

当日スムーズにご参加いただけるよう、ご準備をお願いいたします。`,
    },
  ];

  // デフォルトのリマインダー設定
  const defaultReminders = [
    {
      reminderType: 'T-24h',
      delayDays: 1,
      timeOfDay: '14:00',
      message: `⏰ 【リマインダー】明日{time}から開始です

{plan}

🔗 参加方法
[参加方法をここに記載してください]

ご都合が悪い場合は「キャンセル」と返信ください。`,
      isActive: true,
    },
    {
      reminderType: 'day-of',
      delayDays: 0,
      timeOfDay: '08:00',
      message: `🔔 【本日開催】{time}スタートです

{plan}

🔗 参加方法
[参加方法をここに記載してください]

5分前には準備をお願いします！`,
      isActive: true,
    },
  ];

  const handleImportDefaults = async () => {
    if (!userData?.organizationId) return;
    if (!confirm('デフォルトのリマインダー設定をインポートしますか？\n既存の設定は削除されません。')) {
      return;
    }

    try {
      for (const reminder of defaultReminders) {
        const templateData: ReminderTemplate = {
          ...reminder,
          organizationId: userData.organizationId,
          createdAt: new Date(),
        };
        const newDocRef = doc(collection(db, 'reminder_message_templates'));
        await setDoc(newDocRef, templateData);
      }

      fetchTemplates();
      alert('デフォルトリマインダーをインポートしました');
    } catch (error) {
      console.error('Error importing defaults:', error);
      alert('インポートに失敗しました');
    }
  };

  const fetchTemplates = async () => {
    if (!userData?.organizationId) return;

    try {
      const templatesQuery = query(
        collection(db, 'reminder_message_templates'),
        where('organizationId', '==', userData.organizationId)
      );
      const snapshot = await getDocs(templatesQuery);
      const templatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ReminderTemplate[];

      // ソート: delayDays降順（日数が多い順）
      templatesData.sort((a, b) => b.delayDays - a.delayDays);

      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [userData]);

  const handleOpenDialog = (template?: ReminderTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        reminderType: template.reminderType,
        delayDays: template.delayDays,
        timeOfDay: template.timeOfDay,
        message: template.message,
        isActive: template.isActive,
      });
    } else {
      setEditingTemplate(null);
      setFormData(emptyTemplate);
    }
    setSelectedTemplate('');
    setDialogOpen(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);

    const template = messageTemplates.find((t) => t.id === templateId);

    if (template) {
      setFormData({
        ...formData,
        delayDays: template.delayDays,
        timeOfDay: template.timeOfDay,
        message: template.message,
      });
    }
  };

  const handleSave = async () => {
    if (!userData?.organizationId) return;

    // サブスクリプション制限のチェック（新規作成時のみ）
    if (!editingTemplate?.id) {
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
        if (!orgDoc.exists()) {
          alert('組織情報が見つかりません');
          return;
        }

        const orgData = orgDoc.data();
        const subscription = orgData.subscription || {
          limits: { maxReminders: 3 },
        };

        // 現在のリマインダー数をカウント
        const currentRemindersCount = templates.length;

        if (currentRemindersCount >= subscription.limits.maxReminders) {
          alert(
            `リマインダー数の上限（${subscription.limits.maxReminders}件）に達しています。\n\nプランをアップグレードするには、サイドバーの「サブスクリプション」をご確認ください。`
          );
          return;
        }
      } catch (error) {
        console.error('Error checking subscription limits:', error);
        alert('サブスクリプション情報の確認に失敗しました');
        return;
      }
    }

    try {
      const templateData: ReminderTemplate = {
        ...formData,
        organizationId: userData.organizationId,
        createdAt: editingTemplate?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (editingTemplate?.id) {
        await setDoc(doc(db, 'reminder_message_templates', editingTemplate.id), templateData);
      } else {
        const newDocRef = doc(collection(db, 'reminder_message_templates'));
        await setDoc(newDocRef, templateData);
      }

      fetchTemplates();
      setDialogOpen(false);
      setEditingTemplate(null);
      setFormData(emptyTemplate);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('このリマインダーを削除しますか？')) return;

    try {
      await deleteDoc(doc(db, 'reminder_message_templates', templateId));
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('削除に失敗しました');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">リマインダー設定</h2>
          <p className="text-sm text-gray-600 mt-1">
            カードをクリックして編集できます
          </p>
        </div>
        <div className="flex space-x-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={handleImportDefaults}>
              <Sparkles className="h-4 w-4 mr-2" />
              デフォルトをインポート
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            リマインダーを追加
          </Button>
        </div>
      </div>

      {/* リマインダー一覧 */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">設定済みリマインダー</h3>
        </div>

        {templates.length === 0 ? (
          <Card
            className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all border-dashed"
            onClick={() => handleOpenDialog()}
          >
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-medium text-gray-900 mb-1">
                リマインダーを設定
              </h4>
              <p className="text-sm text-gray-500 mb-2">
                クリックして設定する
              </p>
              <p className="text-xs text-gray-400">
                セミナー前に参加者へリマインド通知を送信
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                onClick={() => handleOpenDialog(template)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {template.delayDays === 0
                            ? `当日 ${template.timeOfDay}`
                            : `${template.delayDays}日前 ${template.timeOfDay}`}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {template.reminderType === 'T-24h' && 'T-24h リマインダー'}
                          {template.reminderType === 'day-of' && '当日リマインダー'}
                          {template.reminderType === 'custom' && 'カスタムリマインダー'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!template.isActive && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          無効
                        </span>
                      )}
                      {template.isActive && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                          有効
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id!);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-24 overflow-hidden">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans line-clamp-3">
                      {template.message}
                    </pre>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">
                      📅 セミナーの{template.delayDays === 0 ? '当日' : `${template.delayDays}日前`}の {template.timeOfDay} に送信
                    </div>
                    <span className="text-xs text-blue-600">編集 →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'リマインダーを編集' : 'リマインダーを作成'}
            </DialogTitle>
            <DialogDescription>
              セミナー開催前に参加者へリマインド通知を送信します（変数: {'{plan}'}, {'{time}'}）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* テンプレート選択 */}
            <div>
              <Label htmlFor="template">メッセージテンプレート</Label>
              <select
                id="template"
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">-- ひな形を選択 --</option>
                {messageTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ひな形を選択すると、日数・時刻・メッセージ欄に自動入力されます
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delayDays">何日前に送信</Label>
                <Input
                  id="delayDays"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.delayDays}
                  onChange={(e) =>
                    setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = 当日、1 = 1日前、2 = 2日前...
                </p>
              </div>
              <div>
                <Label htmlFor="timeOfDay">送信時刻</Label>
                <Input
                  id="timeOfDay"
                  type="time"
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  24時間形式（例: 14:00）
                </p>
              </div>
            </div>

            {/* 送信タイミングのプレビュー */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs font-medium text-blue-900 mb-1">📌 送信タイミングの例</p>
              <p className="text-xs text-blue-700">
                {formData.delayDays === 0
                  ? `セミナー当日の ${formData.timeOfDay} に送信`
                  : `セミナーの ${formData.delayDays} 日前の ${formData.timeOfDay} に送信`}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                例: 2025年12月10日 14:00のセミナー →{' '}
                {formData.delayDays === 0
                  ? `2025年12月10日 ${formData.timeOfDay}`
                  : `2025年12月${10 - formData.delayDays}日 ${formData.timeOfDay}`}
                に送信
              </p>
            </div>

            <div>
              <Label htmlFor="message">メッセージ内容</Label>
              <textarea
                id="message"
                rows={14}
                className="w-full px-3 py-2 border rounded-md font-sans text-sm"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="ここにメッセージを入力してください..."
              />
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                <p>改行や絵文字も使用できます</p>
                <p className="font-medium">使用可能な変数:</p>
                <p className="font-mono">{'{plan}'} = プラン名</p>
                <p className="font-mono">{'{time}'} = セミナー開始時刻</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                このリマインダーを有効にする
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
